import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve((_req: Request) => {
  return new Response(
    JSON.stringify({
      status: 'ok',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
});
