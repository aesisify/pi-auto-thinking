// ESM resolve hook: redirect the three pi specifiers to local controllable fakes,
// and rewrite relative .js imports to .ts when only the .ts file exists.
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const fakes = (name) => new URL(`./fakes/${name}`, import.meta.url).href;

const REDIRECT = {
	"@earendil-works/pi-ai": fakes("pi-ai.ts"),
	"@earendil-works/pi-ai/compat": fakes("pi-ai-compat.ts"),
	"@earendil-works/pi-coding-agent": fakes("pi-coding-agent.ts"),
};

export function resolve(specifier, context, nextResolve) {
	if (REDIRECT[specifier]) {
		return { url: REDIRECT[specifier], shortCircuit: true };
	}
	if (specifier.startsWith(".") && specifier.endsWith(".js")) {
		const parentDir = context.parentURL
			? path.dirname(fileURLToPath(context.parentURL))
			: process.cwd();
		const jsPath = path.resolve(parentDir, specifier);
		const tsPath = jsPath.replace(/\.js$/, ".ts");
		if (!fs.existsSync(jsPath) && fs.existsSync(tsPath)) {
			return nextResolve(specifier.replace(/\.js$/, ".ts"), context);
		}
	}
	return nextResolve(specifier, context);
}
