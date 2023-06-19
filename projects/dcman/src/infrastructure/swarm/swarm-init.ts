import Dockerode from "dockerode";
import { Docker as DockerCli, Options } from "docker-cli-js";

export async function initializeDockerSwarm() {
  const docker = new Dockerode();
  const info = await docker.info();

  if (info.Swarm.LocalNodeState === "active") {
    return;
  }

  const cwd = __dirname;
  const cliOpts = new Options(undefined, cwd, true);
  const cli = new DockerCli(cliOpts);
  await cli.command(`swarm init --default-addr-pool 10.42.0.0/16`);
}
