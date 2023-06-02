import { Docker as DockerCli, Options } from "docker-cli-js";
import Dockerode from "dockerode";

export async function initializeDNSService() {
  const docker = new Dockerode();

  const cwd = __dirname;

  const stream = await docker.buildImage(
    {
      context: cwd,
      src: ["dockerfile", "dnsmasq.conf"],
    },
    {
      t: "dev-dnsmasq",
    }
  );

  await new Promise((resolve, reject) => {
    docker.modem.followProgress(stream, (err, res) => (err ? reject(err) : resolve(res)));
  });

  const cliOpts = new Options(undefined, cwd, true);

  const cli = new DockerCli(cliOpts);
  const deployResult = await cli.command(`stack deploy -c stack.yml dev-infrastructure`);
  console.log(deployResult);
}
