import { GithubAuthStatus, exec, githubAuthStatus, envVars } from "@cpdevtools/lib-node-utilities";
import { Octokit } from "@octokit/rest";
import simpleGit from "simple-git";

export interface GithubUserData {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name: string;
  company: string | null;
  blog: string;
  location: string | null;
  email: string | null;
  hireable: boolean | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
  private_gists: number;
  total_private_repos: number;
  owned_private_repos: number;
  disk_usage: number;
  collaborators: number;
  two_factor_authentication: boolean;
  plan: {
    name: string;
    space: number;
    private_repos: number;
    collaborators: number;
  };
}

export class GithubUser {
  private static _additionalScopes = ["read:packages", "read:user", "user:email"];
  private static _requiredScopes = ["read:packages", "read:user", "user:email", "read:org", "repo", "workflow"];

  public static async loadUser() {
    const user = new GithubUser();
    await user._load();
    return user;
  }
  private _authStatus?: GithubAuthStatus;
  private _email?: string;
  private _userData?: GithubUserData;

  private _octokit?: Octokit;

  private constructor() {}

  private async _load() {
    await this._authenticate();
    await this._loadUser();
    this._setupGitConfig();
  }

  private async _authenticate() {
    try {
      this._authStatus = await githubAuthStatus();
      this._validateScopes();
    } catch {
      this._authStatus = undefined;
    }

    while (!this._authStatus?.username) {
      const success = !(await exec(`gh auth login -h github.com -p https -s ${GithubUser._additionalScopes.join(",")}`));
      if (success) {
        this._authStatus = await githubAuthStatus();
        this._validateScopes();
      }
    }
    this._octokit = new Octokit({ auth: this._authStatus.token });
  }

  private async _validateScopes() {
    if (this._authStatus?.username) {
      const missingScopes = GithubUser._requiredScopes.filter((scope) => !this._authStatus?.scopes?.includes(scope));
      if (missingScopes.length) {
        console.warn(`Missing scopes: ${missingScopes.join(", ")}`);
        const success = !(await exec(`gh auth refresh --insecure-storage -h github.com -s ${missingScopes.join(",")}`));
        if (success) {
          this._authStatus = await githubAuthStatus();
        }
      }
    }
  }

  private async _loadUser() {
    if (this._authStatus?.username) {
      const userResponse = await this._octokit?.users.getAuthenticated();
      if (userResponse?.status === 200) {
        this._userData = userResponse?.data as GithubUserData;
      }
      const emails = await this._octokit?.users.listEmailsForAuthenticatedUser();
      if (emails?.status === 200) {
        this._email = emails?.data.find((email) => email.visibility !== "private")?.email;
      } else {
        this._email = undefined;
      }
    }
  }

  private async _setupGitConfig() {
    const git = simpleGit();
    await git.addConfig("user.name", this.name!, false, "global");
    await git.addConfig("user.email", this.email!, false, "global");
    await git.addConfig("pull.rebase", "false", false, "global");
    envVars("GH_AUTH_TOKEN", this.token!);
  }

  public get username() {
    return this._authStatus?.username;
  }

  public get email() {
    return this._email;
  }

  public get token() {
    return this._authStatus?.token;
  }

  public get protocol() {
    return this._authStatus?.token;
  }

  public get scopes() {
    return this._authStatus?.scopes;
  }

  public get id() {
    return this._userData?.id;
  }

  public get name() {
    return this._userData?.name;
  }

  public get url() {
    return this._userData?.url;
  }
}
