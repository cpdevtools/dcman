import { readJsonFile, readYamlFile, writeJsonFile, writeYamlFile } from "@cpdevtools/lib-node-utilities";
import { existsSync, statSync } from "fs";
import { mkdir, rm } from "fs/promises";
import { dirname, extname } from "path";

export class CachedFile<TData = unknown> {
  constructor(filePath: string, maxAgeInSeconds?: number);
  constructor(private readonly _filePath: string, private readonly _maxAgeInSeconds: number = 3600) {}

  public get filePath(): string {
    return this._filePath;
  }

  public get maxAgeInSeconds(): number {
    return this._maxAgeInSeconds;
  }

  public get lastModified(): number {
    if (!this.exists()) {
      return -1;
    }
    const stat = statSync(this._filePath);
    return stat.mtimeMs;
  }

  public get ageInSeconds(): number {
    if (!this.exists()) {
      return -1;
    }
    const age = Date.now() - this.lastModified;
    return age / 1000;
  }

  public async read(throwIfExpired: boolean = true): Promise<TData> {
    if (throwIfExpired) {
      if (await this.isExpired()) {
        throw new Error(`Cached file is expired: ${this._filePath}`);
      }
    }

    const ext = extname(this._filePath);
    if (ext === ".json") {
      return readJsonFile(this._filePath);
    } else if (ext === ".yml" || ext === ".yaml") {
      return readYamlFile(this._filePath);
    }
    throw new Error(`Unsupported file type: ${ext}`);
  }

  public async write(data: TData) {
    const ext = extname(this._filePath);
    if (ext === ".json") {
      await writeJsonFile(this._filePath, data, 4);
    } else if (ext === ".yml" || ext === ".yaml") {
      await writeYamlFile(this._filePath, data, 2);
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  public exists(): boolean {
    return existsSync(this._filePath);
  }

  public async isExpired(): Promise<boolean> {
    if (!this.exists()) {
      return true;
    }
    return this.ageInSeconds > this.maxAgeInSeconds;
  }

  public async delete() {
    if (this.exists()) {
      await rm(this._filePath);
    }
  }

  public async ensureDirectoryExists() {
    await mkdir(dirname(this._filePath), { recursive: true });
  }
}
