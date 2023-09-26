import { exec, start } from "@cpdevtools/lib-node-utilities";
import { watch } from "chokidar";
import { DEVCONTAINER_DIR } from "../constants";

export async function syncDevContainer(msg: string = "dcm sync") {
  console.log("Syncing dev container");
  const cwd = DEVCONTAINER_DIR;
  await exec(`git add . > /dev/null 2>&1`, { cwd });
  await exec(`git commit -m "${msg}" > /dev/null 2>&1`, { cwd });
  await exec(`git pull > /dev/null`, { cwd });
  await exec(`git push > /dev/null 2>&1 `, { cwd });
}

export async function watchAndSyncDevContainer(msg: string = "dcm sync") {
  watch(["**/*", "!repos", "!.git/**"], { cwd: DEVCONTAINER_DIR, ignoreInitial: true }).on("all", (e, p, s) => {
    console.log("Dev Container changed", p);
    syncDevContainer(msg);
  });
}

export async function startWatchAndSyncDevContainer() {
  await start("dcm sync-service container");
}
