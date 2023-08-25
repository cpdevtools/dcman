#!/usr/bin/env node

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
