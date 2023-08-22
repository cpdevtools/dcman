import { GithubAuthStatus as GhAuthStatus, exec, githubAuthStatus, importChalk, importInquirer } from "@cpdevtools/lib-node-utilities";
import { Octokit } from "@octokit/rest";
import { EndpointDefaults, OctokitResponse, RequestOptions } from "@octokit/types";
import { differenceInHours, formatDistanceToNow, isValid, parseJSON } from "date-fns";
import { mkdir, rm } from "fs/promises";
import { CachedFile } from "../cache";
import { DCM_CACHE_DIR } from "../constants";

export type GithubAuthStatus = Omit<GhAuthStatus, "token">;

const GH_AUTH_STATUS_CACHE_FILE = `${DCM_CACHE_DIR}/gh-auth-status.yml`;
const SCOPES_ADDITIONAL = ["gist"];
const SCOPES_REQUIRED = ["read:packages", "read:user", "user:email", "read:org", "repo", "workflow"];
const SCOPES = [...SCOPES_ADDITIONAL, ...SCOPES_REQUIRED];

export interface LoginOptions {
  method?: "token" | "browser";
}

export class GithubSession {
  private static _instancePromise: Promise<GithubSession>;

  public static get instance(): Promise<GithubSession> {
    if (!this._instancePromise) {
      this._instancePromise = new Promise<GithubSession>(async (resolve, reject) => {
        try {
          const inst = new GithubSession();
          await inst._initialize();
          resolve(inst);
        } catch (e) {
          reject(e);
        }
      });
    }
    return this._instancePromise;
  }

  public static async clearCache() {
    const inst = await this.instance;
    await inst.clearCache();
  }

  public static async exitIfNotLoggedIn(): Promise<GithubSession | never> {
    const inst = await this.instance;
    if (!inst.token) {
      console.error("You must be logged in to use this command.");
      process.exit(1);
    }
    return inst;
  }

  public static async login(opts?: LoginOptions): Promise<GithubSession> {
    const inst = await this.instance;
    await inst.login(opts);
    return inst;
  }

  public static async logout(): Promise<GithubSession> {
    const inst = await this.instance;
    await inst.logout();
    return inst;
  }

  private _authStatusPromise?: Promise<GithubAuthStatus | undefined>;
  private _api?: Octokit;
  private __token?: string;
  private _responseCache: { [key: string]: OctokitResponse<any> } = {};

  public get api(): Octokit | undefined {
    return this._api;
  }

  public get token(): string | undefined {
    return this.__token;
  }

  public get authStatus(): Promise<GithubAuthStatus | undefined> {
    if (!this._authStatusPromise) {
      this._authStatusPromise = new Promise<GithubAuthStatus | undefined>(async (resolve, reject) => {
        try {
          const authStatus = await githubAuthStatus(this._env());
          resolve(authStatus);
        } catch {
          resolve(undefined);
        }
      });
    }
    return this._authStatusPromise;
  }

  private constructor() {}

  private async _initialize() {
    const authStatus = await this.authStatus;
    if (authStatus) {
      this._initializeOctokit((authStatus as GhAuthStatus).token);
    }
  }

  private _env() {
    const env = { ...process.env };
    delete env.GITHUB_TOKEN;
    delete env.GH_TOKEN;
    return env;
  }

  private _initializeOctokit(token: string) {
    this.__token = token;
    this._api = new Octokit({
      auth: token,
    });

    this._api.hook.error("request", async (error, options) => {
      if ("status" in error) {
        if (error.status === 304) {
          return this._handleCacheHit(error.request, error.response!, options);
        }
      }
      throw error;
    });

    this._api.hook.wrap("request", async (request, options) => {
      const cacheFile = this._opts2CacheFile(options);
      if (!(await cacheFile.isExpired())) {
        const cached = await cacheFile.read();
        console.info(`Loaded "${cached.url}" from cache before request`);
        this._setCache(cached.headers.etag!, cached);
        cached.headers["x-dcm-cache"] = "timed";
        cached.status = 200;
        return cached;
      }

      if (cacheFile.exists()) {
        const expiredCache = await cacheFile.read(false);
        this._setCache(expiredCache.headers.etag!, expiredCache);
        options.headers["if-none-match"] = `W/"${this._eTag(expiredCache.headers.etag!)}"`;
      }

      const response = await request(options);
      if (response.headers["github-authentication-token-expiration"]) {
        const exp = parseJSON(response.headers["github-authentication-token-expiration"] as string);
        if (isValid(exp)) {
          // console.log(exp);
          const diff = differenceInHours(exp, new Date());
          // console.log(diff);
          // console.log(formatDistanceToNow(exp));
          if (diff < 720) {
            console.warn(`Token is about to expire in ${formatDistanceToNow(exp)}. run 'dcm login' to refresh token`);
          }
        }
      }
      if (response.status === 200 && !response.headers["x-dcm-cache"]) {
        console.info(`Writing "${response.url}" to cache after request`);
        await cacheFile.write(response);
        this._setCache(response.headers.etag!, response);
      }
      return response;
    });
  }

