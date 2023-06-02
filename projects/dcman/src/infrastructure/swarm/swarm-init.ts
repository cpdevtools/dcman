import Dockerode from "dockerode";

export async function initializeDockerSwarm() {
  const docker = new Dockerode();
  const info = await docker.info();

  if (info.Swarm.LocalNodeState === "active") {
    return;
  }

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
}
