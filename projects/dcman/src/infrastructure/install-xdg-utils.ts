import { exec } from "@cpdevtools/lib-node-utilities";

export async function installXdgUtils() {
  await exec(`sudo npm install -g wsl-open`);
}
