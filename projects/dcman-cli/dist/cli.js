"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dcman_1 = require("@cpdevtools/dcman");
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const args = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
    .command("on-dc-startup <devContainer>", "On Dev Container Startup", () => {
    return yargs_1.default.positional("devContainer", {
        describe: "dev container name",
        demandOption: true,
        type: "string",
    });
}, async (yargs) => {
    await (0, dcman_1.startInfrastructure)();
})
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDZDQUF3RDtBQUV4RCxrREFBMEI7QUFDMUIsMkNBQXdDO0FBRXhDLE1BQU0sSUFBSSxHQUFHLElBQUEsZUFBSyxFQUFDLElBQUEsaUJBQU8sRUFBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDdEMsT0FBTyxDQUNOLDhCQUE4QixFQUM5QiwwQkFBMEIsRUFDMUIsR0FBRyxFQUFFO0lBQ0gsT0FBTyxlQUFLLENBQUMsVUFBVSxDQUFDLGNBQWMsRUFBRTtRQUN0QyxRQUFRLEVBQUUsb0JBQW9CO1FBQzlCLFlBQVksRUFBRSxJQUFJO1FBQ2xCLElBQUksRUFBRSxRQUFRO0tBQ2YsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxFQUNELEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRTtJQUNkLE1BQU0sSUFBQSwyQkFBbUIsR0FBRSxDQUFDO0FBQzlCLENBQUMsQ0FDRjtLQUNBLEtBQUssRUFBRSxDQUFDO0FBRVgsNERBQTREO0FBQzVELGlCQUFpQjtBQUNqQiw0QkFBNEI7QUFDNUIscUNBQXFDO0FBQ3JDLHNCQUFzQjtBQUN0QixTQUFTO0FBQ1QsaUJBQWlCO0FBQ2pCLG9FQUFvRTtBQUNwRSxxQkFBcUI7QUFDckIsS0FBSztBQUNMLHVCQUF1QjtBQUN2QixnQkFBZ0I7QUFDaEIscUJBQXFCO0FBQ3JCLDRDQUE0QztBQUM1QyxLQUFLO0FBQ0wsV0FBVyJ9