import { exec } from "@cpdevtools/lib-node-utilities";

export async function installDCMCli() {
  await exec(`npm install --location=global @cpdevtools/dcman-cli`);
}
