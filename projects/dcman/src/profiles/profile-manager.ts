import { exec, importInquirer, readYamlFile, writeYamlFile } from "@cpdevtools/lib-node-utilities";
import { existsSync } from "fs";
import { DCM_CONFIG_DIR } from "../constants";
import { GithubSession } from "../github";

import { glob } from "fast-glob";
import { cp, realpath, rm, symlink, unlink, mkdir } from "fs/promises";
import { dirname } from "path";

const PROFILES_DIR = `${DCM_CONFIG_DIR}/profiles`;
const PROFILE_DIR = `${DCM_CONFIG_DIR}/profile`;

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

  private constructor() {}

  private get basePath() {
    return (async () => {
      const inst = await GithubSession.instance;
      const authStatus = await inst.authStatus;
      return `${PROFILES_DIR}/${authStatus?.username}`;
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

  public async hasProfile(source: string, profile: string) {
    if (profile === "default") {
      profile = await this._getDefaultProfileName(source);
    }
    return existsSync(`${await this.basePath}/${source}/${profile}/profile.yml`);
  }

  private async _getDefaultProfileName(source: string): Promise<string> {
    return (await this._readProfileSourceConfig(source)).defaultProfile || "default";
  }
  private async _readProfile(): Promise<Profile | undefined>;
  private async _readProfile(id: string): Promise<Profile | undefined>;
  private async _readProfile(id?: string): Promise<Profile | undefined> {
    const basePath = await this.basePath;
    const parts = id?.split("#");
    const path = !id ? `${PROFILE_DIR}/profile.yml` : `${basePath}/${parts![0]}/profiles/${parts![1]}/profile.yml`;
    if (existsSync(path)) {
      return await readYamlFile(path);
    }
    return undefined;
  }

  private async _readProfileSourceConfig(source: string): Promise<ProfileSourceConfig> {
    return await readYamlFile(`${await this.basePath}/${source}/profiles.yml`);
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
  private async _syncProfileSource(source: string) {
    if (await this.hasProfileSource(source)) {
      await exec(`gh repo sync ${source}`);
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
    await exec(`cd ${basePath}/${parts[0]} && gh repo create ${source} --clone --private --template cpdevtools/dcm-profiles-template`);
    await this._createProfile(source);

    /*
        const github = await GithubSession.instance;
        await github.api!.repos.createUsingTemplate({
            owner: parts[0],
            name: parts[1],
            template_owner: 'cpdevtools',
            template_repo: 'dcm-profiles-template'
        });
        console.log(`Cloning ${source} into ${basePath}/${source}...`);
        await exec(`gh repo clone ${source} ${basePath}/${source}`);
        */
  }

  private async _createProfile(source: string, profileName?: string, profileDescription?: string) {
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
      if (existsSync(PROFILE_DIR)) {
        return await this._path2ProfileId(await realpath(PROFILE_DIR));
      }
      return undefined;
    })();
  }

  public get activeProfile() {
    return (async () => {
      if (existsSync(PROFILE_DIR)) {
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
      if (existsSync(PROFILE_DIR)) {
        await unlink(PROFILE_DIR);
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
        if (existsSync(PROFILE_DIR)) {
          await unlink(PROFILE_DIR);
        }
        await symlink(profilePath, PROFILE_DIR, "dir");
      }
    }
  }

  private async _initialize() {
    // await this._loadProfilesConfig();
    const ttt = await this._readProfile();
  }

  // private async _loadProfilesConfig() {
  //     const configPath = `${await this.basePath}/${PROFILES_CONFIG_FILE}`;
  //     if (existsSync(configPath)) {
  //         this._profilesConfig = await readYamlFile(configPath);
  //     } else {
  //         await this._saveProfilesConfig();
  //     }

  // }

  // public async _saveProfilesConfig() {
  //     const configPath = `${await this.basePath}/${PROFILES_CONFIG_FILE}`;
  //     await writeYamlFile(configPath, this._profilesConfig);
  // }
}
