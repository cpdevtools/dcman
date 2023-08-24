import { GithubAuthStatus, githubAuthStatus, isWindows, readYamlFile } from "@cpdevtools/lib-node-utilities";
import { CachedFile } from "./cache";
import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import { DCM_CACHE_DIR, DCM_CONFIG_DIR, DCM_PROFILES_DIR } from "./constants";
import { GithubSession } from "./github";

const userDataFile = `${DCM_CACHE_DIR}/user-data.yml`;
const ghStatusFile = `${DCM_CACHE_DIR}/gh-status.yml`;

export type GithubUserStatus = Omit<GithubAuthStatus, "token">;

export async function initializeCli() {
  if (isWindows) {
    throw new Error("Running directly in window is not currently supported");
  }

  if (!existsSync(DCM_CONFIG_DIR)) {
    await mkdir(DCM_CONFIG_DIR, { recursive: true });
  }

  if (!existsSync(DCM_CACHE_DIR)) {
    await mkdir(DCM_CACHE_DIR, { recursive: true });
  }
  if (!existsSync(DCM_PROFILES_DIR)) {
    await mkdir(DCM_PROFILES_DIR, { recursive: true });
  }
  await initializeGithubSession();
}

async function initializeGithubSession() {
  const session = await GithubSession.instance;
}
