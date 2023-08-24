import { Endpoints } from "@octokit/types";

export type Repo = Endpoints["GET /repos/{owner}/{repo}"]["response"]["data"];

export type Branches = Endpoints["GET /repos/{owner}/{repo}/branches"]["response"]["data"];
export type Branch = Branches[keyof Branches];

export type Tags = Endpoints["GET /repos/{owner}/{repo}/tags"]["response"]["data"];
export type Tag = Tags[keyof Tags];
