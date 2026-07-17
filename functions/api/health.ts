// GET /api/health — quick liveness check.
export const onRequestGet = async (): Promise<Response> =>
  new Response(JSON.stringify({ ok: true, service: 'gandalf-ingest' }), {
    headers: { 'content-type': 'application/json' },
  });
