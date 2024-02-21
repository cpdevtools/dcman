import { GithubAuthStatus, exec, isWindows } from "@cpdevtools/lib-node-utilities";
import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import { ProfileManager } from "./profiles";
import { DCM_CACHE_DIR, DCM_CONFIG_DIR, DCM_PROFILES_DIR } from "./constants";
import { GithubSession } from "./github";

const userDataFile = `${DCM_CACHE_DIR}/user-data.yml`;
const ghStatusFile = `${DCM_CACHE_DIR}/gh-status.yml`;

export type GithubUserStatus = Omit<GithubAuthStatus, "token">;

export function isInstalled(): boolean {
  return existsSync(DCM_CONFIG_DIR);
}

export async function hasProfile(): Promise<boolean> {
  return ProfileManager.hasProfile();
}

export async function isLoggedIn(): Promise<boolean> {
  return GithubSession.isLoggedIn();
}

export async function runSetupIfNeeded(): Promise<void> {
  if (!isInstalled()) {
    await exec(`npm install --location=global @cpdevtools/dcman-cli`);
    await initializeCli();
  }
  if (!(await isLoggedIn())) {
    await GithubSession.login();
  }

  if (!(await hasProfile())) {
    const github = await GithubSession.instance;
    const user = await github.getUser();
    const pm = await ProfileManager.instance;

    github.api?.repos.get({
      owner: user!.name!,
      repo: "dcm-profiles",
    });
  }
}

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
