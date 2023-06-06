"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeProxyService = void 0;
const docker_cli_js_1 = require("docker-cli-js");
async function initializeProxyService() {
    const cwd = __dirname;
    const cliOpts = new docker_cli_js_1.Options(undefined, cwd, true);
    const cli = new docker_cli_js_1.Docker(cliOpts);
    await cli.command(`stack deploy -c stack.yml dcm-infrastructure`);
}
exports.initializeProxyService = initializeProxyService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJveHktc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9pbmZyYXN0cnVjdHVyZS9wcm94eS9wcm94eS1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGlEQUE2RDtBQUV0RCxLQUFLLFVBQVUsc0JBQXNCO0lBQzFDLE1BQU0sR0FBRyxHQUFHLFNBQVMsQ0FBQztJQUN0QixNQUFNLE9BQU8sR0FBRyxJQUFJLHVCQUFPLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNsRCxNQUFNLEdBQUcsR0FBRyxJQUFJLHNCQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbkMsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLDhDQUE4QyxDQUFDLENBQUM7QUFDcEUsQ0FBQztBQUxELHdEQUtDIn0=