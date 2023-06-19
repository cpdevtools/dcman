import Dockerode from "dockerode";

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

  let ingressNet = await getNetwork("ingress");
  if (!ingressNet) {
    await docker.createNetwork({
      Name: "ingress",
      Driver: "overlay",
      Ingress: true,
      Options: {
        Gateway: "172.16.0.1",
        Subnet: "172.16.0.0/16",
      },
    });
  }

  let webProxyNet = await getNetwork("web-proxy");
  if (!webProxyNet) {
    await docker.createNetwork({
      Name: "web-proxy",
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
  let swarmNet = await getNetwork("swarm");
  if (!swarmNet) {
    await docker.createNetwork({
      Name: "swarm",
      Driver: "overlay",
    });
  }
}

export async function initializeDevcontainerInfrastructure() {
  await initializeDockerCacheVolumes();
  await initializeDockerNetworks();
}
