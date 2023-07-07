import { PackageManager, readJsonFile, start, writeJsonFile } from "@cpdevtools/lib-node-utilities";
import { watch } from "chokidar";
import { WORKSPACES_DIR } from "../constants/paths";
import { existsSync } from "fs";
import { mkdir, readdir } from "fs/promises";
import { extname, join } from "path";
import simpleGit from "simple-git";

export interface CodeWorkspace {
  folders: {
    path: string;
    name?: string;
    repository?: string;
  }[];
  settings: { [setting: string]: string };
}

export function writeWorkspaceFile(workspaceFile: string, data: CodeWorkspace) {
  const workspacePath = join(WORKSPACES_DIR, workspaceFile);
  return writeJsonFile(workspacePath, data, 4);
}

export function readWorkspaceFile(workspaceFile: string) {
  const workspacePath = join(WORKSPACES_DIR, workspaceFile);
  return readJsonFile<CodeWorkspace>(workspacePath);
}

export async function syncGitReposInWorkSpace(workspaceFile: string) {
  try {
    let workspaceChanged = false;

    const workspace = await readWorkspaceFile(workspaceFile);

    console.info("Synchronizing Workspace:", workspaceFile);
    console.group();

    for (const proj of workspace.folders) {
      if (proj.path.startsWith("../projects/")) {
        const projectPath = join(WORKSPACES_DIR, proj.path);
        console.info("Synchronizing Project:", projectPath);
        console.group();
        let projectPathExists = existsSync(projectPath) && (await readdir(projectPath)).length !== 0;
        let repoUri = proj.repository;

        if (!projectPathExists && repoUri) {
          console.info("Cloning", repoUri, "to", projectPath);
          await mkdir(projectPath, { recursive: true });
          const git = simpleGit();
          await git.clone(repoUri, projectPath);
          console.info(repoUri, "cloned.");
          await runPmInstall(projectPath);
        } else if (projectPathExists && !repoUri) {
          const git = simpleGit(projectPath);
          if (await git.checkIsRepo()) {
            const remote = (await git.getRemotes(true)).find((r) => r.name === "origin");
            if (remote) {
              proj.repository = repoUri = remote.refs.fetch;
              workspaceChanged = true;
            }
          }
        } else if (projectPathExists && repoUri) {
          // make sure the origin repo matches workspace file, origin wins
          const git = simpleGit(projectPath);
          if (await git.checkIsRepo()) {
            const remote = (await git.getRemotes(true)).find((r) => r.name === "origin");
            if (remote) {
              if (repoUri !== remote.refs.fetch) {
                console.info(`Updating ${repoUri} to ${remote.refs.fetch} in workspace ${workspaceFile}`);
                proj.repository = repoUri = remote.refs.fetch;
                workspaceChanged = true;
              }
            } else {
              console.info(`Adding ${repoUri} as remote: "origin"`);
              await git.addRemote("origin", repoUri);
            }
          }
        } else {
          console.warn(`${projectPath} is a not git repo. Expected repo of ${repoUri}`);
        }
        console.groupEnd();
      }
    }
    if (workspaceChanged) {
      await writeWorkspaceFile(workspaceFile, workspace);
    }
    console.groupEnd();
  } catch (e) {
    console.error(e);
  }
}

async function runPmInstall(path: string) {
  const pkg = await PackageManager.loadPackage(path);
  if (pkg) {
    console.info("Running install ", pkg.name);
    await pkg.install();
  }
}

export async function syncGitReposInWorkSpaces() {
  const workspaces = await readdir(WORKSPACES_DIR);
  for (const workspace of workspaces) {
    const ext = extname(workspace);
    if (ext === ".code-workspace") {
      await syncGitReposInWorkSpace(workspace);
    }
  }
}

export async function watchAndSyncWorkspaces() {
  watch(["*.code-workspace"], { cwd: WORKSPACES_DIR, ignoreInitial: true }).on("all", (e, p, s) => {
    syncGitReposInWorkSpace(p);
  });
}

export async function startWorkspaceWatcher() {
  await start("dcm dc-workspaces watch");
}
