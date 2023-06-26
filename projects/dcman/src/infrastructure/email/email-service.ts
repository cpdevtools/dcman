import { ensureDockerServiceStarted } from "../util/docker-util";

export async function initializeEmailService() {
  const cwd = __dirname;
  await ensureDockerServiceStarted("dcm-infrastructure_email", cwd);
}
