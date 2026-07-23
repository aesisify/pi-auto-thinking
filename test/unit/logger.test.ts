import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { getLogger } from "../../src/logger.ts";

describe("getLogger", () => {
	it("returns a logger with working level methods", () => {
		const log = getLogger();
		assert.equal(typeof log.info, "function");
		assert.equal(typeof log.warn, "function");
		assert.equal(typeof log.error, "function");
		assert.doesNotThrow(() => log.info("smoke", { ok: true }));
	});
	it("caches (same instance on repeat call)", () => {
		assert.equal(getLogger(), getLogger());
	});
	it("creates the logs dir on first use", () => {
		getLogger();
		assert.ok(
			existsSync(join(homedir(), ".pi", "agent", "pi-auto-thinking", "logs")),
		);
	});
});
