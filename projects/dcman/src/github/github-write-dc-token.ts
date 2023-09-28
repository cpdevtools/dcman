import { writeFile } from "fs/promises";
import { getDevcontainerPath } from "../devcontainer/dev-container-util";
import { GithubSession } from "./github-session";

export async function writeGHTokenToEnvFile(filePath: string) {
  const session = await GithubSession.instance;
  await writeFile(`${filePath}/.devcontainer/.github.token.env`, `GITHUB_TOKEN=${session.token}`, { encoding: "utf-8" });
}
