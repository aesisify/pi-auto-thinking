// Pure classification logic + dynamic prompt builder. Zero dependencies.
//
// We hold NO level enum of our own. Every level string flows in from the caller
// (src/index.ts), which derives them from pi's getSupportedThinkingLevels(model).
// The keys below are pi's canonical thinking-level names — content keyed by pi's
// vocabulary, not a parallel enum.

// Semantic anchor + example prompt per pi level name. Filtered at build time to
// whatever the current model actually supports, so the classifier is only ever
// asked to choose among levels the main model can really be set to.
const LEVEL_INFO: Record<string, { desc: string; examples: string[] }> = {
	minimal: {
		desc: "near-zero effort: a self-contained task so trivial it needs almost no reasoning (the work is fully described by the prompt itself)",
		examples: [
			"print hello world",
			"add a trailing newline at end of file",
			"leave a // TODO comment on line 3",
		],
	},
	low: {
		desc: "trivial/mechanical: a rename, a typo, a one-line edit, formatting, an obvious factual answer",
		examples: [
			"rename the variable foo to bar",
			"fix this typo in the error message",
		],
	},
	medium: {
		desc: "a localized change needing some thought: a small self-contained feature, a single-spot bugfix, explaining one piece of code",
		examples: [
			"add a cancel button to the settings page",
			"fix the off-by-one in the pagination helper",
		],
	},
	high: {
		desc: "spans multiple files/callers, needs real debugging, a moderate design decision, a multi-part refactor",
		examples: [
			"refactor auth to support multiple providers across the codebase",
		],
	},
	xhigh: {
		desc: "deep/open-ended: subtle concurrency or algorithm problems, cross-system reasoning, ambiguous requirements, large risky refactors, hard root-cause debugging",
		examples: [
			"debug an intermittent deadlock in the worker pool under heavy load",
		],
	},
	max: {
		desc: "the hardest, most open-ended problems requiring exhaustive reasoning",
		examples: ["design a distributed consensus protocol from scratch"],
	},
};

const KEEP = {
	desc: "the prompt alone carries no difficulty signal — short continuations/confirmations that only make sense with unseen context",
	examples: [
		"continue",
		"yes",
		"ok",
		"next",
		"again",
		"do it",
		"same as before",
		"and?",
	],
};

/** Build the classifier system prompt for exactly the levels in `range`
 *  (the main model's supported non-off levels, already clamped to [min,max],
 *  in canonical order). `keep` is always offered. */
export function buildSystemPrompt(range: readonly string[]): string {
	if (range.length === 0) return "";
	const L = (s: string) => `\`${s}\``;
	const lines: string[] = [];
	lines.push(
		"You classify the difficulty of a coding agent's prompt to pick its reasoning budget. You NEVER answer or attempt the task, NEVER explain, NEVER request code or details, NEVER ask questions. You output exactly ONE word and nothing else — no punctuation, no reasoning, no sentence.",
	);
	lines.push("");
	lines.push(`Allowed words: ${L("keep")}, ${range.map(L).join(", ")}.`);
	lines.push("");
	lines.push(`- ${L("keep")} — ${KEEP.desc}.`);
	for (const lvl of range) {
		const info = LEVEL_INFO[lvl];
		if (info) lines.push(`- ${L(lvl)} — ${info.desc}.`);
	}
	lines.push("");
	lines.push("Examples — output ONLY the word after the arrow:");
	for (const lvl of range) {
		const info = LEVEL_INFO[lvl];
		if (info) lines.push(`"${info.examples[0]}" → ${lvl}`);
	}
	for (const ex of KEEP.examples.slice(0, 4)) lines.push(`"${ex}" → keep`);
	lines.push("");
	lines.push(
		"Judge the inherent difficulty of the task the words describe, not phrasing. When torn between two levels, choose the lower. When torn between " +
			L("keep") +
			" and a level, choose " +
			L("keep") +
			".",
	);
	return lines.join("\n");
}

/** Parse the model's answer. Fast path: clean first token. Fallback: a keyword
 *  scan over verbose output. Only matches levels in `allowed` (plus `keep`);
 *  `xhigh` is probed with its own pattern so `\bhigh\b` can't catch it. */
export function parseDifficulty(
	text: string,
	allowed: readonly string[],
): string | undefined {
	const t = text.toLowerCase();
	const first = (t.trim().split(/\s+/)[0] ?? "").replace(/[^a-z]/g, "");
	if (first === "keep") return "keep";
	if (allowed.includes(first)) return first;

	const hits: Array<[number, string]> = [];
	const probe = (lvl: string, re: RegExp) => {
		if (allowed.includes(lvl)) {
			const p = t.search(re);
			if (p >= 0) hits.push([p, lvl]);
		}
	};
	probe("xhigh", /x[\s_-]?high/); // before \bhigh\b
	for (const lvl of allowed) {
		if (lvl === "xhigh") continue;
		const re =
			lvl === "medium" ? /\bmed(?:ium)?\b/ : new RegExp(`\\b${lvl}\\b`);
		probe(lvl, re);
	}
	const kp = t.search(/\bkeep\b/);
	if (kp >= 0) hits.push([kp, "keep"]);
	if (hits.length === 0) return undefined;
	return hits.reduce((a, b) => (a[0] <= b[0] ? a : b))[1];
}

/** Slice `scale` (ordered) to [lo, hi] inclusive. If either bound is absent or
 *  inverted, return the full scale rather than guess. */
export function sliceBetween(
	scale: readonly string[],
	lo: string,
	hi: string,
): string[] {
	const i = scale.indexOf(lo);
	const j = scale.indexOf(hi);
	if (i < 0 || j < 0 || i > j) return [...scale];
	return scale.slice(i, j + 1);
}
