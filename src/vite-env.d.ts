/// <reference types="vite/client" />
/// <reference types="@types/chrome" />
/// <reference types="user-agent-data-types" />

declare global {
	interface Window {
		queryLocalFonts(query?: Record<string, any>): FontData[];
		chrome: any;
	}
	interface VideoEncoder {
		ondequeue(): void;
	}
	interface VideoDecoder {
		ondequeue(): void;
	}
	interface FileSystemHandle {
		remove(): Promise<void>;
	}
}

export type {};
