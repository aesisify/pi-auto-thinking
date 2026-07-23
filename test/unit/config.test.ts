import assert from "node:assert/strict";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { readConfig } from "../../src/config.ts";

interface Cfg {
	greeting: string;
	count: number;
}
const defaults: Cfg = { greeting: "hi", count: 1 };

describe("readConfig", () => {
	it("absent file => defaults", () => {
		assert.deepEqual(
			readConfig<Cfg>(defaults, "/nonexistent-cwd-xyz"),
			defaults,
		);
	});

	it("project file merges (default preserved, field overridden)", () => {
		const tmp = mkdtempSync(join(tmpdir(), "pi-auto-thinking-cfg-"));
		try {
			const cfgDir = join(tmp, ".pi", "pi-auto-thinking");
			mkdirSync(cfgDir, { recursive: true });
			writeFileSync(join(cfgDir, "config.json"), JSON.stringify({ count: 9 }));
			const merged = readConfig<Cfg>(defaults, tmp);
			assert.equal(merged.count, 9);
			assert.equal(merged.greeting, "hi");
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});

	it("project shadows user (project wins when both exist)", () => {
		// The package reads a fixed global path (~/.pi/agent/pi-auto-thinking/config.json),
		// so back up any real user config first — never clobber it.
		const userCfgDir = join(homedir(), ".pi", "agent", "pi-auto-thinking");
		const userFile = join(userCfgDir, "config.json");
		mkdirSync(userCfgDir, { recursive: true });
		const backup = existsSync(userFile) ? readFileSync(userFile, "utf8") : null;
		writeFileSync(userFile, JSON.stringify({ count: 99 }));
		const tmp = mkdtempSync(join(tmpdir(), "pi-auto-thinking-cfg-"));
		try {
			const cfgDir = join(tmp, ".pi", "pi-auto-thinking");
			mkdirSync(cfgDir, { recursive: true });
			writeFileSync(join(cfgDir, "config.json"), JSON.stringify({ count: 7 }));
			// Both files exist; the project value (7) must win over the user value (99).
			assert.equal(readConfig<Cfg>(defaults, tmp).count, 7);
		} finally {
			rmSync(tmp, { recursive: true, force: true });
			// restore the real user config (or remove the one we created)
			if (backup !== null) writeFileSync(userFile, backup);
			else rmSync(userFile, { force: true });
		}
	});

	it("malformed JSON is skipped => defaults", () => {
		const tmp = mkdtempSync(join(tmpdir(), "pi-auto-thinking-cfg-"));
		try {
			const cfgDir = join(tmp, ".pi", "pi-auto-thinking");
			mkdirSync(cfgDir, { recursive: true });
			writeFileSync(join(cfgDir, "config.json"), "{ not valid json");
			assert.deepEqual(readConfig<Cfg>(defaults, tmp), defaults);
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});
});
