import { parseDevContainerGHRepoKey } from "../devcontainer/dev-container-util";
import { GithubSession } from "./github-session";
import { writeFile } from "fs/promises";

export async function writeGHTokenToDC(dcId: string) {
  const info = parseDevContainerGHRepoKey(dcId);

  const session = await GithubSession.instance;

  session.token;
}
