import assert from "node:assert/strict";
import { homedir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { pkgProjectDir, pkgUserDir } from "../../src/paths.ts";

describe("paths", () => {
	it("user dir is ~/.pi/agent/pi-auto-thinking", () => {
		// Build expected with join() — platform-correct separators (\ on win, / elsewhere).
		assert.equal(
			pkgUserDir(),
			join(homedir(), ".pi", "agent", "pi-auto-thinking"),
		);
	});
	it("project dir is <cwd>/.pi/pi-auto-thinking (uses pi's CONFIG_DIR_NAME)", () => {
		assert.equal(
			pkgProjectDir(join("proj")),
			join("proj", ".pi", "pi-auto-thinking"),
		);
	});
});
