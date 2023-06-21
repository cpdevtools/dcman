import { Docker as DockerCli, Options } from "docker-cli-js";
import Dockerode from "dockerode";

export async function initializeProxyService() {
  const docker = new Dockerode();
  console.log("Initializing proxy service");
  console.log("CWD: ", __dirname);
  const cwd = __dirname;
  const stream = await docker.buildImage(
    {
      context: cwd,
      src: ["dockerfile", "filebeat.yml", "entrypoint.sh"],
    },
    {
      t: "dcm-proxy",
    }
  );

  const r = await new Promise((resolve, reject) => {
    docker.modem.followProgress(stream, (err, res) => (err ? reject(err) : resolve(res)));
  });
  console.log("Built image");
  console.log(r);

  const cliOpts = new Options(undefined, cwd, true);
  const cli = new DockerCli(cliOpts);
  await cli.command(`stack deploy -c stack.yml dcm-infrastructure`);
  //await cli.command(`service update dcm-infrastructure_proxy --force --quiet`);
}
