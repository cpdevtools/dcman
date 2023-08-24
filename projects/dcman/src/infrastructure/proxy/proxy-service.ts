import { Docker as DockerCli, Options } from "docker-cli-js";
import Dockerode from "dockerode";
import { ensureDockerServiceStarted } from "../util/docker-util";

export async function initializeProxyService() {
  const docker = new Dockerode();
  const cwd = __dirname;
  const stream = await docker.buildImage(
    {
      context: cwd,
      src: ["dockerfile", "config/filebeat.yml", "config/entrypoint.sh", "config/filebeat-start.sh", "config/modules.d/traefik.yml"],
    },
    {
      t: "dcm-proxy",
    }
  );

  const r = await new Promise((resolve, reject) => {
    docker.modem.followProgress(stream, (err, res) => (err ? reject(err) : resolve(res)));
  });

  // const cliOpts = new Options(undefined, cwd, true);
  // const cli = new DockerCli(cliOpts);
  // await cli.command(`stack deploy -c stack.yml dcm-infrastructure`);
  // //await cli.command(`service update dcm-infrastructure_proxy --force --quiet`);
  await ensureDockerServiceStarted("dcm-infrastructure_proxy", cwd);
}
