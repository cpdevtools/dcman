import Docker from "dockerode";
import { initializeDNSService } from "./dns/dns-service";
import { initializeProxyService } from "./proxy/proxy-service";
import { initializeDevcontainerInfrastructure } from "./dev-containers";

async function initializeDockerSwarm() {
  const docker = new Docker();
  const info = await docker.info();

  if (info.Swarm.LocalNodeState === "active") {
    return;
  }

  console.info("Initializing Docker Swarm");
  const swarmId = await docker.swarmInit({
    ListenAddr: "0.0.0.0",
    Spec: {
      Name: "default",
      Orchestration: {
        TaskHistoryRetentionLimit: 1,
      },
      TaskDefaults: {
        LogDriver: {
          Name: "json-file",
          Options: {
            "max-file": "3",
            "max-size": "10m",
          },
        },
      },
      EncryptionConfig: {
        AutoLockManagers: false,
      },
    },
  });

  console.info("Docker Swarm initialized", swarmId);
}

async function getConfig(id: string) {
  const docker = new Docker();
  const cfg = docker.getConfig(id);
  try {
    return await cfg.inspect();
  } catch {
    return null;
  }
}

export function startInfrastructure() {
  return Promise.all([initializeDockerSwarm(), initializeDevcontainerInfrastructure(), initializeDNSService(), initializeProxyService()]);
}

// (async () => {
//   await startInfrastructure();
// })();
