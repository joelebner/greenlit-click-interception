"use client";

import { useRef, useState } from "react";

const IFRAME_URL = "https://flowstate-onboard-buddy.lovable.app/";

export default function Test1cPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [result, setResult] = useState<string | null>(null);

  function handleAttemptListenerAttach() {
    try {
      const iframe = iframeRef.current;
      if (!iframe) {
        throw new Error("Iframe ref is not available");
      }

      const doc =
        iframe.contentDocument ?? iframe.contentWindow?.document ?? null;

      if (!doc) {
        throw new Error("Unable to access iframe document");
      }

      doc.addEventListener("click", () => {});
      setResult("SUCCESS: Listener attached, no cross-origin error");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      setResult(`FAILED: ${message}`);
    }
  }

  return (
    <div>
      <iframe
        ref={iframeRef}
        src={IFRAME_URL}
        width="100%"
        height="600"
        style={{ border: "2px solid black", display: "block" }}
      />
      <button type="button" onClick={handleAttemptListenerAttach}>
        Attempt Listener Attach
      </button>
      {result ? <p>{result}</p> : null}
    </div>
  );
}
