// JSON config reader. Project config shadows user config; a malformed file is
// skipped; none found => returns the supplied defaults.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pkgProjectDir, pkgUserDir } from "./paths.ts";

export function readConfig<T extends object>(defaults: T, cwd: string): T {
	const paths = [
		join(pkgProjectDir(cwd), "config.json"), // project shadows user
		join(pkgUserDir(), "config.json"),
	];
	for (const p of paths) {
		if (!existsSync(p)) continue;
		try {
			return { ...defaults, ...JSON.parse(readFileSync(p, "utf8")) };
		} catch {
			// malformed file: keep scanning
		}
	}
	return { ...defaults };
}
