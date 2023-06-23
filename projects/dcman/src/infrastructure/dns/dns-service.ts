import { Docker as DockerCli, Options } from "docker-cli-js";
import Dockerode from "dockerode";
import { ensureDockerServiceStarted, getDockerServiceState } from "../util/docker-util";

export async function initializeDNSService() {
  const docker = new Dockerode();

  const cwd = __dirname;

  const stream = await docker.buildImage(
    {
      context: cwd,
      src: ["dockerfile", "dnsmasq.conf"],
    },
    {
      t: "dcm-dnsmasq",
    }
  );

  await new Promise((resolve, reject) => {
    docker.modem.followProgress(stream, (err, res) => (err ? reject(err) : resolve(res)));
  });

  await ensureDockerServiceStarted("dcm-infrastructure_dns", cwd);

  // const state = await getDockerServiceState("dcm-infrastructure_dns");
  // let needStart = false;

  // if (state !== null) {
  //   switch (state.currentState.split(' ')[0].toUpperCase()) {
  //     case "COMPLETE":
  //     case "FAILED":
  //     case "SHUTDOWN":
  //     case "REJECTED":
  //     case "ORPHANED":
  //     case "REMOVE":
  //       await docker.getService("dcm-infrastructure_dns").remove();
  //       needStart = true;
  //       break;
  //   }
  // }else{
  //   needStart = true;
  // }

  // if(needStart) {
  //   const cliOpts = new Options(undefined, cwd, true);
  //   const cli = new DockerCli(cliOpts);
  //   await cli.command(`stack deploy -c stack.yml dcm-infrastructure`);
  //   // await cli.command(`service update dcm-infrastructure_dns --force`);
  // }
}
