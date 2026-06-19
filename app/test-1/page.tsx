"use client";

const IFRAME_URLS = [
  "https://placeholder-lovable-1.vercel.app",
  "https://placeholder-lovable-2.vercel.app",
  "https://placeholder-v0-1.vercel.app",
  "https://placeholder-v0-2.vercel.app",
  "https://placeholder-bolt-1.vercel.app",
  "https://placeholder-bolt-2.vercel.app",
  "https://placeholder-cursor-1.vercel.app",
  "https://placeholder-cursor-2.vercel.app",
  "https://placeholder-cursor-3.vercel.app",
  "https://placeholder-cursor-4.vercel.app",
];

export default function Test1Page() {
  return (
    <div>
      {IFRAME_URLS.map((url) => (
        <section key={url}>
          <p>{url}</p>
          <iframe
            src={url}
            width="100%"
            height="600"
            style={{ border: "2px solid black", display: "block" }}
            onError={() => {
              console.log(`IFRAME ERROR: ${url}`);
            }}
          />
        </section>
      ))}
    </div>
  );
}
