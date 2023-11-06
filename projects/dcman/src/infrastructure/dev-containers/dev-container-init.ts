import Dockerode from "dockerode";
import { Docker as DockerCli, Options } from "docker-cli-js";
import { exec } from "@cpdevtools/lib-node-utilities";
import { set } from "date-fns";

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

async function getSecret(name: string) {
  try {
    const docker = new Dockerode();
    const secret = docker.getSecret(name);

    return await secret.inspect();
  } catch {
    return null;
  }
}

async function setSecret(name: string, value: string) {
  try {
    const docker = new Dockerode();
    const secret = await getSecret(name);
    if (secret && secret.CreatedAt) {
      secret.update({
        Data: Buffer.from(value).toString("base64"),
      });
    } else {
      await docker.createSecret({
        Name: name,
        Data: Buffer.from(value).toString("base64"),
      });
    }
  } catch {}
}

export async function initializeDockerNetworks() {
  const docker = new Dockerode();

  let swarmNet = await getNetwork("swarm");
  if (!swarmNet) {
    await exec(`docker network create --driver=overlay --attachable --scope=swarm swarm`);
  }

  let webNet = await getNetwork("web");
  if (!webNet) {
    await exec(`docker network create --driver=bridge --attachable web`);
  }
}
export async function initializeDockerSecrets() {
  await setSecret("dcm-admin-password", "admin");
}

export async function initializeDevcontainerInfrastructure() {
  await initializeDockerCacheVolumes();
  await initializeDockerNetworks();
  await initializeDockerSecrets();
}
