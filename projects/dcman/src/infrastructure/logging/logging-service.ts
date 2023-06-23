import { Docker as DockerCli, Options } from "docker-cli-js";
import { ensureDockerServiceStarted } from "../util/docker-util";

export async function initializeLoggingService() {
  const cwd = __dirname;
  // const cliOpts = new Options(undefined, cwd, true);
  // const cli = new DockerCli(cliOpts);
  // await cli.command(`stack deploy -c stack.yml dcm-infrastructure`);

  await ensureDockerServiceStarted("dcm-infrastructure_elasticsearch", cwd);
  await ensureDockerServiceStarted("dcm-infrastructure_logstash", cwd);
  await ensureDockerServiceStarted("dcm-infrastructure_kibana", cwd);

  // await Promise.all([
  //   cli.command(`service update dcm-infrastructure_elasticsearch --force`),
  //   cli.command(`service update dcm-infrastructure_logstash --force`),
  //   cli.command(`service update dcm-infrastructure_kibana --force`),
  // ]);
}
