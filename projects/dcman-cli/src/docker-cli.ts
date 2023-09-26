import {
  startWatchAndSyncDevContainer,
  //  openDevcontainer,
  // startDevContainerSyncWatcher,
  startWorkspaceWatcher,
  syncDevContainer,
  //  syncDevContainer,
  syncGitReposInWorkSpaces,
  watchAndSyncWorkspaces,
} from "@cpdevtools/dcman";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

export default yargs(hideBin(process.argv))
  .scriptName("dcm")
  .command("dc-workspaces", "dev container workspaces", (yargs) => {
    return yargs.command(
      "watch",
      "watch workspaces",
      (yargs) => {},
      async (yargs) => {
        await watchAndSyncWorkspaces();
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
          console.log("asdfg...");
          await syncDevContainer();
          await syncGitReposInWorkSpaces();
          await Promise.all([startWatchAndSyncDevContainer(), startWorkspaceWatcher()]);
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
          // await startInfrastructure();
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
          // await startInfrastructure();
          //     await syncDevContainer();
        }
      );
  });
