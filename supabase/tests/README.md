# Database smoke tests

`smoke.sql` exercises the RPCs, triggers and RLS policies as different users.
It runs against a local Supabase (`supabase start && supabase db reset`):

```bash
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2- | tr -d '"')" -f supabase/tests/smoke.sql
```

Expected: every block prints the value described in its `\echo` line; the
statements marked "must fail" print an ERROR (that is the assertion).
