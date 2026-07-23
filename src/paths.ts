// Config/log base dirs under pi's config roots. Single source of truth for the
// package folder name used by config + logs.
import { homedir } from "node:os";
import { join } from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";

const PKG_DIR = "pi-auto-thinking";

/** User-global base: ~/.pi/agent/pi-auto-thinking */
export const pkgUserDir = (): string =>
	join(homedir(), ".pi", "agent", PKG_DIR);

/** Project-local base: <cwd>/.pi/pi-auto-thinking (uses pi's CONFIG_DIR_NAME, not a hard-coded ".pi") */
export const pkgProjectDir = (cwd: string): string =>
	join(cwd, CONFIG_DIR_NAME, PKG_DIR);
