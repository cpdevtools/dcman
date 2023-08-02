import {
  ensureGithubLogin,
  githubLogout,
  openDevcontainer,
  startInfrastructure,
  syncDevContainer,
  watchAndSyncDevContainer,
  watchAndSyncWorkspaces,
} from "@cpdevtools/dcman";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

export default yargs(hideBin(process.argv))
  .scriptName("dcm")
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
  .command("dc-event", "event callbacks", (yargs) => {
    return yargs.command(
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
    );
  });
