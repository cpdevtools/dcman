import Dockerode from "dockerode";
import { Docker as DockerCli, Options } from "docker-cli-js";

export async function initializeDockerCacheVolumes() {
  const docker = new Dockerode();
  await docker.createVolume({
    Name: "dcm-pnpm-cache",
    Labels: {
      use: "pnpm-cache",
    },
  });
  await docker.createVolume({
    Name: "dcm-npm-cache",
    Labels: {
      use: "npm-cache",
    },
  });
  await docker.createVolume({
    Name: "dcm-yarn-cache",
    Labels: {
      use: "yarn-cache",
    },
  });
  await docker.createVolume({
    Name: "dcm-nuget-cache",
    Labels: {
      use: "nuget-cache",
    },
  });
}

async function getNetwork(name: string) {
  try {
    const docker = new Dockerode();
    const network = docker.getNetwork(name);
    return await network.inspect();
  } catch {
    return null;
  }
}

export async function initializeDockerNetworks() {
  const docker = new Dockerode();

  let swarmNet = await getNetwork("swarm");
  if (!swarmNet) {
    await docker.createNetwork({
      Name: "swarm",
      Driver: "bridge",
    });
  }

  let webNet = await getNetwork("web");
  if (!webNet) {
    await docker.createNetwork({
      Name: "web",
      Driver: "bridge",
    });
  }
}

export async function initializeDevcontainerInfrastructure() {
  await initializeDockerCacheVolumes();
  await initializeDockerNetworks();
}
