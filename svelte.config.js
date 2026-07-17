import adapter from '@sveltejs/adapter-static';

const base = process.env.BASE_PATH ?? '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter({
			fallback: '404.html',
			strict: false
		}),
		paths: {
			base
		},
		prerender: {
			handleHttpError: ({ path, message }) => {
				if (base && path === `${base}/`) return;
				throw new Error(message);
			}
		},
		alias: { $routes: 'src/routes' }
	}
};

export default config;
