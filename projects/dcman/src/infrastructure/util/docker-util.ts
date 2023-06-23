import { Docker as DockerCli, Options } from "docker-cli-js";
import Dockerode from "dockerode";

export interface DockerServiceState {
  id: string;
  name: string;
  image: string;
  node: string;
  desiredState: string;
  currentState: string;
  error: string;
  ports: string;
}

export async function getDockerServiceState(serviceName: string): Promise<DockerServiceState | null> {
  try {
    const cliOpts = new Options(undefined, __dirname, true);
    const cli = new DockerCli(cliOpts);
    const fff = await cli.command(`service ps ${serviceName}`);

    const containerState = fff.containerList[0];

    return {
      id: containerState.id,
      name: containerState.name,
      image: containerState.image,
      node: containerState.node,
      desiredState: containerState["desired state"],
      currentState: containerState["current state"],
      error: containerState.error,
      ports: containerState.ports,
    };
  } catch (e) {
    if (e instanceof Error && e.message.toLowerCase().includes("no such service:")) {
      return null;
    }
    throw e;
  }
}

export async function ensureDockerServiceStarted(service: string, cwd: string) {
  const docker = new Dockerode();
  const state = await getDockerServiceState(service);
  let needStart = false;

  if (state !== null) {
    switch (state.currentState.split(" ")[0].toUpperCase()) {
      case "COMPLETE":
      case "FAILED":
      case "SHUTDOWN":
      case "REJECTED":
      case "ORPHANED":
      case "REMOVE":
        await docker.getService(service).remove();
        needStart = true;
        break;
    }
  } else {
    needStart = true;
  }

  if (needStart) {
    const cliOpts = new Options(undefined, cwd, true);
    const cli = new DockerCli(cliOpts);
    await cli.command(`stack deploy -c stack.yml dcm-infrastructure`);
    // await cli.command(`service update ${service} --force`);
  }
}
