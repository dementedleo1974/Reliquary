const PATCH = /^\d{1,2}\.\d{1,2}$/;

function patchValue(name: string): number {
  const [major, minor] = name.split(".");
  return Number(major) * 100 + Number(minor);
}

/** Highest public patch name. Hotfix suffixes and anything else are ignored. */
export function parseLivePatch(input: unknown): string | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return null;
  const versions = (input as { versions?: unknown }).versions;
  if (!Array.isArray(versions) || versions.length > 200) return null;
  let best = "";
  let bestValue = -1;
  for (const entry of versions) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) continue;
    const names = (entry as { names?: unknown }).names;
    if (!Array.isArray(names)) continue;
    for (const name of names) {
      if (typeof name !== "string" || !PATCH.test(name)) continue;
      const value = patchValue(name);
      if (value > bestValue) {
        best = name;
        bestValue = value;
      }
    }
  }
  return best || null;
}

export function isPatchName(value: string): boolean {
  return PATCH.test(value);
}
