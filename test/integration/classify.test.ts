import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import ext from "../../src/extension/index.ts";
import { buildFakeCtx, buildFakePi } from "../support/fakes/pi.ts";
import { __resetPiAi, __setPiAi } from "../support/fakes/pi-ai.ts";
import {
	__resetCompleteSimple,
	__setCompleteSimple,
} from "../support/fakes/pi-ai-compat.ts";

// Project config with an active classifier so the extension classifies.
function withConfig(cwd: string, cfg: Record<string, unknown>) {
	const cfgDir = join(cwd, ".pi", "pi-auto-thinking");
	mkdirSync(cfgDir, { recursive: true });
	writeFileSync(join(cfgDir, "config.json"), JSON.stringify(cfg));
}

describe("classify (happy path)", () => {
	let tmp: string;
	before(() => {
		__resetPiAi();
		tmp = mkdtempSync(join(tmpdir(), "pi-auto-thinking-int-"));
		withConfig(tmp, {
			enabled: true,
			classifier: "fake/classifier",
			minLevel: "low",
			maxLevel: "xhigh",
		});
	});
	after(() => {
		__resetCompleteSimple();
		rmSync(tmp, { recursive: true, force: true });
	});

	it("sets the classified level on a verdict", async () => {
		__setCompleteSimple(async () => ({
			content: [{ type: "text", text: "high" }],
		}));
		const pi = buildFakePi();
		ext(pi as unknown as ExtensionAPI);
		const ctx = buildFakeCtx({ model: { id: "fake/main" } });
		ctx.cwd = tmp;
		await pi.emit(
			"input",
			{
				source: "interactive",
				text: "debug a subtle concurrency bug",
				streamingBehavior: undefined,
			},
			ctx,
		);
		assert.deepEqual(pi.setLevelCalls, ["high"]);
	});

	it("keeps the level on a keep verdict (no setThinkingLevel)", async () => {
		__setCompleteSimple(async () => ({
			content: [{ type: "text", text: "keep" }],
		}));
		const pi = buildFakePi();
		ext(pi as unknown as ExtensionAPI);
		pi.setThinkingLevel("medium"); // pre-existing level
		pi.setLevelCalls.length = 0;
		const ctx = buildFakeCtx({ model: { id: "fake/main" } });
		ctx.cwd = tmp;
		await pi.emit(
			"input",
			{ source: "interactive", text: "continue", streamingBehavior: undefined },
			ctx,
		);
		assert.deepEqual(pi.setLevelCalls, []);
	});

	it("falls back (keeps level) when completeSimple rejects", async () => {
		__setCompleteSimple(async () => {
			throw new Error("boom");
		});
		const pi = buildFakePi();
		ext(pi as unknown as ExtensionAPI);
		pi.setThinkingLevel("low");
		pi.setLevelCalls.length = 0;
		const ctx = buildFakeCtx({ model: { id: "fake/main" } });
		ctx.cwd = tmp;
		await pi.emit(
			"input",
			{ source: "interactive", text: "anything", streamingBehavior: undefined },
			ctx,
		);
		assert.deepEqual(pi.setLevelCalls, []);
	});

	it("skips classify when the model supports only off", async () => {
		let called = false;
		__setCompleteSimple(async () => {
			called = true;
			return { content: [{ type: "text", text: "low" }] };
		});
		__setPiAi({ supported: ["off"] });
		const pi = buildFakePi();
		ext(pi as unknown as ExtensionAPI);
		const ctx = buildFakeCtx({ model: { id: "off-only" } });
		ctx.cwd = tmp;
		await pi.emit(
			"input",
			{ source: "interactive", text: "x", streamingBehavior: undefined },
			ctx,
		);
		assert.equal(called, false);
		__resetPiAi();
	});

	it("ignores non-interactive turns", async () => {
		let called = false;
		__setCompleteSimple(async () => {
			called = true;
			return { content: [{ type: "text", text: "low" }] };
		});
		const pi = buildFakePi();
		ext(pi as unknown as ExtensionAPI);
		const ctx = buildFakeCtx({ model: { id: "fake/main" } });
		ctx.cwd = tmp;
		await pi.emit(
			"input",
			{ source: "steer", text: "x", streamingBehavior: undefined },
			ctx,
		);
		assert.equal(called, false);
	});

	it("ignores streaming follow-ups (streamingBehavior set)", async () => {
		let called = false;
		__setCompleteSimple(async () => {
			called = true;
			return { content: [{ type: "text", text: "low" }] };
		});
		const pi = buildFakePi();
		ext(pi as unknown as ExtensionAPI);
		const ctx = buildFakeCtx({ model: { id: "fake/main" } });
		ctx.cwd = tmp;
		await pi.emit(
			"input",
			{ source: "interactive", text: "x", streamingBehavior: "append" },
			ctx,
		);
		assert.equal(called, false);
	});
});
