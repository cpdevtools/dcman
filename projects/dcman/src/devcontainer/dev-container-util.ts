import { DevContainerGHRepoKey } from "./DevContainerGHRepoKey";

export function parseDevContainerGHRepoKey(devContainerId: string): DevContainerGHRepoKey {
  let parts = devContainerId.split("#");
  const commitish = parts.length > 1 ? parts[1] : undefined;
  parts = parts[0].split("/");
  const repo = parts.pop()!;
  const owner = parts.pop()!;
  return {
    owner,
    repo,
    branchOrTag: commitish,
  };
}
