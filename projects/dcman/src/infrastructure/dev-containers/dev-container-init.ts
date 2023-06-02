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
    console.log("network", network);
    return await network.inspect();
  } catch {
    return null;
  }
}

export async function initializeDockerNetworks() {
  const docker = new Dockerode();
  let webProxyNet = await getNetwork("web-proxy");
  if (!webProxyNet) {
    await docker.createNetwork({
      Name: "web-proxy",
      Driver: "bridge",
    });
    //webProxyNet = await getNetwork('web-proxy');
  }

  let webNet = await getNetwork("web");
  if (!webNet) {
    await docker.createNetwork({
      Name: "web",
      Driver: "bridge",
    });
    // webNet = await getNetwork('web');
  }
}

export async function initializeDevcontainerInfrastructure() {
  await initializeDockerCacheVolumes();
  await initializeDockerNetworks();
}
