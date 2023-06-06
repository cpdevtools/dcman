"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startInfrastructure = void 0;
const dockerode_1 = __importDefault(require("dockerode"));
const dns_service_1 = require("./dns/dns-service");
const proxy_service_1 = require("./proxy/proxy-service");
const dev_containers_1 = require("./dev-containers");
const swarm_init_1 = require("./swarm/swarm-init");
async function getConfig(id) {
    try {
        const docker = new dockerode_1.default();
        const cfg = docker.getConfig(id);
        return await cfg.inspect();
    }
    catch {
        return null;
    }
}
function startInfrastructure() {
    return Promise.all([(0, swarm_init_1.initializeDockerSwarm)(), (0, dev_containers_1.initializeDevcontainerInfrastructure)(), (0, dns_service_1.initializeDNSService)(), (0, proxy_service_1.initializeProxyService)()]);
}
exports.startInfrastructure = startInfrastructure;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5mcmFzdHJ1Y3R1cmUvc3RhcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsMERBQStCO0FBQy9CLG1EQUF5RDtBQUN6RCx5REFBK0Q7QUFDL0QscURBQXdFO0FBQ3hFLG1EQUEyRDtBQUUzRCxLQUFLLFVBQVUsU0FBUyxDQUFDLEVBQVU7SUFDakMsSUFBSTtRQUNGLE1BQU0sTUFBTSxHQUFHLElBQUksbUJBQU0sRUFBRSxDQUFDO1FBQzVCLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDakMsT0FBTyxNQUFNLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztLQUM1QjtJQUFDLE1BQU07UUFDTixPQUFPLElBQUksQ0FBQztLQUNiO0FBQ0gsQ0FBQztBQUVELFNBQWdCLG1CQUFtQjtJQUNqQyxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFBLGtDQUFxQixHQUFFLEVBQUUsSUFBQSxxREFBb0MsR0FBRSxFQUFFLElBQUEsa0NBQW9CLEdBQUUsRUFBRSxJQUFBLHNDQUFzQixHQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzFJLENBQUM7QUFGRCxrREFFQyJ9