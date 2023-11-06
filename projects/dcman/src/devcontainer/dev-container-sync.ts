import { exec, gitHasChanges, start } from "@cpdevtools/lib-node-utilities";
import { watch } from "chokidar";
import { rm } from "fs/promises";
import { DEVCONTAINER_DIR } from "../constants";

export async function syncDevContainer(msg: string = "dcm sync") {
  console.info("Syncing dev container");
  const cwd = DEVCONTAINER_DIR;
  if (await gitHasChanges(DEVCONTAINER_DIR)) {
    await exec(`git add .`, { cwd });
    await exec(`git commit -m "${msg}"`, { cwd });
  }
  await exec(`git pull`, { cwd });
  await exec(`git push`, { cwd });
}

export async function watchAndSyncDevContainer(msg: string = "dcm sync") {
  watch(["**/*", "!repos/**", "!.git/**", "!.pnpm-store/**", "!node_modules/**", "!*.log"], {
    cwd: DEVCONTAINER_DIR,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 250 },
  }).on("all", async (e, p, s) => {
    try {
      console.info("Dev Container changed", p);
      await syncDevContainer(msg);
    } catch (e) {
      console.error(e);
    }
  });
  setInterval(async () => {
    try {
      await syncDevContainer(msg);
    } catch (e) {
      console.error(e);
    }
  }, 1000 * 15);
}

export async function startWatchAndSyncDevContainer() {
  await rm(`${DEVCONTAINER_DIR}/devcontainer-sync.log`, { force: true });
  await start(`dcm sync-service container >  ${DEVCONTAINER_DIR}/devcontainer-sync.log`);
}
