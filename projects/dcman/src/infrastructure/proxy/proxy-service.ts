import { Docker as DockerCli, Options } from "docker-cli-js";
import Dockerode from "dockerode";

export async function initializeProxyService() {
  const docker = new Dockerode();

  const cwd = __dirname;
  const cliOpts = new Options(undefined, cwd, true);
  const cli = new DockerCli(cliOpts);
  await cli.command(`stack deploy -c stack.yml dcm-infrastructure`);
  //await cli.command(`service update dcm-infrastructure_proxy --force --quiet`);
}
