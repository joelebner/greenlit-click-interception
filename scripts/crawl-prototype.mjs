import { chromium } from "playwright";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "crawled-output");
const MANIFEST_PATH = path.join(OUTPUT_DIR, "requests-manifest.json");

const TARGET_ORIGIN = "https://flight-tracker-fawn.vercel.app";
const START_URL = `${TARGET_ORIGIN}/search`;

const captured = [];
const savedPaths = new Set();

function urlToRelativePath(urlString) {
  const url = new URL(urlString);

  if (url.origin === TARGET_ORIGIN) {
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) {
      pathname = `${pathname}index.html`;
    }
    if (pathname === "") {
      pathname = "/index.html";
    }
    const relative = pathname.replace(/^\//, "");
    if (url.search) {
      const safeQuery = url.search.replace(/^\?/, "").replace(/[^\w.-]+/g, "_");
      const ext = path.extname(relative);
      const base = ext ? relative.slice(0, -ext.length) : relative;
      const suffix = ext || ".html";
      return `${base}__q_${safeQuery}${suffix}`;
    }
    return relative;
  }

  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith("/")) {
    pathname = `${pathname}index.html`;
  }
  if (pathname === "" || pathname === "/") {
    pathname = "/index.html";
  }

  const hostDir = url.hostname.replace(/[^\w.-]+/g, "_");
  return path.join("_external", hostDir, pathname.replace(/^\//, ""));
}

async function ensureParentDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function saveResponse(url, status, contentType, body) {
  const relativePath = urlToRelativePath(url);
  const absolutePath = path.join(OUTPUT_DIR, relativePath);

  let finalPath = absolutePath;
  let counter = 1;
  while (savedPaths.has(finalPath)) {
    const ext = path.extname(absolutePath);
    const base = ext ? absolutePath.slice(0, -ext.length) : absolutePath;
    finalPath = `${base}__dup${counter}${ext || ""}`;
    counter += 1;
  }
  savedPaths.add(finalPath);

  await ensureParentDir(finalPath);
  await fs.writeFile(finalPath, body);

  captured.push({
    url,
    status,
    contentType,
    savedTo: path.relative(PROJECT_ROOT, finalPath),
    bytes: body.length,
  });
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on("response", async (response) => {
    const url = response.url();
    const request = response.request();

    if (request.resourceType() === "eventsource") {
      return;
    }

    try {
      const body = await response.body();
      const contentType = response.headers()["content-type"] ?? "";
      await saveResponse(url, response.status(), contentType, body);
    } catch (error) {
      captured.push({
        url,
        status: response.status(),
        contentType: response.headers()["content-type"] ?? "",
        savedTo: null,
        bytes: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  console.log(`Navigating to ${START_URL}`);
  await page.goto(START_URL, { waitUntil: "networkidle", timeout: 120000 });

  console.log("Filling search form");
  await page.getByLabel("From").fill("San Francisco (SFO)");
  await page.getByLabel("To").fill("New York (JFK)");
  await page.getByLabel("Depart").fill("2026-07-15");

  console.log('Clicking "Continue to Track"');
  await page.getByRole("link", { name: "Continue to Track →" }).click();
  await page.waitForURL("**/track", { timeout: 30000 });
  await page.waitForLoadState("networkidle");

  await wait(1000);

  console.log('Clicking "Continue to Compare"');
  await page.getByRole("link", { name: "Continue to Compare →" }).click();
  await page.waitForURL("**/compare", { timeout: 30000 });
  await page.waitForLoadState("networkidle");

  await wait(1000);

  console.log("Changing sort dropdown");
  await page.locator("#sort").selectOption("duration");

  console.log('Clicking "Continue to Book"');
  await page.getByRole("link", { name: "Continue to Book →" }).click();
  await page.waitForURL("**/book", { timeout: 30000 });
  await page.waitForLoadState("networkidle");

  await wait(1000);

  console.log('Clicking "Confirm booking"');
  await page.getByRole("button", { name: "Confirm booking" }).click();
  await wait(500);

  console.log('Clicking "Confirm" in modal');
  await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click();
  await page.waitForLoadState("networkidle");

  await wait(3000);

  await fs.writeFile(MANIFEST_PATH, JSON.stringify(captured, null, 2));

  console.log(`Captured ${captured.length} responses`);
  console.log(`Saved ${savedPaths.size} files under ${OUTPUT_DIR}`);

  await browser.close();
}

main().catch((error) => {
  console.error("Crawl failed:", error);
  process.exit(1);
});
