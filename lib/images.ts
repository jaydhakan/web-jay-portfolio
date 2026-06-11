import fs from "node:fs";
import path from "node:path";

/**
 * Build-time check for assets that may not exist yet (project covers,
 * profile photo are TODO(JAY)). Server components use this to render a
 * designed placeholder instead of a broken <img>; once the file lands in
 * /public the real image renders with zero code changes.
 */
export function publicImageExists(relativePath: string): boolean {
  try {
    return fs.existsSync(path.join(process.cwd(), "public", relativePath));
  } catch {
    return false;
  }
}
