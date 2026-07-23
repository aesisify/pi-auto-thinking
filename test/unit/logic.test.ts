import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	buildSystemPrompt,
	parseDifficulty,
	sliceBetween,
} from "../../src/logic.ts";

describe("buildSystemPrompt", () => {
	it("returns empty string for empty range", () => {
		assert.equal(buildSystemPrompt([]), "");
	});
	it("offers keep plus each supplied level and lists allowed words", () => {
		const p = buildSystemPrompt(["low", "high"]);
		assert.match(p, /Allowed words: `keep`, `low`, `high`\./);
		assert.match(p, /- `keep` —/);
		assert.match(p, /- `low` —/);
		assert.match(p, /- `high` —/);
	});
	it("omits levels not in range even if known", () => {
		const p = buildSystemPrompt(["low"]);
		assert.doesNotMatch(p, /- `high` —/);
		assert.doesNotMatch(p, /`medium`/);
	});
});

describe("parseDifficulty", () => {
	const allowed = ["low", "medium", "high", "xhigh"];
	it("clean first token in allowed wins", () => {
		assert.equal(parseDifficulty("high", allowed), "high");
	});
	it("keep first token -> keep", () => {
		assert.equal(parseDifficulty("keep", allowed), "keep");
	});
	it("is case/punctuation insensitive", () => {
		assert.equal(parseDifficulty("  High.", allowed), "high");
	});
	it("verbose: earliest keyword position wins", () => {
		// "low" appears before "high"
		assert.equal(parseDifficulty("the answer is low not high", allowed), "low");
	});
	it("xhigh is matched and does not collapse into high", () => {
		assert.equal(parseDifficulty("xhigh", allowed), "xhigh");
		assert.equal(parseDifficulty("x-high", allowed), "xhigh");
	});
	it("medium matches med or medium", () => {
		assert.equal(parseDifficulty("med", allowed), "medium");
		assert.equal(parseDifficulty("medium difficulty", allowed), "medium");
	});
	it("returns undefined when nothing matches", () => {
		assert.equal(parseDifficulty("banana", allowed), undefined);
	});
	it("never returns a level outside allowed ∪ {keep}", () => {
		assert.equal(parseDifficulty("max", allowed), undefined); // max not in allowed
	});
});

describe("sliceBetween", () => {
	const scale = ["low", "medium", "high", "xhigh"];
	it("inclusive slice", () => {
		assert.deepEqual(sliceBetween(scale, "medium", "xhigh"), [
			"medium",
			"high",
			"xhigh",
		]);
	});
	it("missing bound -> full scale", () => {
		assert.deepEqual(sliceBetween(scale, "low", "missing"), [...scale]);
		assert.deepEqual(sliceBetween(scale, "missing", "high"), [...scale]);
	});
	it("inverted bounds -> full scale", () => {
		assert.deepEqual(sliceBetween(scale, "xhigh", "low"), [...scale]);
	});
	it("equal bounds -> singleton", () => {
		assert.deepEqual(sliceBetween(scale, "high", "high"), ["high"]);
	});
});
