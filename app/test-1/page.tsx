"use client";

const IFRAME_URLS = [
  "https://flowstate-onboard-buddy.lovable.app/",
  "https://flowcoder-onboard-buddy.lovable.app/",
  "https://onboarding-flow-design-theta.vercel.app/",
  "https://flowcoder-onboarding-flow.vercel.app/",
  "https://flowstate-app-onboar-f5qj.bolt.host/",
  "https://flowcoder-app-onboar-qozq.bolt.host/",
  "https://flowstate-test.vercel.app/",
  "https://flowcoder-test.vercel.app/",
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
