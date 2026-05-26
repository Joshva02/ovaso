import { useState, useCallback } from "react";

type Endpoint = "/check" | "/search" | "/reservations";

interface PlaygroundState {
  endpoint: Endpoint;
  query: string;
  result: string | null;
  loading: boolean;
  error: string | null;
}

export function useApiPlayground() {
  const [state, setState] = useState<PlaygroundState>({
    endpoint: "/check",
    query: "guardian holdings limited",
    result: null,
    loading: false,
    error: null,
  });

  const setEndpoint = useCallback((endpoint: Endpoint) => {
    setState((prev) => ({ ...prev, endpoint }));
  }, []);

  const setQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, query }));
  }, []);

  const execute = useCallback(async () => {
    if (state.query.trim().length < 2) return;

    setState((prev) => ({ ...prev, loading: true, error: null, result: null }));

    try {
      const res = await fetch(
        `${state.endpoint}?name=${encodeURIComponent(state.query.trim())}`
      );
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      setState((prev) => ({
        ...prev,
        loading: false,
        result: JSON.stringify(data, null, 2),
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }));
    }
  }, [state.endpoint, state.query]);

  return { ...state, setEndpoint, setQuery, execute };
}
