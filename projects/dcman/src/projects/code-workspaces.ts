import { PackageManager, readJsonFile, start, writeJsonFile } from "@cpdevtools/lib-node-utilities";
import { watch } from "chokidar";
import { existsSync } from "fs";
import { mkdir, readdir } from "fs/promises";
import { extname, join } from "path";
import simpleGit from "simple-git";
import { WORKSPACES_DIR } from "../constants/paths";

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

    for (const repo of workspace.folders) {
      if (repo.path.startsWith("../repos/")) {
        const repoPath = join(WORKSPACES_DIR, repo.path);
        console.info("Synchronizing Repositories:", repoPath);
        console.group();
        let repoPathExists = existsSync(repoPath) && (await readdir(repoPath)).length !== 0;
        let repoUri = repo.repository;

        if (!repoPathExists && repoUri) {
          console.info("Cloning", repoUri, "to", repoPath);
          await mkdir(repoPath, { recursive: true });
          const git = simpleGit();
          await git.clone(repoUri, repoPath);
          console.info(repoUri, "cloned.");
          await runPmInstall(repoPath);
        } else if (repoPathExists && !repoUri) {
          const git = simpleGit(repoPath);
          if (await git.checkIsRepo()) {
            const remote = (await git.getRemotes(true)).find((r) => r.name === "origin");
            if (remote) {
              repo.repository = repoUri = remote.refs.fetch;
              workspaceChanged = true;
            }
          }
        } else if (repoPathExists && repoUri) {
          // make sure the origin repo matches workspace file, origin wins
          const git = simpleGit(repoPath);
          if (await git.checkIsRepo()) {
            const remote = (await git.getRemotes(true)).find((r) => r.name === "origin");
            if (remote) {
              if (repoUri !== remote.refs.fetch) {
                console.info(`Updating ${repoUri} to ${remote.refs.fetch} in workspace ${workspaceFile}`);
                repo.repository = repoUri = remote.refs.fetch;
                workspaceChanged = true;
              }
            } else {
              console.info(`Adding ${repoUri} as remote: "origin"`);
              await git.addRemote("origin", repoUri);
            }
          }
        } else {
          console.warn(`${repoPath} is a not git repo. Expected repo of ${repoUri}`);
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
  watch(["*.code-workspace"], { cwd: WORKSPACES_DIR, ignoreInitial: true }).on("all", async (e, p, s) => {
    try {
      console.log("Workspace changed", p);
      await syncGitReposInWorkSpace(p);
    } catch (e) {
      console.error(e);
    }
  });
}

export async function startWorkspaceWatcher() {
  await start(`nohup "dcm sync-service workspaces" > wssync.log >2&1`);
}
