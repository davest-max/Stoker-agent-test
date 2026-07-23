import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// `command` is "serve" for `npm run dev`, "build" for `npm run build`
// (production build — including this repo's GitHub Actions deploy
// workflow). Dev keeps aliasing to the live `../lyra-ui` sibling checkout
// for active co-development, per this repo's CLAUDE.md. Builds alias to
// `vendor/lyra-ui` instead — a committed snapshot (see its own README) —
// because `../lyra-ui` is a local-only folder, not a git repo, so it
// doesn't exist in a hosted build's checkout at all. See
// `vendor/lyra-ui/README.md` for why this exists and how to re-sync it.
export default defineConfig(({ command }) => {
  const lyraUiSrc =
    command === "build"
      ? path.resolve(__dirname, "./vendor/lyra-ui/src")
      : path.resolve(__dirname, "../lyra-ui/src");

  return {
    // GitHub Pages serves this repo at a subpath (/Stoker-agent-test/), not
    // the domain root — only matters for the production build; the dev
    // server keeps serving from "/" as before.
    base: command === "build" ? "/Stoker-agent-test/" : "/",
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@nicecxone/lyra-ui/styles": path.resolve(lyraUiSrc, "styles/lyra-tokens.css"),
        "@nicecxone/lyra-ui": path.resolve(lyraUiSrc, "index.ts"),
      },
    },
  };
});
