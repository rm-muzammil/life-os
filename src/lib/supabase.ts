// ── lib/supabase.ts ───────────────────────────────────────────
// Two clients: one for Server Components, one for Client Components.
// Both use the same env vars; the SSR client handles cookie-based sessions.

import { createBrowserClient } from '@supabase/ssr'
// import { createServerClient, type CookieOptions } from '@supabase/ssr'
// import { cookies } from 'next/headers'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ── Browser client (use in Client Components & hooks) ──────────
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON)
}

// ── Server client (use in Server Components, API routes, middleware) ──
// export function createServerSupabaseClient() {
//   const cookieStore = cookies()
//   return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
//     cookies: {
//       get(name: string) {
//         return cookieStore.get(name)?.value
//       },
//       set(name: string, value: string, options: CookieOptions) {
//         try { cookieStore.set({ name, value, ...options }) } catch {}
//       },
//       remove(name: string, options: CookieOptions) {
//         try { cookieStore.set({ name, value: '', ...options }) } catch {}
//       },
//     },
//   })
// }
