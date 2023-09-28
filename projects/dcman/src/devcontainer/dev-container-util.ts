import { DCM_CONTAINER_REPOS_DIR } from "../constants";
import { DevContainerGHRepoKey } from "./DevContainerGHRepoKey";

export function parseDevContainerGHRepoKey(devContainerId: string): DevContainerGHRepoKey {
  let parts = devContainerId.split("#");
  const branchOrTag = parts.length > 1 ? parts[1] : undefined;
  parts = parts[0].split("/");
  const repo = parts.pop()!;
  const owner = parts.pop()!;
  return {
    owner,
    repo,
    branchOrTag,
  };
}

export function getDevcontainerPath(devContainerId: string): string {
  const key = parseDevContainerGHRepoKey(devContainerId);
  return `${DCM_CONTAINER_REPOS_DIR}/${key.owner}/${key.repo}/${encodeURIComponent(key.branchOrTag ?? "main")}`;
}
