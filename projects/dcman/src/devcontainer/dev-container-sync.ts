import { exec, start } from "@cpdevtools/lib-node-utilities";
import { watch } from "chokidar";
import { DEVCONTAINER_DIR } from "../constants";

export async function syncDevContainer(msg: string = "dcm sync") {
  console.log("Syncing dev container");
  const cwd = DEVCONTAINER_DIR;
  await exec(`git add .`, { cwd });
  await exec(`git commit -m "${msg}"`, { cwd });
  await exec(`git pull`, { cwd });
  await exec(`git push`, { cwd });
}

export async function watchAndSyncDevContainer(msg: string = "dcm sync") {
  watch(["**/*", "!repos/**", "!.git/**", "!.pnpm-store/**", "!node_modules/**"], {
    cwd: DEVCONTAINER_DIR,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 250 },
  }).on("all", async (e, p, s) => {
    try {
      console.log("Dev Container changed", p);
      await syncDevContainer(msg);
    } catch (e) {
      console.error(e);
    }
  });
}

export async function startWatchAndSyncDevContainer() {
  await start(`dcm sync-service container > dcsync.log`);
}
