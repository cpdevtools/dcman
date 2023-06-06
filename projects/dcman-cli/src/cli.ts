#!/usr/bin/env node

import { startInfrastructure } from "@cpdevtools/dcman";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const args = yargs(hideBin(process.argv))
  .command(
    "on-dc-startup <devContainer>",
    "On Dev Container Startup",
    () => {
      return yargs.positional("devContainer", {
        describe: "dev container name",
        demandOption: true,
        type: "string",
      });
    },
    async (yargs) => {
      await startInfrastructure();
    }
  )
  .parse();
