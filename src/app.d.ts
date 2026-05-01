// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: import('$lib/auth').User | null;
		}
		interface PageData {
			user: import('$lib/auth').User | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
