import { build, context } from "esbuild";
import { utimes } from "fs/promises";
import process from "process";
import { builtinModules } from "node:module";
const builtins = [...builtinModules, ...builtinModules.map((m) => `node:${m}`)];

const prod = process.argv[2] === "production";

const buildOptions = {
	entryPoints: ["src/main.ts"],
	bundle: true,
	external: [
		"obsidian",
		"electron",
		"@codemirror/autocomplete",
		"@codemirror/collab",
		"@codemirror/commands",
		"@codemirror/language",
		"@codemirror/lint",
		"@codemirror/search",
		"@codemirror/state",
		"@codemirror/view",
		"@lezer/common",
		"@lezer/highlight",
		"@lezer/lr",
		...builtins,
	],
	format: "cjs",
	target: "es2018",
	logLevel: "info",
	sourcemap: prod ? false : "inline",
	treeShaking: true,
	outfile: "main.js",
};

if (prod) {
	build(buildOptions).catch(() => process.exit(1));
} else {
	// 触摸 manifest.json 触发 Obsidian 热加载
	const touchManifest = {
		name: "touch-manifest",
		setup(build) {
			build.onEnd(async () => {
				try {
					await utimes("manifest.json", new Date(), new Date());
					console.log("[PicLinker] manifest.json touched → Obsidian will reload");
				} catch (e) {
					console.warn("[PicLinker] touch manifest.json failed:", e);
				}
			});
		},
	};

	const ctx = await context({ ...buildOptions, plugins: [touchManifest] });
	console.log("[PicLinker] dev mode: watching for changes...");

	await ctx.rebuild();
	ctx.watch();
}
