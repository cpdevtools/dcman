import {
  exec,
  importInquirer,
  readJsonFile,
  readYamlFile,
  translateWslPath,
  writeJsonFile,
  writeYamlFile,
} from "@cpdevtools/lib-node-utilities";
import { spawn } from "child_process";
import { glob } from "fast-glob";
import { existsSync } from "fs";
import { mkdir, rename, rm, rmdir } from "fs/promises";
import isWsl from "is-wsl";
import { dirname, extname } from "path";
import { DCM_CONTAINER_REPOS_DIR, DCM_PROFILE_DIR } from "../constants";
import { GithubSession } from "../github";
import { ProfileManager } from "../profiles";
import { DevContainerConfig } from "./DevContainerConfig";
import { DevContainerGHRepo } from "./DevContainerGHRepo";
import { DevContainerGHRepoKey } from "./DevContainerGHRepoKey";
import { getDevcontainerPath, parseDevContainerGHRepoKey } from "./dev-container-util";

const PROFILE_DEV_CONTAINER_LIST_FILENAME = `devcontainers.yml`;
const PROFILE_DEV_CONTAINER_LIST_PATH = `${DCM_PROFILE_DIR}/${PROFILE_DEV_CONTAINER_LIST_FILENAME}`;

export interface DevContainerCreationOptions {
  templateOwner: string;
  templateRepo: string;
  owner: string;
  repo: string;
}

export class DevContainerManager {
  private static _instancePromise: Promise<DevContainerManager>;

  public static get instance(): Promise<DevContainerManager> {
    if (!this._instancePromise) {
      this._instancePromise = new Promise<DevContainerManager>(async (resolve, reject) => {
        try {
          const inst = new DevContainerManager();
          await inst._initialize();
          resolve(inst);
        } catch (e) {
          reject(e);
        }
      });
    }
    return this._instancePromise;
  }

  private __profileManager?: ProfileManager;

  private get _profileManager(): ProfileManager {
    return this.__profileManager!;
  }

  private __githubSession?: GithubSession;

  private get _githubSession(): GithubSession {
    return this.__githubSession!;
  }

  private get _githubApi() {
    return this._githubSession.api!;
  }

  private async _initialize() {
    this.__githubSession = await GithubSession.instance;
    this.__profileManager = await ProfileManager.instance;
  }

  private async _loadProfileDevContainerList() {
    if (existsSync(PROFILE_DEV_CONTAINER_LIST_PATH)) {
      return (await readYamlFile<string[]>(PROFILE_DEV_CONTAINER_LIST_PATH)) ?? [];
    }
    return [];
  }

  private async _findAllUsedDevcontainers() {
    const basePath = await (await ProfileManager.instance).basePath;
    const dcFiles = await glob(`*/*/profiles/*/${PROFILE_DEV_CONTAINER_LIST_FILENAME}`, { cwd: basePath, onlyFiles: true });

    const dcProms = dcFiles.map(async (dcFile) => {
      const dcPath = `${basePath}/${dcFile}`;
      return (await readYamlFile<string[]>(dcPath)) ?? [];
    });

    const devContainerIds: string[] = (await Promise.all(dcProms)).flat();
    return devContainerIds;
  }

  private async _saveProfileDevContainerList(list: string[]) {
    await writeYamlFile(PROFILE_DEV_CONTAINER_LIST_PATH, list);
    await this._profileManager.sync("Updated devcontainer list");
  }

  private async _loadDevContainerConfig(devContainerId: string): Promise<DevContainerConfig> {
    const configPath = `${getDevcontainerPath(devContainerId)}/.devcontainer/devcontainer.json`;
    const config = await readJsonFile<DevContainerConfig>(configPath);
    return config ?? {};
  }

  private async _loadDevContainerGHRepo(devContainerId: string): Promise<DevContainerGHRepo> {
    const key = parseDevContainerGHRepoKey(devContainerId);

    const requests = [
      this._githubApi.repos.listBranches({
        owner: key.owner,
        repo: key.repo,
      }),
      this._githubApi.repos.listTags({
        owner: key.owner,
        repo: key.repo,
      }),
      this._githubApi.repos.get({
        owner: key.owner,
        repo: key.repo,
      }),
    ] as const;

    const [branches, tags, repo] = await Promise.all(requests);
    return {
      ...key,
      branches: branches.data ?? [],
      tags: tags.data ?? [],
      defaultBranch: repo.data.default_branch,
      branchOrTag: key.branchOrTag ?? repo.data.default_branch,
    };
  }

  public async addDevContainer(devContainerId: string) {
    const info = await this._loadDevContainerGHRepo(devContainerId);
    devContainerId = `${info.owner}/${info.repo}#${info.branchOrTag}`;
    const hasDevContainer = await this.hasDevContainer(devContainerId);
    const hasActiveDevContainer = await this.hasActiveDevContainer(devContainerId);

    if (hasActiveDevContainer) {
      throw new Error(`Dev container ${devContainerId} already exists`);
    } else if (!hasDevContainer) {
      await this._downloadDevContainer(devContainerId);
    }
    await this._addDevContainerToProfile(devContainerId);
  }

