import { existsSync } from "fs";
import Path from "path";
import { DCM_CONTAINER_DIR } from "../constants";
import { GithubUser } from "../github";

export interface DevcontainerInfo {
  owner: string;
  repo: string;
  url: string;
  path: string;
}

export function parseDevcontainerUrlOrId(id: string): DevcontainerInfo {
  if (id && id.startsWith("https://github.com/")) {
    const parts = id.split("/");
    const owner = parts[3];
    const repo = parts[4];
    return {
      owner,
      repo,
      url: `https://github.com/${owner}/${repo}`,
      path: Path.join(DCM_CONTAINER_DIR, owner, repo),
    };
  } else {
    const parts = id.split("/");
    const owner = parts[0];
    const repo = parts[1];
    return {
      owner,
      repo,
      url: `https://github.com/${owner}/${repo}`,
      path: Path.join(DCM_CONTAINER_DIR, owner, repo),
    };
  }
}

export async function devcontainerExistsLocally(idOrInfo: string | DevcontainerInfo) {
  if (typeof idOrInfo === "string") {
    idOrInfo = parseDevcontainerUrlOrId(idOrInfo);
  }
  return existsSync(idOrInfo.path);
}

async function downloadDevcontainer(info: DevcontainerInfo) {}

export async function openDevcontainer(idOrInfo?: string | DevcontainerInfo) {
  console.log("openDevcontainer", idOrInfo);
  if (typeof idOrInfo === "string") {
    if (idOrInfo.trim() === "") {
      idOrInfo = undefined;
    } else {
      idOrInfo = parseDevcontainerUrlOrId(idOrInfo);
    }
  }

  if (!idOrInfo) {
    throw new Error("No devcontainer specified and browse not implemented yet");
  }

  if (!(await devcontainerExistsLocally(idOrInfo))) {
    const githubUser = await GithubUser.loadUser();
    const repos = await githubUser.repos;
    console.log(repos.headers);
    console.log(repos.data.map((r) => r.full_name));
  }
}
