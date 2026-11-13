# Project memory

## Product intent & audience

- Admin-protected application with gated login at `/admin/login`
- Uses Supabase as backend for authentication and database (profiles, auth.users)
- Role-based access: profiles table has a `role` field; `admin` role grants admin access

## Brand personality & voice

- Not yet inferred from available context

## Visual design & UX direction

- Admin panel includes a password-change flow accessible via Admin → Password
- No specific visual/aesthetic details inferred yet

## Decisions, constraints & rationale

- Supabase Auth handles sign-in; auth.users rows must have non-NULL token fields (confirmation, recovery, email_change) — empty strings are the standard default
- Admin accounts created via raw SQL require manual population of security/token fields or sign-in fails with server error
- Admin access is determined by a post-sign-in check that reads the user's own profile row; RLS policies on profiles govern that read
- Path alias `@/` maps to `src/`

## Open questions & assumptions

- Admin password was shared in a prior message; user should change it after first login
- Login could not be browser-tested in dev environment; fix is unverified end-to-end
- Supabase project URL/keys and exact profile policy SQL not confirmed in this turn
- Email/password is the only confirmed auth method; other providers unknown