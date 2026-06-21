"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

type ClickLogEntry = {
  id: number;
  phase: number;
  target: string;
  label: string;
};

let logId = 0;

function stopPropagationHandler(event: React.MouseEvent): void {
  event.stopPropagation();
}

export default function ComponentTestPage() {
  const [logs, setLogs] = useState<ClickLogEntry[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [listenerAttached, setListenerAttached] = useState(false);
  const [handlerCallCount, setHandlerCallCount] = useState(0);
  const [effectRunCount, setEffectRunCount] = useState(0);
  const [setupError, setSetupError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const setLogsRef = useRef(setLogs);
  setLogsRef.current = setLogs;

  // useLayoutEffect + window (not document) so we register in capture phase
  // before document-level handlers (e.g. Next.js dev overlay) can stopImmediatePropagation.
  useLayoutEffect(() => {
    console.log("[test-5] useLayoutEffect running — attaching window capture listener");
    setEffectRunCount((count) => count + 1);

    try {
      const handleDocumentClick = (event: MouseEvent) => {
        console.log("[test-5] capture click", {
          eventPhase: event.eventPhase,
          target: event.target,
        });

        setHandlerCallCount((count) => count + 1);

        const target = event.target;
        const element =
          target instanceof Element
            ? target
            : target instanceof Node
              ? target.parentElement
              : null;

        const label =
          element?.id ||
          element?.getAttribute("data-test-label") ||
          element?.textContent?.trim().slice(0, 40) ||
          "unknown";

        setLogsRef.current((prev) => [
          ...prev,
          {
            id: ++logId,
            phase: event.eventPhase,
            target: element?.tagName ?? "UNKNOWN",
            label,
          },
        ]);
      };

      const options: AddEventListenerOptions = { capture: true };
      window.addEventListener("click", handleDocumentClick, options);
      setListenerAttached(true);
      setSetupError(null);
      console.log("[test-5] window capture listener attached");

      return () => {
        console.log("[test-5] removing window capture listener");
        window.removeEventListener("click", handleDocumentClick, options);
        // Do not setListenerAttached(false) here — React Strict Mode runs cleanup
        // then re-runs the effect; resetting to false leaves the debug line stuck at
        // "no" if the re-run is missed (e.g. stale HMR) even though the listener works.
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown listener setup error";
      console.error("[test-5] listener setup failed:", error);
      setSetupError(message);
      setListenerAttached(false);
    }
  }, []);

  useEffect(() => {
    if (!dropdownOpen) {
      return;
    }

    function handleOutsideClick(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [dropdownOpen]);

  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <h1>Test 5 — Capture-Phase Click Interception</h1>
      <p>
        Listener uses{" "}
        <code>window.addEventListener(&apos;click&apos;, handler, {"{ capture: true }"})</code>{" "}
        in <code>useLayoutEffect</code> (capture phase, as early as possible).
        Each component below calls <code>stopPropagation()</code> in its own handler.
      </p>
      <p style={{ fontSize: 14, color: "#555" }}>
        Debug: listener attached = {listenerAttached ? "yes" : "no"} · handler
        calls = {handlerCallCount} · effect runs = {effectRunCount}
        {setupError ? ` · setup error: ${setupError}` : ""}
      </p>

      <section style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 32 }}>
        <div ref={dropdownRef} style={{ position: "relative", width: 240 }}>
          <button
            type="button"
            data-test-label="dropdown-trigger"
            onClick={(event) => {
              stopPropagationHandler(event);
              setDropdownOpen((open) => !open);
            }}
            style={{ padding: "8px 16px", cursor: "pointer" }}
          >
            Dropdown trigger (stopPropagation)
          </button>
          {dropdownOpen && (
            <div
              role="menu"
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 4,
                border: "1px solid #ccc",
                borderRadius: 4,
                background: "#fff",
                minWidth: 180,
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              }}
            >
              {["Option A", "Option B", "Option C"].map((option) => (
                <button
                  key={option}
                  type="button"
                  role="menuitem"
                  data-test-label={`dropdown-item-${option}`}
                  onClick={(event) => {
                    stopPropagationHandler(event);
                    setDropdownOpen(false);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "8px 12px",
                    textAlign: "left",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <button
            type="button"
            data-test-label="modal-trigger"
            onClick={(event) => {
              stopPropagationHandler(event);
              setModalOpen(true);
            }}
            style={{ padding: "8px 16px", cursor: "pointer" }}
          >
            Modal trigger (stopPropagation)
          </button>
          {modalOpen && (
            <div
              role="presentation"
              onClick={(event) => {
                stopPropagationHandler(event);
                setModalOpen(false);
              }}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 50,
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                onClick={(event) => stopPropagationHandler(event)}
                style={{
                  background: "#fff",
                  padding: 24,
                  borderRadius: 8,
                  minWidth: 320,
                }}
              >
                <h2 id="modal-title" style={{ marginTop: 0 }}>
                  Modal (Radix-style)
                </h2>
                <p>Backdrop and content handlers call stopPropagation().</p>
                <button
                  type="button"
                  data-test-label="modal-close"
                  onClick={(event) => {
                    stopPropagationHandler(event);
                    setModalOpen(false);
                  }}
                  style={{ padding: "8px 16px", cursor: "pointer" }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="custom-select" style={{ display: "block", marginBottom: 8 }}>
            Native select (styled, stopPropagation on click)
          </label>
          <select
            id="custom-select"
            data-test-label="native-select"
            onClick={(event) => stopPropagationHandler(event)}
            style={{
              appearance: "none",
              WebkitAppearance: "none",
              padding: "8px 32px 8px 12px",
              border: "1px solid #ccc",
              borderRadius: 4,
              background: "#fff url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M2 4l4 4 4-4'/%3E%3C/svg%3E\") no-repeat right 10px center",
              cursor: "pointer",
              minWidth: 200,
            }}
          >
            <option value="a">Option A</option>
            <option value="b">Option B</option>
            <option value="c">Option C</option>
          </select>
        </div>
      </section>

      <section style={{ marginTop: 40 }}>
        <h2>Capture-phase click log ({logs.length})</h2>
        <p style={{ fontSize: 14, color: "#555" }}>
          eventPhase 1 = CAPTURING_PHASE · 2 = AT_TARGET · 3 = BUBBLING_PHASE
        </p>
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: 4,
            padding: 12,
            maxHeight: 400,
            overflowY: "auto",
            background: "#fafafa",
            fontFamily: "monospace",
            fontSize: 13,
          }}
        >
          {logs.length === 0 ? (
            <p style={{ margin: 0, color: "#888" }}>Click a component above…</p>
          ) : (
            logs.map((entry) => (
              <p key={entry.id} style={{ margin: "4px 0" }}>
                #{entry.id} phase={entry.phase} target=&lt;{entry.target}&gt; label=
                {entry.label}
              </p>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
