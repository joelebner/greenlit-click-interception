"use client";

import { useEffect, useState } from "react";

const IFRAME_SRC = "/test-1d/";

export default function Test1dViewerClient() {
  const [messages, setMessages] = useState<string[]>([]);
  const [routeChangeMessages, setRouteChangeMessages] = useState<string[]>([]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const data = event.data;

      if (data && typeof data === "object" && "type" in data) {
        if (data.type === "greenlit-test-click") {
          setMessages((prev) => [...prev, JSON.stringify(data)]);
        } else if (data.type === "greenlit-route-change") {
          setRouteChangeMessages((prev) => [...prev, JSON.stringify(data)]);
        }
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <>
      <iframe
        src={IFRAME_SRC}
        width="100%"
        height="600"
        style={{ border: "2px solid black", display: "block" }}
      />
      <div>
        <h2>Click payloads</h2>
        {messages.map((message, index) => (
          <p key={index}>{message}</p>
        ))}
      </div>
      <div>
        <h2>Route changes</h2>
        {routeChangeMessages.map((message, index) => (
          <p key={index}>{message}</p>
        ))}
      </div>
    </>
  );
}
