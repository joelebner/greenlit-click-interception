"use client";

import { useEffect, useState } from "react";

const PROXY_IFRAME_SRC =
  "/api/proxy?target=https://flowstate-onboard-buddy.lovable.app/";

export default function Test1bFetchPage() {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const data = event.data;

      if (
        data &&
        typeof data === "object" &&
        "type" in data &&
        data.type === "greenlit-test-click"
      ) {
        setMessages((prev) => [...prev, JSON.stringify(data)]);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div>
      <iframe
        src={PROXY_IFRAME_SRC}
        width="100%"
        height="600"
        style={{ border: "2px solid black", display: "block" }}
      />
      <div>
        {messages.map((message, index) => (
          <p key={index}>{message}</p>
        ))}
      </div>
    </div>
  );
}
