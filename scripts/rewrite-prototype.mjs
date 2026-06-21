import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "crawled-output", "requests-manifest.json");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "rewritten-output");

const ORIGIN = "https://flowstate-onboard-buddy.lovable.app";
const ORIGIN_ENCODED = encodeURIComponent(ORIGIN);
const SERVE_PREFIX = "/test-1d";

// Only static asset paths get the mount prefix — not TanStack Router route paths
// (e.g. to:`/profile`, route ids like "/").
const ASSET_PATH_PREFIXES = ["assets/", "__l5e/", "~flock", "~api/"];

// Path segment chars plus optional query string (e.g. /__l5e/rrweb-record.js?__l5e_v=...)
const ROOT_RELATIVE_PATH =
  "[A-Za-z0-9~._-]+(?:/[A-Za-z0-9~._-]*)*(?:\\?[A-Za-z0-9~.&%-]+)?";

const QUOTED_ROOT_RELATIVE = new RegExp(
  `(["'\`])\\/(?!\\/|test-1d\\/)(${ROOT_RELATIVE_PATH})\\1`,
  "g"
);

const CSS_URL_ROOT_RELATIVE = new RegExp(
  `url\\(\\s*(["']?)\\/(?!\\/|test-1d\\/)(${ROOT_RELATIVE_PATH})\\1\\s*\\)`,
  "g"
);

// TanStack inline hydration manifest uses escaped quotes: import(\"/assets/...\") 
const ESCAPED_IMPORT_PATH = new RegExp(
  `import\\(\\\\"\\/(?!\\/|test-1d\\/)(${ROOT_RELATIVE_PATH})\\\\"\\)`,
  "g"
);

const ROUTER_BASEPATH_PATCH =
  /e\.update\(\{basepath:``,serializationAdapters:t\}\)/g;

function isAssetPath(pathSegment) {
  return ASSET_PATH_PREFIXES.some((prefix) => pathSegment.startsWith(prefix));
}

function isRewritableContentType(contentType) {
  const type = contentType.toLowerCase();
  return (
    type.includes("javascript") ||
    type.includes("html") ||
    type.includes("css")
  );
}

function rewriteText(content, { patchRouterBasepath = false } = {}) {
  let rewritten = content;

  rewritten = rewritten.split(ORIGIN).join("");
  rewritten = rewritten.split(ORIGIN_ENCODED).join("");

  rewritten = rewritten.replace(
    QUOTED_ROOT_RELATIVE,
    (match, quote, pathSegment) => {
      if (!isAssetPath(pathSegment)) {
        return match;
      }
      return `${quote}${SERVE_PREFIX}/${pathSegment}${quote}`;
    }
  );

  rewritten = rewritten.replace(
    CSS_URL_ROOT_RELATIVE,
    (match, quote, pathSegment) => {
      if (!isAssetPath(pathSegment)) {
        return match;
      }
      return `url(${quote}${SERVE_PREFIX}/${pathSegment}${quote})`;
    }
  );

  rewritten = rewritten.replace(
    ESCAPED_IMPORT_PATH,
    (match, pathSegment) => {
      if (!isAssetPath(pathSegment)) {
        return match;
      }
      return `import(\\"${SERVE_PREFIX}/${pathSegment}\\")`;
    }
  );

  if (patchRouterBasepath) {
    rewritten = rewritten.replace(
      ROUTER_BASEPATH_PATCH,
      `e.update({basepath:\`${SERVE_PREFIX}\`,serializationAdapters:t})`
    );
  }

  return rewritten;
}

/** Router basepath patch is required when serving under /test-1d (base href alone is insufficient). */
function shouldPatchRouterBasepath() {
  return process.env.GREENLIT_PATCH_ROUTER_BASEPATH !== "0";
}

async function main() {
  const manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, "utf-8"));

  await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  let modified = 0;
  let unchanged = 0;
  const seenPaths = new Set();

  for (const entry of manifest) {
    if (!entry.savedTo || seenPaths.has(entry.savedTo)) {
      continue;
    }
    seenPaths.add(entry.savedTo);

    const sourcePath = path.join(PROJECT_ROOT, entry.savedTo);
    const relativePath = path.relative(
      path.join(PROJECT_ROOT, "crawled-output"),
      sourcePath
    );
    const destPath = path.join(OUTPUT_DIR, relativePath);
    const isMainBundle = relativePath === "assets/index-CUauenfG.js";

    await fs.mkdir(path.dirname(destPath), { recursive: true });

    const buffer = await fs.readFile(sourcePath);

    if (isRewritableContentType(entry.contentType ?? "")) {
      const original = buffer.toString("utf-8");
      const next = rewriteText(original, {
        patchRouterBasepath: isMainBundle && shouldPatchRouterBasepath(),
      });

      if (next !== original) {
        modified += 1;
      } else {
        unchanged += 1;
      }

      await fs.writeFile(destPath, next, "utf-8");
    } else {
      unchanged += 1;
      await fs.writeFile(destPath, buffer);
    }
  }

  console.log(`Rewritten output written to ${OUTPUT_DIR}`);
  console.log(`Modified (>=1 replacement): ${modified}`);
  console.log(`Unchanged: ${unchanged}`);
  console.log(`Total unique files processed: ${seenPaths.size}`);
}

main().catch((error) => {
  console.error("Rewrite failed:", error);
  process.exit(1);
});
