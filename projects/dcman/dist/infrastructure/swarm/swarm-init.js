"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDockerSwarm = void 0;
const dockerode_1 = __importDefault(require("dockerode"));
async function initializeDockerSwarm() {
    const docker = new dockerode_1.default();
    const info = await docker.info();
    if (info.Swarm.LocalNodeState === "active") {
        return;
    }
    const swarmId = await docker.swarmInit({
        ListenAddr: "0.0.0.0",
        Spec: {
            Name: "default",
            Orchestration: {
                TaskHistoryRetentionLimit: 1,
            },
            TaskDefaults: {
                LogDriver: {
                    Name: "json-file",
                    Options: {
                        "max-file": "3",
                        "max-size": "10m",
                    },
                },
            },
            EncryptionConfig: {
                AutoLockManagers: false,
            },
        },
    });
}
exports.initializeDockerSwarm = initializeDockerSwarm;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3dhcm0taW5pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9pbmZyYXN0cnVjdHVyZS9zd2FybS9zd2FybS1pbml0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDBEQUFrQztBQUUzQixLQUFLLFVBQVUscUJBQXFCO0lBQ3pDLE1BQU0sTUFBTSxHQUFHLElBQUksbUJBQVMsRUFBRSxDQUFDO0lBQy9CLE1BQU0sSUFBSSxHQUFHLE1BQU0sTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO0lBRWpDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLEtBQUssUUFBUSxFQUFFO1FBQzFDLE9BQU87S0FDUjtJQUVELE1BQU0sT0FBTyxHQUFHLE1BQU0sTUFBTSxDQUFDLFNBQVMsQ0FBQztRQUNyQyxVQUFVLEVBQUUsU0FBUztRQUNyQixJQUFJLEVBQUU7WUFDSixJQUFJLEVBQUUsU0FBUztZQUNmLGFBQWEsRUFBRTtnQkFDYix5QkFBeUIsRUFBRSxDQUFDO2FBQzdCO1lBQ0QsWUFBWSxFQUFFO2dCQUNaLFNBQVMsRUFBRTtvQkFDVCxJQUFJLEVBQUUsV0FBVztvQkFDakIsT0FBTyxFQUFFO3dCQUNQLFVBQVUsRUFBRSxHQUFHO3dCQUNmLFVBQVUsRUFBRSxLQUFLO3FCQUNsQjtpQkFDRjthQUNGO1lBQ0QsZ0JBQWdCLEVBQUU7Z0JBQ2hCLGdCQUFnQixFQUFFLEtBQUs7YUFDeEI7U0FDRjtLQUNGLENBQUMsQ0FBQztBQUNMLENBQUM7QUE3QkQsc0RBNkJDIn0=