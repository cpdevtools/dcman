import { Branches, Tags } from "../github";

export interface DevContainerGHRepo {
  owner: string;
  repo: string;
  branchOrTag?: string;
  defaultBranch: string;
  branches: Branches;
  tags: Tags;
}
