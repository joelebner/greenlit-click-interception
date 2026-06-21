const params = new URL(self.location.href).searchParams;
const targetOrigin = params.get("origin");

self.addEventListener("fetch", (event) => {
  if (!targetOrigin) {
    return;
  }

  const requestUrl = event.request.url;

  if (requestUrl.startsWith(targetOrigin)) {
    event.respondWith(
      fetch("/api/proxy?target=" + encodeURIComponent(requestUrl))
    );
  }
});
