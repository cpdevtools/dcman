#!/usr/bin/env node

import {
  ensureGithubLogin,
  githubLogout,
  openDevcontainer,
  startDevContainerSyncWatcher,
  startInfrastructure,
  startWorkspaceWatcher,
  syncDevContainer,
  syncGitReposInWorkSpaces,
  watchAndSyncDevContainer,
  watchAndSyncWorkspaces,
} from "@cpdevtools/dcman";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import isDocker from "is-docker";
import isWindows from "is-windows";

//import dockerCli from './docker-cli';
import linuxCli from "./linux-cli";
import winCli from "./windows-cli";

(async () => {
  if (isDocker()) {
    const dockerCli = (await import("./docker-cli")).default;
    await dockerCli.parseAsync();
  } else if (isWindows()) {
    winCli.parse();
  } else {
    linuxCli.parse();
  }
})();

const args = yargs(hideBin(process.argv))
  .scriptName("dcm")
  .command(
    "test",
    "test stuff",
    (yargs) => {
      return yargs;
    },
    async (yargs) => {
      await ensureGithubLogin();
    }
  )
  .command(
    "login",
    "login to github",
    (yargs) => {
      return yargs;
    },
    async (yargs) => {
      await ensureGithubLogin();
    }
  )
  .command(
    "logout",
    "logout of github",
    (yargs) => {
      return yargs;
    },
    async (yargs) => {
      await githubLogout();
    }
  )
  .command(
    "dc-workspaces watch",
    "watch workspaces",
    (yargs) => {
      return yargs;
    },
    async (yargs) => {
      await watchAndSyncWorkspaces();
    }
  )
  .command(
    "dc-devcontainer watch",
    "watch devcontainer",
    (yargs) => {
      return yargs;
    },
    async (yargs) => {
      await watchAndSyncDevContainer();
    }
  )
  .command(
    "open <container>",
    "description goes here",
    (yargs) => {
      return yargs.positional("container", {
        describe: "Github repo url or owner/repo",
        type: "string",
      });
    },
    async (yargs) => {
      // await ensureGithubLogin();
      await openDevcontainer(yargs.container);
    }
  )
  .command("dc-event", "event callbacks", (yargs) => {
    return yargs
      .command(
        "initialize <devContainer>",
        "On Dev Container Initialize",
        (yargs) => {
          return yargs.positional("devContainer", {
            describe: "dev container id",
            demandOption: true,
            type: "string",
          });
        },
        async (yargs) => {
          await ensureGithubLogin();
          await syncDevContainer(true);
          await startInfrastructure();
        }
      )
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
          await syncGitReposInWorkSpaces();
          await startWorkspaceWatcher();
          await startDevContainerSyncWatcher();
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
          await syncDevContainer();
        }
      );
  })
  .command(
    "dc-monitor",
    "monitor dev container",
    (yargs) => {
      return yargs;
    },
    async () => {}
  )
  .parse();
