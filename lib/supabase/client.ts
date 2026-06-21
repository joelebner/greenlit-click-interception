import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type RecordingStep = {
  step: number;
  label: string;
};

export type RecordingSession = {
  id: string;
  flow_name: string;
  steps: RecordingStep[];
  locked: boolean;
  created_at: string;
};

const SESSION_STORAGE_KEY = "greenlit-test-3-session-id";

export function getSessionStorageKey(): string {
  return SESSION_STORAGE_KEY;
}

export function createSupabaseBrowserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey);
}

export async function fetchRecordingSession(
  client: SupabaseClient,
  sessionId: string
): Promise<RecordingSession | null> {
  const { data, error } = await client
    .from("test_recording_sessions")
    .select("id, flow_name, steps, locked, created_at")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    steps: Array.isArray(data.steps) ? data.steps : [],
  };
}
