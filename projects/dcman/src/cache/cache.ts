import { readYamlFile, writeYamlFile } from "@cpdevtools/lib-node-utilities";
import { existsSync, statSync } from "fs";
import { rm } from "fs/promises";
import { OctokitResponse } from "@octokit/types";

export abstract class Cache<T extends object = object> {
  private _dataPromise: Promise<T | undefined> | undefined;

  public constructor(protected _data?: T) {}

  public get data(): Promise<T | undefined> {
    if (!this._dataPromise) {
      this._dataPromise = new Promise<T | undefined>(async (resolve, reject) => {
        try {
          const data = await this.read();
          resolve(data);
        } catch (e) {
          reject(e);
        }
      });
    }
    return this._dataPromise!;
  }

  protected async read(): Promise<T | undefined> {
    return this._data;
  }

  public async clear(): Promise<void> {
    this._dataPromise = undefined;
    this._data = undefined;
  }

  public async save(): Promise<void> {}
}

export abstract class FileCache<T extends object = object> extends Cache<T> {
  constructor(private _filePath: string, private _maxAgeInSeconds: number = 0) {
    super();
  }

  public get filePath(): string {
    return this._filePath;
  }

  public get exists(): boolean {
    return existsSync(this._filePath);
  }

  public get maxAgeInSeconds(): number {
    return this._maxAgeInSeconds;
  }

  public get lastModified(): number {
    if (!this.exists) {
      return -1;
    }
    const stat = statSync(this._filePath);
    return stat.mtimeMs;
  }

  public get ageInSeconds(): number {
    if (!this.exists) {
      return -1;
    }
    const age = Date.now() - this.lastModified;
    return age / 1000;
  }

  public get isExpired(): boolean {
    return this.ageInSeconds > this._maxAgeInSeconds;
  }

  protected override async read<T>(): Promise<T | undefined> {
    if (this.exists) {
      return await readYamlFile(this.filePath);
    }
    return undefined;
  }

  public override async clear(): Promise<void> {
    super.clear();
    await rm(this.filePath);
  }

  public override async save(): Promise<void> {
    await writeYamlFile(this.filePath, this._data);
  }
}

export abstract class GithubCache<T extends object = object, R extends OctokitResponse<T> = OctokitResponse<T>> extends FileCache<R> {
  protected override async read<R>(): Promise<R | undefined> {
    if (!this.isExpired) {
      return super.read<R>();
    } else if (this.exists) {
      const data = (await super.read<R>()) as OctokitResponse<T> | undefined;
      const eTag = data?.headers?.etag;
    }
    return undefined;
  }

  // protected override async read<R>(): Promise<T | undefined> {
  //     if(!this.isExpired){
  //         return await super.read<R>();
  //     }else if (this.exists) {
  //         const data = await super.read<R>();

  //     }

  //     // if (existsSync(this.filePath)) {
  //     //     return await readYamlFile(this.filePath);
  //     // }
  //     // return undefined;
  // }
}