  private _handleCacheHit<T>(request: RequestOptions, response: OctokitResponse<T>, options: Required<EndpointDefaults>) {
    const cache = this._findInCache(response.headers.etag!);
    const expToken = cache.headers["github-authentication-token-expiration"];
    cache.headers = response.headers;
    cache.headers["github-authentication-token-expiration"] ||= expToken;

    console.info(`Loaded "${options.method}-${options.url}" from cache using etag: '${this._eTag(response.headers.etag!)}'`);
    cache.headers["x-dcm-cache"] = "etag";
    cache.status = 200;

    const cacheFile = this._opts2CacheFile(options);
    cacheFile.write(cache);
    return cache;
  }

  private _opts2CacheFile(options: Required<EndpointDefaults>) {
    const key = `${options.method}-${options.url}`;
    const encKey = encodeURIComponent(key);
    const cacheFilePath = `${DCM_CACHE_DIR}/gh-cache_${encKey}.yml`;
    const cacheFile = new CachedFile<OctokitResponse<any>>(cacheFilePath, 30);
    return cacheFile;
  }

  private _findInCache(eTag: string) {
    return this._responseCache[this._eTag(eTag)];
  }

  private _setCache(eTag: string, cache: OctokitResponse<any>) {
    this._responseCache[this._eTag(eTag)] = cache;
  }

  private _eTag(eTag: string) {
    const normalized = eTag.replace(/"/g, "").replace(/^W\//i, "").trim();
    return normalized;
  }

  public async clearCache() {
    this._responseCache = {};
    await rm(DCM_CACHE_DIR, { recursive: true, force: true });
    await mkdir(DCM_CACHE_DIR, { recursive: true });
  }

  public async login(opts?: LoginOptions): Promise<void> {
    const prompt = (await importInquirer()).prompt;
    const chalk = await importChalk();
    let status = await this.authStatus;
    if (status) {
      const { confirm } = await prompt<{ confirm: boolean }>([
        {
          type: "confirm",
          name: "confirm",
          message: "You are already logged in. Do you want to log out and log in again?",
        },
      ]);
      if (!confirm) {
        return;
      }
      await this.logout();
    }

    while (!status) {
      const success = await this._login();
      if (success) {
        status = await this.authStatus;
      }
    }
  }

  public async logout(): Promise<void> {
    await exec(`gh auth logout -h github.com`, { env: this._env() });
    this.__token = undefined;
    this._api = undefined;
    this._authStatusPromise = undefined;
  }

  private async _login(opts?: LoginOptions): Promise<boolean> {
    opts ??= {};
    const prompt = (await importInquirer()).prompt;
    const chalk = await importChalk();
    if (!opts?.method) {
      const { am } = await prompt([
        {
          type: "list",
          name: "am",
          message: "Select authentication method",
          choices: [
            {
              name: "Authenticate with Browser",
              value: "browser",
            },
            {
              name: "Authenticate with Token",
              value: "token",
            },
          ],
          default: "browser",
        },
      ]);
      opts.method = am;
    }
    const status = await this.authStatus;
    if (status) {
      await this.logout();
    }
    let success = false;
    if (opts.method === "token") {
      console.info(
        `[${chalk.yellowBright("Tip")}] You can generate a Personal Access Token here ${chalk.blueBright(
          "https://github.com/settings/tokens"
        )}\n`
      );
      console.info(`Required scopes:\n   - ${SCOPES_REQUIRED.join("\n   - ")}\n`);
      console.info(`Optional scopes:\n   - ${SCOPES_ADDITIONAL.join("\n   - ")}\n`);
      const { token } = await prompt([
        {
          type: "input",
          name: "token",
          message: "Enter github token",
        },
      ]);
      success = !(await exec(`echo "${token}" | gh auth login -h github.com -p https --with-token`, { env: this._env() }));
    } else {
      success = !(await exec(`gh auth login -h github.com -p https -s ${SCOPES.join(",")} -w`, { env: this._env() }));
    }
    return success;
  }
}
