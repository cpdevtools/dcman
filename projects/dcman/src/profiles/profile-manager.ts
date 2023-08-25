import { exec, importInquirer, readYamlFile, writeYamlFile } from "@cpdevtools/lib-node-utilities";
import { existsSync } from "fs";
import { DCM_CONFIG_DIR, DCM_PROFILES_DIR, DCM_PROFILE_DIR } from "../constants";
import { GithubSession } from "../github";

import { glob } from "fast-glob";
import { cp, mkdir, realpath, rm, symlink, unlink } from "fs/promises";
import { dirname } from "path";
import { cwd } from "process";

export interface ProfileSourceItem {
  owner: string;
  repo: string;
}

export interface ProfileItem {
  id: string;
  source: ProfileSourceItem;
}

export interface Profile {
  id: string;
  name: string;
  source: ProfileSourceItem;
  description?: string;
}

export interface ProfilesConfig {
  activeProfile: string;
}

export interface ProfileSourceConfig {
  defaultProfile: string;
}

export class ProfileManager {
  private static _instancePromise: Promise<ProfileManager>;

  public static get instance(): Promise<ProfileManager> {
    if (!this._instancePromise) {
      this._instancePromise = new Promise<ProfileManager>(async (resolve, reject) => {
        try {
          const inst = new ProfileManager();
          await inst._initialize();
          resolve(inst);
        } catch (e) {
          reject(e);
        }
      });
    }
    return this._instancePromise;
  }

  public static async exitIfNoProfile() {
    const pm = await this.instance;
    if (!(await pm.activeProfile)) {
      console.error("No active profile. Please set an active profile with 'dcm profile set <profile>'");
      process.exit(1);
    }
  }

  private _activeProfilePromise?: Promise<Profile | undefined>;

  private constructor() {}

  public get basePath() {
    return (async () => {
      const inst = await GithubSession.instance;
      const authStatus = await inst.authStatus;
      return `${DCM_PROFILES_DIR}/${authStatus?.username}`;
    })();
  }

  public async getProfileSourceIds() {
    const basePath = await this.basePath;
    const files = await glob("*/*/profiles.yml", { cwd: basePath });
    const profileSourceIds = files.map(async (f) => await this._path2ProfilSourceId(`${basePath}/${dirname(f)}`));
    return (await Promise.all(profileSourceIds)).filter((p) => !!p) as string[];
  }

  public async getProfileIds() {
    const basePath = await this.basePath;
    const files = await glob("*/*/profiles/*/profile.yml", { cwd: basePath });
    const profileIds = files.map(async (f) => await this._path2ProfileId(`${basePath}/${dirname(f)}`));
    return (await Promise.all(profileIds)).filter((p) => !!p) as string[];
  }

  public async getProfiles(): Promise<ProfileItem[]> {
    return (await this.getProfileIds()).map((profileId) => {
      let parts = profileId.split("#");
      const id = parts.pop();
      parts = parts[0].split("/");
      const owner = parts[0];
      const repo = parts[1];
      return <ProfileItem>{
        id,
        source: {
          owner,
          repo,
        },
      };
    });
  }

  public async getProfileSources(): Promise<ProfileSourceItem[]> {
    return (await this.getProfileSourceIds()).map((sourceId) => {
      let parts = sourceId.split("/");
      const owner = parts[0];
      const repo = parts[1];
      return <ProfileSourceItem>{
        owner,
        repo,
      };
    });
  }

  public async hasProfileSource(source: string) {
    return existsSync(`${await this.basePath}/${source}/profiles.yml`);
  }

  public async hasProfile(profileId: string): Promise<boolean>;
  public async hasProfile(source: string, profile: string): Promise<boolean>;
  public async hasProfile(source: string, profile?: string): Promise<boolean> {
    if (profile === undefined) {
      const parts = source.split("#");
      source = parts[0];
      profile = parts[1] || "default";
    }

    if (profile === "default") {
      profile = await this._getDefaultProfileName(source);
    }
    const filePath = `${await this.basePath}/${source}/profiles/${profile}/profile.yml`;
    return existsSync(filePath);
  }

  private async _getDefaultProfileName(source: string): Promise<string> {
    return (await this._readProfileSourceConfig(source))?.defaultProfile || "default";
  }
  private async _readProfile(): Promise<Profile | undefined>;
  private async _readProfile(id: string): Promise<Profile | undefined>;
  private async _readProfile(id?: string): Promise<Profile | undefined> {
    const basePath = await this.basePath;
    const parts = id?.split("#");
    const path = !id ? `${DCM_PROFILE_DIR}/profile.yml` : `${basePath}/${parts![0]}/profiles/${parts![1]}/profile.yml`;
    if (existsSync(path)) {
      return await readYamlFile(path);
    }
    return undefined;
  }

  private async _readProfileSourceConfig(source: string): Promise<ProfileSourceConfig | undefined> {
    const path = `${await this.basePath}/${source}/profiles.yml`;
    if (existsSync(path)) {
      return await readYamlFile(path);
    }
    return undefined;
  }

  public async addProfileSource(source: string) {
    if (!(await this.hasProfileSource(source))) {
      const basePath = await this.basePath;
      const activeProfile = await this.activeProfileId;

      await exec(`gh repo clone ${source} ${basePath}/${source}`);
      await this._validateProfileSource(source);

      if (!activeProfile) {
        await this.setActiveProfile(source);
      }
    } else {
      console.warn("Profile source already exists.");
    }
  }

