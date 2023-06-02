import Docker from "dockerode";
import { initializeDNSService } from "./dns/dns-service";
import { initializeProxyService } from "./proxy/proxy-service";
import { initializeDevcontainerInfrastructure } from "./dev-containers";
import { initializeDockerSwarm } from "./swarm/swarm-init";

async function getConfig(id: string) {
  try {
    const docker = new Docker();
    const cfg = docker.getConfig(id);
    return await cfg.inspect();
  } catch {
    return null;
  }
}

export function startInfrastructure() {
  return Promise.all([initializeDockerSwarm(), initializeDevcontainerInfrastructure(), initializeDNSService(), initializeProxyService()]);
}