  private async _addDevContainerToProfile(devContainerId: string) {
    const devcontainers = await this._loadProfileDevContainerList();
    if (!devcontainers.includes(devContainerId)) {
      devcontainers.push(devContainerId);
      await this._saveProfileDevContainerList(devcontainers);
    }
  }

  public async removeDevContainer(devContainerId: string) {
    const info = await this._loadDevContainerGHRepo(devContainerId);
    devContainerId = `${info.owner}/${info.repo}#${info.branchOrTag}`;
    if (await this.hasActiveDevContainer(devContainerId)) {
      const devcontainers = await this._loadProfileDevContainerList();
      const index = devcontainers.indexOf(devContainerId);
      if (index > -1) {
        devcontainers.splice(index, 1);
        await this._saveProfileDevContainerList(devcontainers);
        await this.pruneDevContainerRepos();
      }
    }
  }

  public async pruneDevContainerRepos() {
    const downloadedDevContainers = await this.listAllDevContainers();
    const usedDevContainers = await this._findAllUsedDevcontainers();
    const unusedDevContainers = downloadedDevContainers.filter((dc) => !usedDevContainers.includes(dc));

    const delProms = unusedDevContainers.map(async (dc) => {
      const parts = dc.split("/");
      const owner = parts[0];
      const repo = parts[1];

      const ownerPath = `${DCM_CONTAINER_REPOS_DIR}/${owner}`;
      const repoPath = `${ownerPath}/${repo}`;
      const dcPath = `${DCM_CONTAINER_REPOS_DIR}/${dc}`;

      await rm(dcPath, { recursive: true, force: true });
      try {
        await rmdir(repoPath);
      } catch {}
      try {
        await rmdir(ownerPath);
      } catch {}
    });

    await Promise.all(delProms);
  }

  private async _downloadDevContainer(devContainerId: string) {
    const info = await this._loadDevContainerGHRepo(devContainerId);
    await exec(
      `gh repo clone ${info.owner}/${info.repo} ${DCM_CONTAINER_REPOS_DIR}/${info.owner}/${info.repo}/${encodeURIComponent(
        info.branchOrTag ?? "main"
      )} -- --single-branch --branch ${encodeURIComponent(info.branchOrTag ?? "main")}`
    );
  }

  private async _comitDevContainer(devContainerId: string, msg: string = "sync") {
    if (await this.hasDevContainer(devContainerId)) {
      const cwd = getDevcontainerPath(devContainerId);

      await exec(`git add . > /dev/null 2>&1`, { cwd });
      await exec(`git commit -m "${msg}" > /dev/null 2>&1`, { cwd });
    }
  }

  private async _syncDevContainer(devContainerId: string, msg?: string) {
    if (await this.hasDevContainer(devContainerId)) {
      const cwd = getDevcontainerPath(devContainerId);

      await this._comitDevContainer(devContainerId, msg);
      await exec(`git pull > /dev/null`, { cwd });
      await exec(`git push > /dev/null 2>&1 `, { cwd });
    }
  }

  public async hasDevContainer(devContainerId: string) {
    const info = parseDevContainerGHRepoKey(devContainerId);
    return existsSync(`${DCM_CONTAINER_REPOS_DIR}/${info.owner}/${info.repo}/${encodeURIComponent(info.branchOrTag ?? "main")}`);
  }

  public async hasActiveDevContainer(devContainerId: string) {
    const devcontainers = await this._loadProfileDevContainerList();
    return devcontainers.includes(devContainerId);
  }

  public async listAllDevContainers() {
    const devcontainers = await glob(`*/*/*/.devcontainer`, { cwd: DCM_CONTAINER_REPOS_DIR, onlyDirectories: true });
    return devcontainers.map((p) => dirname(p));
  }

  private async _generateDevContainerLaunchUrl(devContainerId: string, workspaceOrFolder?: string) {
    let containerPath = getDevcontainerPath(devContainerId);
    containerPath = isWsl ? await translateWslPath(containerPath) : containerPath;
    const hexPath = Buffer.from(containerPath).toString("hex");
    let uri = `vscode-remote://dev-container+${hexPath}/`;
    if (workspaceOrFolder) {
      if (workspaceOrFolder.startsWith("/")) {
        workspaceOrFolder = workspaceOrFolder.substring(1);
      }
      uri += workspaceOrFolder;
    }
    return uri;
  }

  private async _generateDevContainerLaunchCommand(devContainerId: string, workspaceOrFolder?: string) {
    const uri = await this._generateDevContainerLaunchUrl(devContainerId, workspaceOrFolder);
    const isWS = extname(workspaceOrFolder ?? "") === ".code-workspace";
    const flag = isWS ? "file-uri" : "folder-uri";
    const cmd = `code --${flag} "${uri}"`;
    return cmd;
  }

