import { parse } from "rs-module-lexer";
import { StructuredSource } from "structured-source";
// @ts-expect-error: no types
import { isBuiltin } from "node:module";

export type FindNodeModulesImportResult = {
    name: string;
    range: readonly [start: number, end: number];
    loc: Readonly<{
        start: { line: number; column: number };
        end: { line: number; column: number };
    }>;
    statementrange?: readonly [start: number, end: number];
};

export async function findNodeModulesImport(code: string, filename: string): Promise<FindNodeModulesImportResult[]> {
    const { output } = parse({ input: [{ filename: filename, code }] });
    const { imports } = output[0];
    const source = new StructuredSource(code);
    // console.log(imports);
    return imports.map((imp) => {
        return {
            name: imp.n ?? code.slice(imp.s, imp.e),
            range: [imp.s, imp.e] as const,
            loc: source.rangeToLocation([imp.s, imp.e]),
            statementrange: [imp.ss, imp.se] as const
        };
    });
}

export function filterModulesByModuleNames(modules: FindNodeModulesImportResult[], moduleNames: readonly string[]) {
    return modules.filter((imp) => moduleNames.includes(imp.name));
}

export function filterModulesByBuiltinModules(modules: FindNodeModulesImportResult[]) {
    return modules.filter((imp) => {
        return imp.name.startsWith("node:") || isBuiltin(imp.name);
    });
}
