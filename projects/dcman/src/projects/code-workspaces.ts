import { join } from "path";

import {} from "@cpdevtools/";
export const workspacesDir = "/devcontainer/workspaces";
export const projectsDir = "/devcontainer/projects";

export interface CodeWorkspace {
  folders: {
    path: string;
    name?: string;
    repository?: string;
  }[];
  settings: { [setting: string]: string };
}

export function writeWorkspaceFile(workspaceFile: string, data: CodeWorkspace) {
  const workspacePath = join(workspacesDir, workspaceFile);
  return writeJsonFile(workspacePath, data);
}

export function readWorkspaceFile(workspaceFile: string) {
  const workspacePath = join(workspacesDir, workspaceFile);
  return readJsonFile<CodeWorkspace>(workspacePath);
}

export async function syncGitReposInWorkSpace(workspaceFile: string) {
  try {
    const workspacePath = join(workspacesDir, workspaceFile);
    const workspace = await readWorkspaceFile(path);
    for (const folder of workspace.folders) {
    }
  } catch (e) {
    console.error(e);
  }
}
