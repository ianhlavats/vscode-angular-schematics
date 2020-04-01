import * as vscode from 'vscode';
import * as path from 'path';

import { FileSystem, Watchers } from '../utils';

interface PackageJsonSchema {
    dependencies?: {
        [key: string]: string;
    };
}

export class PackageJsonConfig {

    // TODO: could be in a subdirectory
    /** Basename of the package manager config file */
    private static readonly fileName = 'package.json';
    /** Values from the package manager config file */
    private config: PackageJsonSchema | undefined;
    /** Angular major version */
    private angularMajorVersion: number | undefined;
    private watcher: vscode.FileSystemWatcher | undefined;
    
    constructor(private workspace: vscode.WorkspaceFolder) {}

    /**
     * Initializes `package.json` configuration.
     * **Must** be called after each `new PackageJsonConfig()`
     * (delegated because `async` is not possible on a constructor).
     */
    async init(): Promise<void> {

        const fsPath = path.join(this.workspace.uri.fsPath, PackageJsonConfig.fileName);

        this.config = await FileSystem.parseJsonFile<PackageJsonSchema>(fsPath, this.workspace);

        this.setAngularMajorVersion();

        /* Watcher must be set just once */
        if (this.config && !this.watcher) {

            this.watcher = Watchers.watchFile(fsPath, () => {
                this.init();
            });

        }

    }

    /**
     * Get `@angular/core` major version or `undefined`
     */
    getAngularMajorVersion(): number | undefined {
        return this.angularMajorVersion;
    }

    /**
     * Tells if a package is installed in `package.json`
     */
    hasDependency(name: string): boolean {

        return (name in (this.config?.dependencies ?? {}));

    }

    /**
     * Try to resolve Angular major version and save it
     */
    private setAngularMajorVersion(): void {

        /* We remove special semver characters (`^` and `~`) and keep the first number */
        const angularVersion = this.config?.dependencies?.['@angular/core']?.replace('^', '').replace('~', '').substr(0, 1);

        this.angularMajorVersion = angularVersion ? Number.parseInt(angularVersion, 10) : undefined;

    }

}
