// Controllable stand-in for @earendil-works/pi-ai.
type AiState = {
	supported: string[];
	clamp: (model: unknown, level: string) => string;
};
const state: AiState = {
	supported: ["off", "low", "medium", "high", "xhigh"],
	clamp: (_m, level) => level,
};

export function __setPiAi(patch: Partial<AiState>) {
	Object.assign(state, patch);
}
export function __resetPiAi() {
	state.supported = ["off", "low", "medium", "high", "xhigh"];
	state.clamp = (_m, level) => level;
}

export function getSupportedThinkingLevels(_model: unknown): string[] {
	return [...state.supported];
}
export function clampThinkingLevel(_model: unknown, level: string): string {
	return state.clamp(_model, level);
}
