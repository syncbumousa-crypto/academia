/* Entry for the Supabase Edge Function.
   The router matches absolute paths like /api/catalog, but Supabase hands the
   function whatever follows its slug. So the path is normalised here once,
   and route.js is left exactly as it was written for Vercel. */
import { GET as handle } from "./route.js";

Deno.serve((req: Request) => {
  const u = new URL(req.url);
  let p = u.pathname;
  p = p.replace(/^\/functions\/v1\/api(?=\/|$)/, "/api");
  if (!/^\/api(\/|$)/.test(p)) p = "/api" + (p === "/" ? "" : p);
  if (p === u.pathname) return handle(req);
  u.pathname = p;
  return handle(new Request(u.toString(), req));
});
