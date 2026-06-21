"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createSupabaseBrowserClient,
  fetchRecordingSession,
  getSessionStorageKey,
  type RecordingSession,
} from "@/lib/supabase/client";

export default function Test3Page() {
  const [flowName, setFlowName] = useState("");
  const [session, setSession] = useState<RecordingSession | null>(null);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configMissing, setConfigMissing] = useState(false);

  const reloadSession = useCallback(async (sessionId: string) => {
    const client = createSupabaseBrowserClient();
    if (!client) {
      setConfigMissing(true);
      return null;
    }

    const row = await fetchRecordingSession(client, sessionId);
    setSession(row);
    setRecording(row !== null && !row.locked);
    return row;
  }, []);

  useEffect(() => {
    async function loadFromSupabase() {
      setLoading(true);
      setError(null);

      const client = createSupabaseBrowserClient();
      if (!client) {
        setConfigMissing(true);
        setLoading(false);
        return;
      }

      const storedId = localStorage.getItem(getSessionStorageKey());
      if (!storedId) {
        setLoading(false);
        return;
      }

      try {
        const row = await fetchRecordingSession(client, storedId);
        if (!row) {
          localStorage.removeItem(getSessionStorageKey());
          setSession(null);
          setRecording(false);
        } else {
          setSession(row);
          setFlowName(row.flow_name);
          setRecording(!row.locked);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load session");
      } finally {
        setLoading(false);
      }
    }

    loadFromSupabase();
  }, []);

  async function handleStartRecording() {
    const trimmed = flowName.trim();
    if (!trimmed) {
      setError("Flow name is required");
      return;
    }

    const client = createSupabaseBrowserClient();
    if (!client) {
      setConfigMissing(true);
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const { data, error: insertError } = await client
        .from("test_recording_sessions")
        .insert({ flow_name: trimmed, steps: [], locked: false })
        .select("id, flow_name, steps, locked, created_at")
        .single();

      if (insertError) {
        throw insertError;
      }

      localStorage.setItem(getSessionStorageKey(), data.id);
      await reloadSession(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start recording");
    } finally {
      setBusy(false);
    }
  }

  async function handleRecordStep() {
    if (!session) {
      return;
    }

    const client = createSupabaseBrowserClient();
    if (!client) {
      setConfigMissing(true);
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const nextStepNumber = session.steps.length + 1;
      const updatedSteps = [
        ...session.steps,
        { step: nextStepNumber, label: `Step ${nextStepNumber}` },
      ];

      const { error: updateError } = await client
        .from("test_recording_sessions")
        .update({ steps: updatedSteps })
        .eq("id", session.id);

      if (updateError) {
        throw updateError;
      }

      await reloadSession(session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record step");
    } finally {
      setBusy(false);
    }
  }

  async function handleLockFlow() {
    if (!session) {
      return;
    }

    const client = createSupabaseBrowserClient();
    if (!client) {
      setConfigMissing(true);
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const { error: updateError } = await client
        .from("test_recording_sessions")
        .update({ locked: true })
        .eq("id", session.id);

      if (updateError) {
        throw updateError;
      }

      await reloadSession(session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to lock flow");
    } finally {
      setBusy(false);
    }
  }

  if (configMissing) {
    return (
      <main style={{ padding: 24, maxWidth: 640 }}>
        <h1>Test 3 — Flow Recording Session</h1>
        <p style={{ color: "#b00020" }}>
          Supabase is not configured. Add{" "}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env.local</code>,
          then restart the dev server.
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 640 }}>
      <h1>Test 3 — Flow Recording Session</h1>

      {loading ? (
        <p>Loading session from Supabase…</p>
      ) : (
        <>
          {!recording && !session && (
            <section style={{ marginBottom: 24 }}>
              <label htmlFor="flow-name" style={{ display: "block", marginBottom: 8 }}>
                Flow name
              </label>
              <input
                id="flow-name"
                type="text"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                placeholder="e.g. Onboarding flow"
                style={{ width: "100%", padding: 8, marginBottom: 12 }}
              />
              <button
                type="button"
                onClick={handleStartRecording}
                disabled={busy || !flowName.trim()}
              >
                Start Recording
              </button>
            </section>
          )}

          {session && (
            <section style={{ marginBottom: 24 }}>
              <button
                type="button"
                onClick={handleRecordStep}
                disabled={busy || session.locked}
                style={{ marginRight: 8 }}
              >
                Record Step
              </button>
              <button
                type="button"
                onClick={handleLockFlow}
                disabled={busy || session.locked}
              >
                Lock Flow
              </button>
            </section>
          )}

          <section
            style={{
              border: "1px solid #ccc",
              padding: 16,
              borderRadius: 4,
              background: "#fafafa",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Live session (from Supabase)</h2>
            {session ? (
              <dl style={{ margin: 0 }}>
                <dt>Flow name</dt>
                <dd>{session.flow_name}</dd>
                <dt>Step count</dt>
                <dd>{session.steps.length}</dd>
                <dt>Locked</dt>
                <dd>{session.locked ? "Yes" : "No"}</dd>
                <dt>Session ID</dt>
                <dd style={{ fontFamily: "monospace", fontSize: 12 }}>
                  {session.id}
                </dd>
                <dt>Steps</dt>
                <dd>
                  <pre style={{ margin: 0, fontSize: 12 }}>
                    {JSON.stringify(session.steps, null, 2)}
                  </pre>
                </dd>
              </dl>
            ) : (
              <p>No active session. Start recording to create one.</p>
            )}
          </section>
        </>
      )}

      {error && (
        <p style={{ color: "#b00020", marginTop: 16 }} role="alert">
          {error}
        </p>
      )}
    </main>
  );
}
