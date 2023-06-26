import { simpleGit } from "simple-git";

export async function syncDevContainer() {
  const path = "/workspaces";
  const git = simpleGit(path);
  await git.add(".");
  await git.commit("Auto sync", undefined);
  try {
    await git.pull();
  } catch {}
  await git.push();
}
