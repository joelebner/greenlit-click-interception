import { NextRequest, NextResponse } from "next/server";

const STRIP_HEADERS = new Set([
  "x-frame-options",
  "content-security-policy",
  "content-security-policy-report-only",
  "content-encoding",
  "content-length",
]);

function buildInjectedScript(origin: string): string {
  return `<script>
  console.log('Greenlit fetch/XHR override active for origin:', '${origin}');

  var greenlitTargetOrigin = '${origin}';
  var originalFetch = window.fetch;
  window.fetch = function(input, init) {
    var url = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input));
    if (url.startsWith(greenlitTargetOrigin)) {
      var rewritten = '/api/proxy?target=' + encodeURIComponent(url);
      if (typeof input === 'string') {
        return originalFetch(rewritten, init);
      }
      if (input instanceof Request) {
        return originalFetch(new Request(rewritten, input), init);
      }
      return originalFetch(rewritten, init);
    }
    return originalFetch(input, init);
  };

  var originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    var args = Array.prototype.slice.call(arguments);
    if (typeof url === 'string' && url.startsWith(greenlitTargetOrigin)) {
      args[1] = '/api/proxy?target=' + encodeURIComponent(url);
    }
    return originalOpen.apply(this, args);
  };

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
</script>`;
}

function injectIntoHead(html: string, targetUrl: string): string {
  const origin = new URL(targetUrl).origin;
  const injection = `<base href="${origin}/">${buildInjectedScript(origin)}`;

  return html.replace(/<head[^>]*>/i, (match) => `${match}${injection}`);
}

function buildResponseHeaders(source: Headers): Headers {
  const headers = new Headers();

  source.forEach((value, key) => {
    if (!STRIP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  return headers;
}

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("target");

  if (!target) {
    return NextResponse.json({ error: "Missing target parameter" }, { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch {
    return NextResponse.json({ error: "Invalid target URL" }, { status: 400 });
  }

  if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
    return NextResponse.json({ error: "Invalid target protocol" }, { status: 400 });
  }

  try {
    const response = await fetch(targetUrl.toString(), {
      headers: {
        "User-Agent":
          request.headers.get("user-agent") ?? "Greenlit-Validation-Proxy/1.0",
      },
      redirect: "follow",
    });

    const contentType = response.headers.get("content-type") ?? "";
    const headers = buildResponseHeaders(response.headers);

    if (contentType.includes("text/html")) {
      const html = await response.text();
      const modified = injectIntoHead(html, targetUrl.toString());

      return new NextResponse(modified, {
        status: response.status,
        headers,
      });
    }

    return new NextResponse(await response.arrayBuffer(), {
      status: response.status,
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Proxy fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
