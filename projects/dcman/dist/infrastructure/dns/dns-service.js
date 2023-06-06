"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDNSService = void 0;
const docker_cli_js_1 = require("docker-cli-js");
const dockerode_1 = __importDefault(require("dockerode"));
async function initializeDNSService() {
    const docker = new dockerode_1.default();
    const cwd = __dirname;
    const stream = await docker.buildImage({
        context: cwd,
        src: ["dockerfile", "dnsmasq.conf"],
    }, {
        t: "dcm-dnsmasq",
    });
    await new Promise((resolve, reject) => {
        docker.modem.followProgress(stream, (err, res) => (err ? reject(err) : resolve(res)));
    });
    const cliOpts = new docker_cli_js_1.Options(undefined, cwd, true);
    const cli = new docker_cli_js_1.Docker(cliOpts);
    await cli.command(`stack deploy -c stack.yml dcm-infrastructure`);
}
exports.initializeDNSService = initializeDNSService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG5zLXNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvaW5mcmFzdHJ1Y3R1cmUvZG5zL2Rucy1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGlEQUE2RDtBQUM3RCwwREFBa0M7QUFFM0IsS0FBSyxVQUFVLG9CQUFvQjtJQUN4QyxNQUFNLE1BQU0sR0FBRyxJQUFJLG1CQUFTLEVBQUUsQ0FBQztJQUUvQixNQUFNLEdBQUcsR0FBRyxTQUFTLENBQUM7SUFFdEIsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsVUFBVSxDQUNwQztRQUNFLE9BQU8sRUFBRSxHQUFHO1FBQ1osR0FBRyxFQUFFLENBQUMsWUFBWSxFQUFFLGNBQWMsQ0FBQztLQUNwQyxFQUNEO1FBQ0UsQ0FBQyxFQUFFLGFBQWE7S0FDakIsQ0FDRixDQUFDO0lBRUYsTUFBTSxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNwQyxNQUFNLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3hGLENBQUMsQ0FBQyxDQUFDO0lBRUgsTUFBTSxPQUFPLEdBQUcsSUFBSSx1QkFBTyxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDbEQsTUFBTSxHQUFHLEdBQUcsSUFBSSxzQkFBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ25DLE1BQU0sR0FBRyxDQUFDLE9BQU8sQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFDO0FBQ3BFLENBQUM7QUF0QkQsb0RBc0JDIn0=