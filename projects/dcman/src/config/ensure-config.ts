import { githubLogin, importInquirer, readYamlFile } from "@cpdevtools/lib-node-utilities";
import { DCM_DIR } from "../constants";
import { existsSync } from "fs";
import { mkdir } from "fs/promises";

export interface DCMHostConfig {
  gitUserName?: string;
  gitUserEmail?: string;
  //githubToken?: string;
}

export async function getHostConfigDir() {
  return DCM_DIR;
}

export async function ensureHostConfig() {
  await ensureHostConfigDir();
  const config = await loadConfig();
  await promptHostConfig(config);
}

export async function promptHostConfig(config: DCMHostConfig, verify: boolean = false) {
  if (verify || !config.gitUserName) {
    config.gitUserName = await promptGitUserName();
  }

  if (verify || !config.gitUserEmail) {
    config.gitUserEmail = await promptGitUserEmail();
  }

  // if (config.githubToken) {
  //     const loggedIn = await githubLogin(config.githubToken);
  //     if (!loggedIn) {
  //         config.githubToken = undefined;
  //     }
  // }

  // if (verify || !config.githubToken) {
  //     config.githubToken = await promptGithubToken();
  // }

  return config;
}

export async function promptGitUserName(defaultValue?: string) {
  const inquirer = await importInquirer();
  let prompt: { name?: string } | undefined = undefined;
  while (!prompt?.name?.trim()) {
    prompt = await inquirer.prompt({
      type: "input",
      name: "name",
      message: "Please enter your full name:",
      default: defaultValue,
    });
  }
  return prompt.name;
}

export async function promptGitUserEmail(defaultValue?: string) {
  const inquirer = await importInquirer();
  let prompt: { email?: string } | undefined = undefined;
  while (!prompt?.email?.trim()) {
    prompt = await inquirer.prompt({
      type: "input",
      name: "email",
      message: "Please enter your email",
      default: defaultValue,
    });
  }
  return prompt.email;
}

export async function promptGithubToken(defaultValue?: string) {
  const inquirer = await importInquirer();
  let prompt: { token?: string } | undefined = undefined;
  while (!prompt?.token?.trim()) {
    prompt = await inquirer.prompt({
      type: "input",
      name: "token",
      message: "Please enter your github token",
      default: defaultValue,
    });
    if (prompt?.token) {
      const loggedIn = await githubLogin(prompt.token);
      if (!loggedIn) {
        console.warn("Invalid token");
        prompt.token = undefined;
      }
    }
  }
  return prompt.token;
}

async function ensureHostConfigDir() {
  const hostConfigDir = await getHostConfigDir();
  await mkdir(hostConfigDir, { recursive: true });
}

async function loadConfig(): Promise<DCMHostConfig> {
  const hostConfigDir = await getHostConfigDir();
  const configPath = `${hostConfigDir}/config.yml`;
  return existsSync(configPath) ? await readYamlFile<DCMHostConfig>(configPath) : {};
}
