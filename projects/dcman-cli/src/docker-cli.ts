import {
  GithubSession,
  initializeCli,
  startWatchAndSyncDevContainer,
  startWorkspaceWatcher,
  syncDevContainer,
  syncGitReposInWorkSpaces,
  watchAndSyncDevContainer,
  watchAndSyncWorkspaces,
} from "@cpdevtools/dcman";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

export default yargs(hideBin(process.argv))
  .scriptName("dcm")
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
