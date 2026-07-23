// Controllable stand-in for @earendil-works/pi-ai/compat.
let impl: (
	...args: unknown[]
) => Promise<{ content: Array<{ type: string; text?: string }> }> =
	async () => ({
		content: [{ type: "text", text: "low" }],
	});

export function __setCompleteSimple(fn: typeof impl) {
	impl = fn;
}
export function __resetCompleteSimple() {
	impl = async () => ({ content: [{ type: "text", text: "low" }] });
}

export async function completeSimple(...args: unknown[]) {
	return impl(...args);
}
