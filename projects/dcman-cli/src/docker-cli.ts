import {
  DEVCONTAINER_DIR,
  GithubSession,
  initializeCli,
  startWatchAndSyncDevContainer,
  startWorkspaceWatcher,
  syncDevContainer,
  syncGitReposInWorkSpaces,
  watchAndSyncDevContainer,
  watchAndSyncWorkspaces,
} from "@cpdevtools/dcman";
import { exec, run } from "@cpdevtools/lib-node-utilities";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

async function getFirstContainerIdFromDockerService(serviceName: string) {
  return (
    await run(`docker inspect --format "{{.Status.ContainerStatus.ContainerID}}" $(docker service ps -q ${serviceName} | head -n1)`)
  ).trim();
}

export default yargs(hideBin(process.argv))
  .scriptName("dcm")
  .parserConfiguration({
    "unknown-options-as-args": true,
  })
  .command(
    "run <command>",
    "run a command",
    (yargs) =>
      yargs
        .positional("command", {
          describe: "command to run",
          demandOption: true,
          type: "string",
        })
        .option("if-present", { type: "boolean", description: "only run if the command exists" }),
    async (args) => {
      const cmdArgs = args._.slice(1).join(" ");
      let runArgs = "";
      if (args.ifPresent) {
        runArgs += ` --if-present`;
      }

      await exec(`pnpm run ${runArgs} ${args.command} ${cmdArgs}`, { cwd: `${DEVCONTAINER_DIR}/.devcontainer` });
    }
  )
  .command(
    "docker",
    "watch and sync",
    (yargs) =>
      yargs.command(
        "service",
        "docker service commands",
        (yargs) =>
          yargs
            .command(
              "exec <service-name>",
              "execute code in the first task that matches the service",
              (yargs) =>
                yargs
                  .option("detach", { type: "boolean", alias: "d", description: "Detached mode: run command in the background" })
                  .option("detach-keys", { type: "string", description: "Override the key sequence for detaching a container" })
                  .option("env", { type: "array", alias: "e", description: "Set environment variables" })
                  .option("env-file", { type: "array", description: "Read in a file of environment variables" })
                  .option("interactive", { type: "boolean", alias: "i", description: "Keep STDIN open even if not attached" })
                  .option("privileged", { type: "boolean", description: "Give extended privileges to the command" })
                  .option("tty", { type: "boolean", alias: "t", description: "Allocate a pseudo-TTY" })
                  .option("user", { type: "string", alias: "u", description: "Username or UID (format: <name|uid>[:<group|gid>])" })
                  .option("workdir", { type: "string", alias: "w", description: "Working directory inside the container" })
                  .positional("service-name", { type: "string", demandOption: true, description: "The name of the service" }),
              async (args) => {
                const containerId = await getFirstContainerIdFromDockerService(args.serviceName);
                let cmd = `docker exec`;
                if (args.detach) cmd += ` -d`;
                if (args.detachKeys) cmd += ` --detach-keys ${args.detachKeys}`;
                if (args.env) cmd += ` -e ${args.env.join(" -e ")}`;
                if (args.envFile) cmd += ` --env-file ${args.envFile.join(" --env-file ")}`;
                if (args.interactive) cmd += ` -i`;
                if (args.privileged) cmd += ` --privileged`;
                if (args.tty) cmd += ` -t`;
                if (args.user) cmd += ` -u ${args.user}`;
                if (args.workdir) cmd += ` -w ${args.workdir}`;

                cmd += ` ${containerId} ${args._.slice(3).join(" ")}`;
                await exec(cmd);
              }
            )
            .command(
              "attach",
              "docker service commands",
              (yargs) => {},
              async (yargs) => {}
            ),
        async (yargs) => {}
      ),

    async (yargs) => {}
  )
  .command("sync-service", "watch and sync", (yargs) => {
    return yargs
      .command(
        "workspaces",
        "watch and sync workspaces",
        (yargs) => {},
        async (yargs) => {
          await initializeCli();
          await watchAndSyncWorkspaces();
        }
      )
      .command(
        "container",
        "watch and sync container",
        (yargs) => {},
        async (yargs) => {
          await initializeCli();
          await watchAndSyncDevContainer();
        }
      );
  })
  .command("dc-event", "event callbacks", (yargs) => {
    return yargs
      .command(
        "onCreate <devContainer>",
        "On Dev Container Create",
        (yargs) => {
          return yargs.positional("devContainer", {
            describe: "dev container id",
            demandOption: true,
            type: "string",
          });
        },
        async (yargs) => {
          await initializeCli();
          const github = await GithubSession.instance;
          await github.applyGitSettings();
          await syncDevContainer();
          await syncGitReposInWorkSpaces();
        }
      )
      .command(
        "updateContent <devContainer>",
        "On Dev Container updateContent",
        (yargs) => {
          return yargs.positional("devContainer", {
            describe: "dev container id",
            demandOption: true,
            type: "string",
          });
        },
        async (yargs) => {
          await initializeCli();
          // await startInfrastructure();
        }
      )
      .command(
        "postCreate <devContainer>",
        "On Dev Container postCreate",
        (yargs) => {
          return yargs.positional("devContainer", {
            describe: "dev container id",
            demandOption: true,
            type: "string",
          });
        },
        async (yargs) => {
          await initializeCli();
          // await startInfrastructure();
        }
      )
      .command(
        "postStart <devContainer>",
        "On Dev Container postStart",
        (yargs) => {
          return yargs.positional("devContainer", {
            describe: "dev container id",
            demandOption: true,
            type: "string",
          });
        },
        async (yargs) => {
          await initializeCli();
          await startWorkspaceWatcher();
          await startWatchAndSyncDevContainer();
        }
      )
      .command(
        "postAttach <devContainer>",
        "On Dev Container postAttach",
        (yargs) => {
          return yargs.positional("devContainer", {
            describe: "dev container id",
            demandOption: true,
            type: "string",
          });
        },
        async (yargs) => {
          await initializeCli();
          await syncDevContainer();
        }
      );
  });
