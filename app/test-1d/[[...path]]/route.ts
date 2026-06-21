import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const REWRITTEN_ROOT = path.join(process.cwd(), "rewritten-output");

const HEAD_INJECTION_SCRIPT = `<script>
  document.addEventListener('click', function(e) {
    const target = e.target.closest('button, a, input, select, [role="button"]') || e.target;
    window.parent.postMessage({
      type: 'greenlit-test-click',
      tag: target.tagName,
      text: target.innerText ? target.innerText.substring(0, 50) : null,
      ariaLabel: target.getAttribute('aria-label'),
      x: e.clientX,
      y: e.clientY
    }, '*');
  }, true);

  (function() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      window.parent.postMessage({ type: 'greenlit-route-change', method: 'pushState', path: window.location.pathname }, '*');
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      window.parent.postMessage({ type: 'greenlit-route-change', method: 'replaceState', path: window.location.pathname }, '*');
    };

    window.addEventListener('popstate', function() {
      window.parent.postMessage({ type: 'greenlit-route-change', method: 'popstate', path: window.location.pathname }, '*');
    });

    window.addEventListener('hashchange', function() {
      window.parent.postMessage({ type: 'greenlit-route-change', method: 'hashchange', path: window.location.hash }, '*');
    });
  })();
</script>`;

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".woff2": "font/woff2",
};

function resolveFilePath(segments: string[] | undefined): string {
  if (!segments || segments.length === 0) {
    return "index.html";
  }

  return segments.join("/");
}

function injectHead(html: string): string {
  const injection = `<base href="/test-1d/">${HEAD_INJECTION_SCRIPT}`;
  return html.replace(/<head[^>]*>/i, (match) => `${match}${injection}`);
}

function prepareHtml(html: string): string {
  return injectHead(html);
}

function isStaticAssetPath(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ext !== "" && ext !== ".html";
}

async function serveIndexHtml(): Promise<NextResponse> {
  const indexPath = path.join(REWRITTEN_ROOT, "index.html");
  const content = await fs.readFile(indexPath);
  const html = prepareHtml(content.toString("utf-8"));

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

async function serveFile(filePath: string): Promise<NextResponse> {
  const absolutePath = path.join(REWRITTEN_ROOT, filePath);
  const content = await fs.readFile(absolutePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

  if (ext === ".html") {
    const html = prepareHtml(content.toString("utf-8"));
    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return new NextResponse(content, {
    status: 200,
    headers: { "Content-Type": contentType },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  const filePath = resolveFilePath(params.path);
  const absolutePath = path.join(REWRITTEN_ROOT, filePath);
  const normalizedRoot = `${REWRITTEN_ROOT}${path.sep}`;
  const normalizedTarget = `${path.normalize(absolutePath)}${path.sep}`;

  if (!normalizedTarget.startsWith(normalizedRoot)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    return await serveFile(filePath);
  } catch (error) {
    const isMissingFile =
      error instanceof Error && "code" in error && error.code === "ENOENT";

    if (isMissingFile && !isStaticAssetPath(filePath)) {
      try {
        return await serveIndexHtml();
      } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
