import glob from "fast-glob";
import { writeFile } from "fs/promises";

console.info("Applying versions...");

const mainPkg = require("../package.json");
const mainVersion = mainPkg.version;

function replaceVersion(depSection: { [key: string]: string } | undefined, version: string) {
  if (depSection) {
    for (const key in depSection) {
      const value = depSection[key];
      if (value === "0.0.0-PLACEHOLDER") {
        depSection[key] = version;
      }
    }
  }
}

(async () => {
  const files = await glob("repos/*/package.json");
  for (const file of files) {
    const pkg = require(`../${file}`);
    replaceVersion(pkg.dependencies, mainVersion);
    replaceVersion(pkg.devDependencies, mainVersion);
    replaceVersion(pkg.peerDependencies, mainVersion);
    replaceVersion(pkg.optionalDependencies, mainVersion);
    await writeFile(file, JSON.stringify(pkg, null, 2) + "\n");
  }
})();
