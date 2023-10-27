import Docker from "dockerode";
import { initializeDNSService } from "./dns/dns-service";
import { initializeProxyService } from "./proxy/proxy-service";
import { initializeDevcontainerInfrastructure } from "./dev-containers";
import { initializeDockerSwarm } from "./swarm/swarm-init";
import { initializeEmailService } from "./email";
import { initializeLoggingService } from "./logging";

async function getConfig(id: string) {
  try {
    const docker = new Docker();
    const cfg = docker.getConfig(id);
    return await cfg.inspect();
  } catch {
    return null;
  }
}

export async function startInfrastructure() {
  await initializeDockerSwarm();
  await initializeDevcontainerInfrastructure();
  await Promise.all([initializeDNSService(), initializeProxyService(), initializeEmailService()]);
  //await Promise.all([initializeDNSService(), initializeProxyService(), initializeEmailService()]);
  //await initializeLoggingService();
}
