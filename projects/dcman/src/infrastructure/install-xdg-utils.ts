import { exec } from "@cpdevtools/lib-node-utilities";

export async function installXdgUtils() {
  await exec(`npm install -g wsl-open`);
}
