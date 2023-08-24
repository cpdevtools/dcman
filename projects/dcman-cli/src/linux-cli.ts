import {
  DevContainerManager,
  GithubSession,
  ProfileManager,
  //ensureGithubLogin,
  initializeCli,
  //openDevcontainer,
  printAsYaml,
  //syncDevContainer,
  //watchAndSyncDevContainer,
  watchAndSyncWorkspaces,
} from "@cpdevtools/dcman";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

export default yargs(hideBin(process.argv))
  .scriptName("dcm")
  .command(
    "test",
    "test",
    (yargs) => {
      return yargs;
    },
    async (yargs) => {
      await initializeCli();
      await (await DevContainerManager.instance).resetDevContainer("cpdevtools/devcontainer-devcontainers");
    }
  )
  .command(
    "login",
    "login to github",
    (yargs) => {
      return yargs;
    },
    async (yargs) => {
      await initializeCli();
      await GithubSession.login();
    }
  )
  .command(
    "logout",
    "logout of github",
    (yargs) => {
      return yargs;
    },
    async (yargs) => {
      await initializeCli();
      await GithubSession.logout();
    }
  )

  .command(
    "profile-sources",
    "prints a list of profile sources",
    (yargs) => {
      return yargs
        .command(
          "add <source>",
          "Add profile source",
          (yargs) =>
            yargs.positional("source", {
              describe: "The source of profiles to add. Must be a vaild github repo and in the format of 'owner/repo'",
              type: "string",
              demandOption: true,
            }),
          async (yargs) => {
            await initializeCli();
            GithubSession.exitIfNotLoggedIn();
            const pm = await ProfileManager.instance;
            await pm.addProfileSource(yargs.source);
          }
        )
        .command(
          "remove <source>",
          "Remove a profile source",
          (yargs) =>
            yargs.positional("source", {
              describe: "The source of profiles to remove. Must be in the format of 'owner/repo'",
              type: "string",
              demandOption: true,
            }),
          async (yargs) => {
            await initializeCli();
            GithubSession.exitIfNotLoggedIn();
            const pm = await ProfileManager.instance;
            await pm.removeProfileSource(yargs.source, true);
          }
        )
        .command(
          "create <source>",
          "Create a new profile source repo",
          (yargs) =>
            yargs.positional("source", {
              describe: "The source of profiles to create. Must be in the format of 'owner/repo'",
              type: "string",
              demandOption: true,
            }),
          async (yargs) => {
            await initializeCli();
            GithubSession.exitIfNotLoggedIn();
            const pm = await ProfileManager.instance;
            await pm.createProfileSource(yargs.source);
          }
        );
    },
    async (args) => {
      await initializeCli();
      const pm = await ProfileManager.instance;
      printAsYaml(
        {
          "Profile Sources": await pm.getProfileSourceIds(),
        },
        { cliColor: true }
      );
    }
  )

  .command(
    "profiles",
    "profiles",
    (yargs) => {
      return yargs
        .command(
          "create",
          "create profile",
          (yargs) => yargs,
          async (yargs) => {
            await initializeCli();
            const pm = await ProfileManager.instance;
          }
        )
        .command(
          "remove",
          "remove profile",
          (yargs) => yargs,
          async (yargs) => {
            await initializeCli();
            const pm = await ProfileManager.instance;
          }
        );
    },
    async (yargs) => {
      await initializeCli();
      const pm = await ProfileManager.instance;
      const profiles = await pm.getProfiles();
      printAsYaml(
        {
          Profiles: profiles,
        },
        { cliColor: true }
      );
    }
  )

  .command(
    "profile",
    "profile",
    (yargs) => {
      return yargs.command(
        "set <profile>",
        "set active profile",
        (yargs) =>
          yargs.positional("profile", {
            describe: "The profile to set as active",
            type: "string",
            demandOption: true,
          }),
        async (yargs) => {
          await initializeCli();
          const pm = await ProfileManager.instance;
          const hasProfile = await pm.hasProfile(yargs.profile);
          if (!hasProfile) {
            throw new Error(`Profile '${yargs.profile}' does not exist`);
          }
          await pm.setActiveProfile(yargs.profile);
          printAsYaml(
            {
              "Active Profile": (await pm.activeProfileId) ?? "None",
            },
            { cliColor: true }
          );
        }
      );
    },
    async (yargs) => {
      await initializeCli();
      const pm = await ProfileManager.instance;
      printAsYaml(
        {
          "Active Profile": (await pm.activeProfileId) ?? "None",
        },
        { cliColor: true }
      );
    }
  )

  .command(
    "open <container> [<workspaceOrFolder>]",
    "description goes here",
    (yargs) => {
      return yargs
        .positional("container", {
          describe: "Github repo url or owner/repo",
          type: "string",
          demandOption: true,
        })
        .positional("workspaceOrFolder", {
          describe: "the workspace or folder to open inside the dev container",
          type: "string",
        });
    },
    async (yargs) => {
      const dcm = await DevContainerManager.instance;
      await dcm.openDevContainer(yargs.container, yargs.workspaceOrFolder);
    }
  )
  .command(
    "add <container>",
    "description goes here",
    (yargs) => {
      return yargs.positional("container", {
        describe: "Github repo url or owner/repo",
        type: "string",
        demandOption: true,
      });
    },
    async (yargs) => {
      const dcm = await DevContainerManager.instance;
      await dcm.addDevContainer(yargs.container);
    }
  )
  .command(
    "remove <container>",
    "description goes here",
    (yargs) => {
      return yargs.positional("container", {
        describe: "Github repo url or owner/repo",
        type: "string",
        demandOption: true,
      });
    },
    async (yargs) => {
      const dcm = await DevContainerManager.instance;
      await dcm.removeDevContainer(yargs.container);
    }
  )
  .command(
    "reset <container>",
    "description goes here",
    (yargs) => {
      return yargs.positional("container", {
        describe: "Github repo url or owner/repo",
        type: "string",
        demandOption: true,
      });
    },
    async (yargs) => {
      await initializeCli();
      await (await DevContainerManager.instance).resetDevContainer(yargs.container);
    }
  )
  .command(
    "list",
    "description goes here",
    (yargs) => yargs.option("all", { alias: "a", type: "boolean", description: "List all dev containers" }),
    async (yargs) => {
      const dcm = await DevContainerManager.instance;
      const containers = await (yargs.all ? dcm.listAllDevContainers() : dcm.listProfileDevContainers());
      printAsYaml(
        {
          "Dev containers": containers.length > 0 ? containers : "None",
        },
        { cliColor: true }
      );
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
      // await watchAndSyncDevContainer();
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
        // await ensureGithubLogin();
        //   await syncDevContainer(true);
        //    await startInfrastructure();
      }
    );
  });
