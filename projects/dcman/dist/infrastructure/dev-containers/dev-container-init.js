"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDevcontainerInfrastructure = exports.initializeDockerNetworks = exports.initializeDockerCacheVolumes = void 0;
const dockerode_1 = __importDefault(require("dockerode"));
async function initializeDockerCacheVolumes() {
    const docker = new dockerode_1.default();
    await docker.createVolume({
        Name: "dcm-pnpm-cache",
        Labels: {
            use: "pnpm-cache",
        },
    });
    await docker.createVolume({
        Name: "dcm-npm-cache",
        Labels: {
            use: "npm-cache",
        },
    });
    await docker.createVolume({
        Name: "dcm-yarn-cache",
        Labels: {
            use: "yarn-cache",
        },
    });
    await docker.createVolume({
        Name: "dcm-nuget-cache",
        Labels: {
            use: "nuget-cache",
        },
    });
}
exports.initializeDockerCacheVolumes = initializeDockerCacheVolumes;
async function getNetwork(name) {
    try {
        const docker = new dockerode_1.default();
        const network = docker.getNetwork(name);
        return await network.inspect();
    }
    catch {
        return null;
    }
}
async function initializeDockerNetworks() {
    const docker = new dockerode_1.default();
    let webProxyNet = await getNetwork("web-proxy");
    if (!webProxyNet) {
        await docker.createNetwork({
            Name: "web-proxy",
            Driver: "bridge",
        });
        //webProxyNet = await getNetwork('web-proxy');
    }
    let webNet = await getNetwork("web");
    if (!webNet) {
        await docker.createNetwork({
            Name: "web",
            Driver: "bridge",
        });
        // webNet = await getNetwork('web');
    }
}
exports.initializeDockerNetworks = initializeDockerNetworks;
async function initializeDevcontainerInfrastructure() {
    await initializeDockerCacheVolumes();
    await initializeDockerNetworks();
}
exports.initializeDevcontainerInfrastructure = initializeDevcontainerInfrastructure;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2LWNvbnRhaW5lci1pbml0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2luZnJhc3RydWN0dXJlL2Rldi1jb250YWluZXJzL2Rldi1jb250YWluZXItaW5pdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwwREFBa0M7QUFFM0IsS0FBSyxVQUFVLDRCQUE0QjtJQUNoRCxNQUFNLE1BQU0sR0FBRyxJQUFJLG1CQUFTLEVBQUUsQ0FBQztJQUMvQixNQUFNLE1BQU0sQ0FBQyxZQUFZLENBQUM7UUFDeEIsSUFBSSxFQUFFLGdCQUFnQjtRQUN0QixNQUFNLEVBQUU7WUFDTixHQUFHLEVBQUUsWUFBWTtTQUNsQjtLQUNGLENBQUMsQ0FBQztJQUNILE1BQU0sTUFBTSxDQUFDLFlBQVksQ0FBQztRQUN4QixJQUFJLEVBQUUsZUFBZTtRQUNyQixNQUFNLEVBQUU7WUFDTixHQUFHLEVBQUUsV0FBVztTQUNqQjtLQUNGLENBQUMsQ0FBQztJQUNILE1BQU0sTUFBTSxDQUFDLFlBQVksQ0FBQztRQUN4QixJQUFJLEVBQUUsZ0JBQWdCO1FBQ3RCLE1BQU0sRUFBRTtZQUNOLEdBQUcsRUFBRSxZQUFZO1NBQ2xCO0tBQ0YsQ0FBQyxDQUFDO0lBQ0gsTUFBTSxNQUFNLENBQUMsWUFBWSxDQUFDO1FBQ3hCLElBQUksRUFBRSxpQkFBaUI7UUFDdkIsTUFBTSxFQUFFO1lBQ04sR0FBRyxFQUFFLGFBQWE7U0FDbkI7S0FDRixDQUFDLENBQUM7QUFDTCxDQUFDO0FBMUJELG9FQTBCQztBQUVELEtBQUssVUFBVSxVQUFVLENBQUMsSUFBWTtJQUNwQyxJQUFJO1FBQ0YsTUFBTSxNQUFNLEdBQUcsSUFBSSxtQkFBUyxFQUFFLENBQUM7UUFDL0IsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN4QyxPQUFPLE1BQU0sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0tBQ2hDO0lBQUMsTUFBTTtRQUNOLE9BQU8sSUFBSSxDQUFDO0tBQ2I7QUFDSCxDQUFDO0FBRU0sS0FBSyxVQUFVLHdCQUF3QjtJQUM1QyxNQUFNLE1BQU0sR0FBRyxJQUFJLG1CQUFTLEVBQUUsQ0FBQztJQUMvQixJQUFJLFdBQVcsR0FBRyxNQUFNLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNoRCxJQUFJLENBQUMsV0FBVyxFQUFFO1FBQ2hCLE1BQU0sTUFBTSxDQUFDLGFBQWEsQ0FBQztZQUN6QixJQUFJLEVBQUUsV0FBVztZQUNqQixNQUFNLEVBQUUsUUFBUTtTQUNqQixDQUFDLENBQUM7UUFDSCw4Q0FBOEM7S0FDL0M7SUFFRCxJQUFJLE1BQU0sR0FBRyxNQUFNLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNyQyxJQUFJLENBQUMsTUFBTSxFQUFFO1FBQ1gsTUFBTSxNQUFNLENBQUMsYUFBYSxDQUFDO1lBQ3pCLElBQUksRUFBRSxLQUFLO1lBQ1gsTUFBTSxFQUFFLFFBQVE7U0FDakIsQ0FBQyxDQUFDO1FBQ0gsb0NBQW9DO0tBQ3JDO0FBQ0gsQ0FBQztBQW5CRCw0REFtQkM7QUFFTSxLQUFLLFVBQVUsb0NBQW9DO0lBQ3hELE1BQU0sNEJBQTRCLEVBQUUsQ0FBQztJQUNyQyxNQUFNLHdCQUF3QixFQUFFLENBQUM7QUFDbkMsQ0FBQztBQUhELG9GQUdDIn0=