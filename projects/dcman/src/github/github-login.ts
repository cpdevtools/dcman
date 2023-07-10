import { dockerLogin, envVars, exec, githubAuthStatus, importInquirer } from "@cpdevtools/lib-node-utilities";

import { simpleGit } from "simple-git";
import { GithubUser } from "./github-user";

export async function ensureGithubLogin() {
  const user = await GithubUser.loadUser();
  await dockerLogin("https://ghcr.io", user.username!, user.token!);
}

export async function githubLogout() {
  const success = !(await exec(`gh auth logout -h github.com`));
  if (!success) {
    throw new Error("Failed to logout");
  }
  await exec(`docker logout https://ghcr.io`);
}

// export async function ensureUserInfo() {
//   await ensureUserGitName();
//   await ensureUserGitEmail();
// }

// export async function ensureUserGitName(update: boolean = true) {
//   const git = simpleGit();
//   const nameConfig = await git.getConfig("user.name");
//   const name = nameConfig?.value;
//   if (!name || update) {
//     const inquirer = await importInquirer();

//     let prompt: { name?: string } | undefined = undefined;
//     while (!prompt?.name?.trim()) {
//       prompt = await inquirer.prompt({
//         type: "input",
//         name: "name",
//         message: "Please enter your full name:",
//         default: name,
//       });
//     }
//     await git.addConfig("user.name", prompt.name, false, "global");
//   }
// }

// export async function getUserGitName() {
//   const git = simpleGit();
//   return await git.getConfig("user.name");
// }

// export async function ensureUserGitEmail(update: boolean = true) {
//   const git = simpleGit();
//   const emailConfig = await git.getConfig("user.email");
//   const email = emailConfig?.value;
//   if (!email || update) {
//     let prompt: { email?: string } | undefined = undefined;
//     const inquirer = await importInquirer();
//     while (!prompt?.email?.trim()) {
//       prompt = await inquirer.prompt({
//         type: "input",
//         name: "email",
//         message: "Please enter your email",
//         default: email,
//       });
//     }
//     await git.addConfig("user.email", prompt.email, false, "global");
//   }
// }

// export async function getUserGitEmail() {
//   const git = simpleGit();
//   return await git.getConfig("user.email");
// }

// export async function ensureGithubToken(update: boolean = true) {
//   const git = simpleGit();
//   const token = process.env.GITHUB_TOKEN;
//   if (!token || update) {
//     const inquirer = await importInquirer();
//     let prompt: { token?: string } | undefined = undefined;
//     while (!prompt?.token?.trim()) {
//       prompt = await inquirer.prompt({
//         type: "input",
//         name: "token",
//         message: "Please enter your github token (PAT)",
//         default: token,
//       });
//     }
//     await envVars("GITHUB_TOKEN", prompt.token);
//     process.env.GITHUB_TOKEN = prompt.token;
//   }
// }

// export function getGithubToken() {
//   return process.env.GITHUB_TOKEN;
// }

// export async function checkGithubToken(update: boolean = true) {
//   let userInfo = undefined;
//   const token = getGithubToken();
//   while (!userInfo) {
//     if (!token || update) {
//       await ensureGithubToken(update);
//     }
//     try {
//       const result = await githubAuthStatus();
//       userInfo = result;
//     } catch (e) {
//       console.error((e as any).data);
//     }
//     update = true;
//   }
//   return userInfo;
// }
