import { envVars, githubLogin, exec } from "@cpdevtools/lib-node-utilities";

import { simpleGit } from "simple-git";

export async function ensureGithubLogin() {
  await ensureUserInfo();

  //const result = await exec(`echo "${getGithubToken()}" | gh auth login --with-token`);

  // check that github token is valid
  // if not, prompt for new token and recheck
}

export async function ensureUserInfo() {
  await ensureUserGitName();
  await ensureUserGitEmail();
  await ensureGithubToken();
}

export async function ensureUserGitName() {
  const git = simpleGit();
  const name = await git.getConfig("user.name");
  if (!name) {
    let prompt: { name?: string } | undefined = undefined;
    // while (!prompt?.name) {
    //   // prompt = await inquirer.prompt({
    //   //   type: 'input',
    //   //   name: 'name',
    //   //   message: 'Please enter your full name',
    //   // });
    // }
    // await git.addConfig("user.name", prompt.name, false, "global");
  }
}

export async function getUserGitName() {
  const git = simpleGit();
  return await git.getConfig("user.name");
}

export async function ensureUserGitEmail() {
  const git = simpleGit();
  const email = await git.getConfig("user.email");
  if (!email) {
    let prompt: { email?: string } | undefined = undefined;
    while (!prompt?.email) {
      prompt = await inquirer.prompt({
        type: "input",
        name: "email",
        message: "Please enter your email",
      });
    }
    await git.addConfig("user.email", prompt.email, false, "global");
  }
}

export async function getUserGitEmail() {
  const git = simpleGit();
  return await git.getConfig("user.email");
}

export async function ensureGithubToken() {
  const git = simpleGit();
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    let prompt: { token?: string } | undefined = undefined;
    while (!prompt?.token) {
      prompt = await inquirer.prompt({
        type: "input",
        name: "token",
        message: "Please enter your github token (PAT)",
      });
    }
    await envVars("GITHUB_TOKEN", prompt.token);
    process.env.GITHUB_TOKEN = prompt.token;
  }
}

export function getGithubToken() {
  return process.env.GITHUB_TOKEN;
}
