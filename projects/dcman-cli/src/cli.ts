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

// .command('serve [port]', 'start the server', (yargs) => {
//   return yargs
//     .positional('port', {
//       describe: 'port to bind on',
//       default: 5000
//     })
// }, (argv) => {
//   if (argv.verbose) console.info(`start server on :${argv.port}`)
//   serve(argv.port)
// })
// .option('verbose', {
//   alias: 'v',
//   type: 'boolean',
//   description: 'Run with verbose logging'
// })
// .parse()
