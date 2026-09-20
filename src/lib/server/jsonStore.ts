import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "src", "lib", "data");

function filePath(name: string) {
  return path.join(DATA_DIR, name);
}

export function readJson<T>(name: string, fallback: T): T {
  try {
    const raw = fs.readFileSync(filePath(name), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(name: string, data: T): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2), "utf-8");
}

// Serializes read-modify-write cycles per file so two requests landing in the
// same tick (e.g. two orders placed at once) can't clobber each other by both
// reading the old array and writing back without the other's change.
const fileLocks = new Map<string, Promise<unknown>>();

export function withFileLock<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
  const previous = fileLocks.get(name) ?? Promise.resolve();
  const next = previous.then(fn, fn);
  fileLocks.set(
    name,
    next.catch(() => {})
  );
  return next;
}
