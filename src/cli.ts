import meow from "meow";
import {
    filterModulesByBuiltinModules,
    filterModulesByModuleNames,
    findNodeModulesImport,
    FindNodeModulesImportResult
} from "./find-node-modules-import.js";
import { globby } from "globby";
import * as fs from "node:fs/promises";
import path from "node:path";

export const cli = meow(
    `
    Usage WAHAWHwh
      $ find-node-modules-import [file|glob*]
 
    Options
      --module              [String] filter the result by module name
      --builtinModules      [Boolean] filter the result by Node.js builtin modules. Default: false
      --verbose             [Boolean] show warning/error output. Default: false

    Examples
      # show all imports
      $ find-node-modules-import "src/**/*.{js, ts}"
      # show Node.js builtin modules
      $ find-node-modules-import "src/**/*.{js, ts}" --builtinModules
      # show specific module
      $ find-node-modules-import "src/**/*.{js, ts}" --module "lodash"

`,
    {
        importMeta: import.meta,
        flags: {
            module: {
                type: "string",
                isMultiple: true
            },
            builtinModules: {
                type: "boolean",
                default: false
            },
            format: {
                type: "string",
                default: "compat"
            },
            verbose: {
                type: "boolean",
                default: false
            }
        },
        autoHelp: true,
        autoVersion: true
    }
);

export const run = async (
    input = cli.input,
    flags = cli.flags
): Promise<{ exitStatus: number; stdout: string | null; stderr: Error | null }> => {
    const files = await globby(input);
    const filter = (results: FindNodeModulesImportResult[]) => {
        if (flags.builtinModules) {
            return filterModulesByBuiltinModules(results);
        } else if (flags.module && flags.module.length > 0) {
            return filterModulesByModuleNames(results, flags.module);
        }
        return results;
    };
    for (const file of files) {
        try {
            const code = await fs.readFile(file, "utf-8");
            const modules = await findNodeModulesImport(code, path.basename(file));
            filter(modules).forEach((result) => {
                console.log(`${file}:${result.loc.start.line}:${result.loc.start.column}\t${result.name}`);
            });
        } catch (e) {
            if (flags.verbose) {
                console.error("Skip file", file, e);
            }
        }
    }
    return { exitStatus: 0, stdout: null, stderr: null };
};
