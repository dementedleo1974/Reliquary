import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const rel = specifier.slice(2);
    const file = new URL(`../src/${rel}.ts`, import.meta.url);
    const index = new URL(`../src/${rel}/index.ts`, import.meta.url);
    const href = existsSync(fileURLToPath(file)) ? file.href : index.href;
    return nextResolve(href);
  }
  if (specifier.startsWith(".")) {
    const candidate = new URL(specifier.endsWith(".ts") ? specifier : `${specifier}.ts`, context.parentURL);
    if (existsSync(fileURLToPath(candidate))) return nextResolve(candidate.href);
  }
  return nextResolve(specifier, context);
}
