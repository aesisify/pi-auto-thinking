import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import ext from "../../src/extension/index.ts";
import { buildFakeCtx, buildFakePi } from "../support/fakes/pi.ts";
import { __resetPiAi } from "../support/fakes/pi-ai.ts";
import {
	__resetCompleteSimple,
	__setCompleteSimple,
} from "../support/fakes/pi-ai-compat.ts";

describe("bootstrap", () => {
	let tmp: string;
	before(() => {
		__resetPiAi();
		tmp = mkdtempSync(join(tmpdir(), "pi-auto-thinking-boot-"));
		const cfgDir = join(tmp, ".pi", "pi-auto-thinking");
		mkdirSync(cfgDir, { recursive: true });
		writeFileSync(
			join(cfgDir, "config.json"),
			JSON.stringify({
				enabled: true,
				classifier: "fake/classifier",
				minLevel: "low",
				maxLevel: "xhigh",
			}),
		);
	});
	after(() => {
		__resetCompleteSimple();
		rmSync(tmp, { recursive: true, force: true });
	});

	it("session_start handler is registered and runs without throwing", async () => {
		const pi = buildFakePi();
		ext(pi as unknown as ExtensionAPI);
		const ctx = buildFakeCtx({ model: { id: "fake/main" } });
		ctx.cwd = tmp;
		await assert.doesNotReject(() => pi.emit("session_start", {}, ctx));
	});

	it("a full input flow does not throw when hasUI is false (paint/spinner no-op)", async () => {
		__setCompleteSimple(async () => ({
			content: [{ type: "text", text: "low" }],
		}));
		const pi = buildFakePi();
		ext(pi as unknown as ExtensionAPI);
		const ctx = buildFakeCtx({ model: { id: "fake/main" } });
		ctx.cwd = tmp;
		await assert.doesNotReject(() =>
			pi.emit(
				"input",
				{
					source: "interactive",
					text: "rename foo to bar",
					streamingBehavior: undefined,
				},
				ctx,
			),
		);
	});
});
