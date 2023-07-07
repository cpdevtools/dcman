import { gitHasChanges, gitSync, start } from "@cpdevtools/lib-node-utilities";
import { watch } from "chokidar";
import { DEVCONTAINER_DIR } from "../constants/paths";

export async function syncDevContainer(onHost: boolean = false) {
  const path = (onHost ? process.env.HOST_CONTAINER_FOLDER : process.env.CONTAINER_FOLDER) || DEVCONTAINER_DIR;
  if (await gitHasChanges(path)) {
    console.info("Syncing Dev Container...");
    await gitSync(path);
    console.info("Dev Container Synchronized");
  }
}

export async function watchAndSyncDevContainer() {
  const path = process.env.CONTAINER_FOLDER || DEVCONTAINER_DIR;
  watch(["**/*", "!node_modules/**", "!projects/**"], { cwd: path, ignoreInitial: true }).on("all", async (evt, path, lstat) => {
    syncDevContainer();
  });
}

export async function startDevContainerSyncWatcher() {
  await start("dcm dc-devcontainer watch");
}
