import { writeFile } from "fs/promises";
import { getDevcontainerPath } from "../devcontainer/dev-container-util";
import { GithubSession } from "./github-session";

export async function writeGHTokenToDC(dcId: string) {
  const session = await GithubSession.instance;
  await writeFile(`${getDevcontainerPath(dcId)}/.github.token.env`, `GITHUB_TOKEN=${session.token}`, { encoding: "utf-8" });
}
