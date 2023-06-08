import { Docker as DockerCli, Options } from "docker-cli-js";

export async function initializeLoggingService() {
  const cwd = __dirname;
  const cliOpts = new Options(undefined, cwd, true);
  const cli = new DockerCli(cliOpts);
  await cli.command(`stack deploy -c stack.yml dcm-infrastructure`);
}
