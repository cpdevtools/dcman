import { simpleGit } from "simple-git";

export async function syncDevContainer(onHost: boolean = false) {
  const path = onHost ? process.env.HOST_CONTAINER_FOLDER : process.env.CONTAINER_FOLDER;
  const git = simpleGit(path);
  await git.add(".");
  await git.commit("Auto sync", undefined);
  try {
    await git.pull();
  } catch {}
  await git.push();
}