  private async _launchDevContainer(devContainerId: string, workspaceOrFolder?: string) {
    const cmd = await this._generateDevContainerLaunchCommand(devContainerId, workspaceOrFolder);
    console.log(cmd);
    spawn(cmd, { shell: true, detached: true, stdio: "ignore" });
  }

  public async openDevContainer(devContainerId: string, workspace?: string) {
    const prompt = (await importInquirer()).prompt;
    const info = parseDevContainerGHRepoKey(devContainerId);
    if (!info.branchOrTag) {
      info.branchOrTag = (await this._loadDevContainerGHRepo(devContainerId)).defaultBranch;
    }
    devContainerId = `${info.owner}/${info.repo}#${info.branchOrTag}`;
    if (!(await this.hasActiveDevContainer(devContainerId))) {
      const info = await this._loadDevContainerGHRepo(devContainerId);
      const existsOnGithub =
        info.branches.findIndex((b) => b.name === info.branchOrTag) > -1 || info.tags.findIndex((t) => t.name === info.branchOrTag) > -1;
      if (!existsOnGithub) {
        throw new Error(`Dev container ${devContainerId} does not exist`);
      }
      const { confirm } = await prompt<{ confirm: boolean }>([
        {
          type: "confirm",
          name: "confirm",
          message: `Dev container '${devContainerId}' has not been downloaded. Would you like to download it now?`,
        },
      ]);
      if (!confirm) {
        console.info(`Dev container '${devContainerId}' has not been downloaded. Aborting.`);
        return;
      }
      await this.addDevContainer(devContainerId);
    }
    await this._syncDevContainer(devContainerId);

    workspace = (workspace ?? "").trim();
    const isWS = extname(workspace) === ".code-workspace";
    const containsSlash = workspace.includes("/");

    const config = await this._loadDevContainerConfig(devContainerId);
    const workspacesFolder = config.codeWorkspacesFolder?.trim() || config.workspaceFolder?.trim() || "";

    if (!workspace) {
      workspace = workspacesFolder;
    } else if (!isWS && !containsSlash) {
      workspace = `${workspacesFolder}/${workspace}.code-workspace`;
    } else if (isWS && !containsSlash) {
      workspace = `${workspacesFolder}/${workspace}`;
    }

    await this._launchDevContainer(devContainerId, workspace);
  }

  public async listProfileDevContainers() {
    const devcontainers = await this._loadProfileDevContainerList();
    return devcontainers;
  }

  public async resetDevContainer(devContainerId: string) {
    const info = await this._loadDevContainerGHRepo(devContainerId);
    devContainerId = `${info.owner}/${info.repo}#${info.branchOrTag}`;
    const hasActiveDevContainer = await this.hasActiveDevContainer(devContainerId);

    if (!hasActiveDevContainer) {
      throw new Error(`Dev container ${devContainerId} does not exist in the active profile`);
    }

    await exec(`gh repo sync --force --branch ${encodeURIComponent(info.branchOrTag ?? "main")}`, {
      cwd: `${DCM_CONTAINER_REPOS_DIR}/${info.owner}/${info.repo}/${encodeURIComponent(info.branchOrTag ?? "main")}`,
    });
  }

  public async createDevContainer(template: string, target: string) {
    const templateParts = template.split("/");
    const targetParts = target.split("/");
    const templateOwner = templateParts[0];
    const templateRepo = templateParts[1];
    const owner = targetParts[0];
    const repo = targetParts[1];

    const repoPath = `${DCM_CONTAINER_REPOS_DIR}/${owner}/${repo}/main`;

    await this._createDevContainerRepo({
      templateOwner,
      templateRepo,
      owner,
      repo,
    });

    const pkg = (await readJsonFile(`${repoPath}/package.json`)) as any;

    pkg.name = `@${owner}/${repo}`;

    await writeJsonFile(`${repoPath}/package.json`, pkg);

    await exec(`pnpm install`, { cwd: repoPath });

    this._syncDevContainer(`${owner}/${repo}#main`, "initial commit");
    await this.openDevContainer(`${owner}/${repo}#main`);
  }

  private async _createDevContainerRepo(options: DevContainerCreationOptions) {
    const repoPath = `${DCM_CONTAINER_REPOS_DIR}/${options.owner}/${options.repo}`;
    await mkdir(repoPath, { recursive: true });
    await exec(
      `gh repo create ${options.owner}/${options.repo} --private --clone --template ${options.templateOwner}/${options.templateRepo}`,
      { cwd: repoPath }
    );

    await rename(`${repoPath}/${options.repo}`, `${repoPath}/main`);
    await this._addDevContainerToProfile(`${options.owner}/${options.repo}#main`);
  }
}
