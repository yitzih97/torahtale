/**
 * supabase.functions.invoke wraps every non-2xx response in a FunctionsHttpError
 * whose .message is always the useless "Edge Function returned a non-2xx status
 * code" — the real reason is in the Response it carries. Unwrap it so toasts can
 * show what actually went wrong (and its HTTP status).
 */
export async function describeFunctionsError(err: unknown): Promise<string> {
  const anyErr = err as { message?: string; context?: Response };
  const resp = anyErr?.context;
  if (resp && typeof resp.text === "function") {
    const status = resp.status ? `HTTP ${resp.status}` : "HTTP error";
    try {
      const body = await resp.text();
      try {
        const j = JSON.parse(body);
        const msg = j?.error || j?.message;
        if (msg) return `${msg} (${status})`;
      } catch { /* body wasn't JSON */ }
      if (body) return `${status}: ${body.slice(0, 200)}`;
      return status;
    } catch {
      return status;
    }
  }
  return anyErr?.message || "Unknown error";
}
