import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import ext from "../../src/extension/index.ts";
import { buildFakeCtx, buildFakePi, type FakePi } from "../support/fakes/pi.ts";
import { __resetPiAi } from "../support/fakes/pi-ai.ts";
import { __resetCompleteSimple } from "../support/fakes/pi-ai-compat.ts";

function writeConfig(cwd: string, cfg: Record<string, unknown>) {
	const cfgDir = join(cwd, ".pi", "pi-auto-thinking");
	mkdirSync(cfgDir, { recursive: true });
	writeFileSync(join(cfgDir, "config.json"), JSON.stringify(cfg));
}

describe("/auto-thinking command", () => {
	let tmp: string;
	let pi: FakePi;
	let notify: string[];
	let ctx: ReturnType<typeof buildFakeCtx>;
	before(() => {
		__resetPiAi();
		tmp = mkdtempSync(join(tmpdir(), "pi-auto-thinking-cmd-"));
		writeConfig(tmp, {
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

	async function fresh() {
		pi = buildFakePi();
		ext(pi as unknown as ExtensionAPI);
		notify = [];
		ctx = buildFakeCtx({ model: { id: "fake/main" } });
		ctx.ui.notify = (msg: string) => {
			notify.push(msg);
		};
		ctx.cwd = tmp;
		// Mirror real pi init: session_start re-reads cfg from ctx.cwd (tmp),
		// isolating these command-handler tests from the host's real config.
		await pi.emit("session_start", {}, ctx);
	}

	it("registers the auto-thinking command", async () => {
		await fresh();
		assert.ok(pi.commands.has("auto-thinking"));
	});

	it("off then on toggles active state (visible in status notify)", async () => {
		await fresh();
		const cmd = pi.commands.get("auto-thinking").handler;
		await cmd("off", ctx);
		await cmd("status", ctx);
		await cmd("on", ctx);
		await cmd("status", ctx);
		assert.ok(
			notify.some((m) => m.includes("auto-thinking: off")),
			"status after 'off' should report auto-thinking: off",
		);
		assert.ok(
			notify.some((m) => m.includes("auto-thinking: on")),
			"status after 'on' should report auto-thinking: on",
		);
	});
});