  private async _validateProfileSource(source: string) {
    if (!(await this.hasProfileSource(source))) {
      throw new Error(`Profile source ${source} does not exist.`);
    }
  }
  private async _syncProfileSource(source: string, msg: string = "sync") {
    if (await this.hasProfileSource(source)) {
      const basePath = await this.basePath;
      const cwd = `${basePath}/${source}`;
      await exec(`git add . > /dev/null 2>&1`, { cwd });
      await exec(`git commit -m "${msg}" > /dev/null 2>&1`, { cwd });
      await exec(`git pull > /dev/null`, { cwd });
      await exec(`git push > /dev/null 2>&1 `, { cwd });
    }
  }

  public async removeProfileSource(source: string, confirmDelete: boolean = false) {
    if (!(await this.hasProfileSource(source))) {
      console.info("Profile source does not exist.");
    } else {
      if (confirmDelete) {
        const prompt = (await importInquirer()).prompt;
        const { confirm } = await prompt<{ confirm: boolean }>([
          {
            type: "confirm",
            name: "confirm",
            message: `Are you sure you want to delete profile source ${source}?`,
          },
        ]);
        if (!confirm) {
          return;
        }
      }

      const sourcePath = `${await this.basePath}/${source}`;
      const activeProfileId = await this.activeProfileId;

      if (activeProfileId?.startsWith(`${source}#`)) {
        this.setActiveProfile(null);
      }
      await rm(sourcePath, { recursive: true, force: true });
    }
  }

  public async createProfileSource(source: string) {
    const parts = source.split("/");
    if (parts.length !== 2) {
      throw new Error("Invalid source format. Must be in the form of owner/repo.");
    }

    const basePath = await this.basePath;

    await mkdir(`${basePath}/${source}`, { recursive: true });
    await exec(`gh repo create ${source} --clone --private --template cpdevtools/dcm-profiles-template`, {
      cwd: `${basePath}/${parts[0]}`,
    });
    await this.createProfile(source);
  }

  public async createProfile(source: string, profileName?: string, profileDescription?: string) {
    const prompt = (await importInquirer()).prompt;
    if (!profileName) {
      const { name } = await prompt([
        {
          type: "input",
          name: "name",
          message: `Profile name:`,
          default: "default",
        },
      ]);
      profileName = name;
    }
    if (!profileDescription) {
      const { description } = await prompt([
        {
          type: "input",
          name: "description",
          message: `Profile description:`,
          default: "",
        },
      ]);
      profileDescription = description;
    }

    const profileSourcePath = `${await this.basePath}/${source}`;
    const profilePath = `${profileSourcePath}/profiles/${profileName}`;

    await cp(`${profileSourcePath}/profile-tpl`, `${profilePath}`, { recursive: true, force: true });

    const profileConfig = (await this._readProfile(`${source}#${profileName}`))!;
    profileConfig.name = profileName!;
    profileConfig.description = profileDescription;
    await writeYamlFile(`${profilePath}/profile.yml`, profileConfig);
    await this._syncProfileSource(source);
  }

  private async _path2ProfilSourceId(profilePath: string): Promise<string | undefined> {
    if (profilePath?.startsWith(await this.basePath)) {
      const parts = profilePath.replace(`${await this.basePath}/`, "").split("/");
      return `${parts[0]}/${parts[1]}`;
    }
    return undefined;
  }

  private async _path2ProfileId(profilePath: string): Promise<string | undefined> {
    if (profilePath?.startsWith(await this.basePath)) {
      const parts = profilePath.replace(`${await this.basePath}/`, "").split("/");
      return `${parts[0]}/${parts[1]}#${parts.pop()}`;
    }
    return undefined;
  }

  public get activeProfileId() {
    return (async () => {
      if (existsSync(DCM_PROFILE_DIR)) {
        return await this._path2ProfileId(await realpath(DCM_PROFILE_DIR));
      }
      return undefined;
    })();
  }

  public get activeProfile() {
    return (async () => {
      if (existsSync(DCM_PROFILE_DIR)) {
        return {
          id: await this.activeProfileId,
          ...(await this._readProfile()),
        };
      }
      return undefined;
    })();
  }

  public async setActiveProfile(source: string | null): Promise<void>;
  public async setActiveProfile(source: string, profile: string): Promise<void>;
  public async setActiveProfile(source: string | null, profile?: string) {
    if (source === null) {
      if (existsSync(DCM_PROFILE_DIR)) {
        await unlink(DCM_PROFILE_DIR);
      }
      return;
    }

    if (source.includes("#")) {
      profile = source.split("#")[1];
      source = source.split("#")[0];
    } else {
      profile = profile || "default";
    }

    if (!(await this.hasProfileSource(source))) {
      console.info("Profile source does not exist.");
    } else {
      if (profile === "default") {
        profile = await this._getDefaultProfileName(source);
      }
      const profilePath = `${await this.basePath}/${source}/profiles/${profile}`;
      if (existsSync(profilePath)) {
        if (existsSync(DCM_PROFILE_DIR)) {
          await unlink(DCM_PROFILE_DIR);
        }
        await symlink(profilePath, DCM_PROFILE_DIR, "dir");
        await this._syncProfileSource(source);
      }
    }
  }

  public get activeConfig() {
    return this._activeProfilePromise!;
  }

  public async sync(msg?: string, profileId?: string) {
    profileId ??= await this.activeProfileId;
    if (profileId) {
      const parts = profileId.split("#");
      await this._syncProfileSource(parts[0], msg);
    }
  }

  private async _initialize() {
    const activeProfileId = await this.activeProfileId;
    if (activeProfileId) {
      await this._syncProfileSource(activeProfileId.split("#")[0]);
      this._activeProfilePromise = this._readProfile();
    } else {
      this._activeProfilePromise = Promise.resolve(undefined);
    }
  }
}
