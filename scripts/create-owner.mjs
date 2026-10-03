// Creates (or promotes) the first owner account. Run once after supabase/admin-phase-0.sql.
//
//   node --env-file=.env.local scripts/create-owner.mjs you@example.com "Your Name" "a-long-password"
//
// The owner signs in at /admin/login with this email + password and is asked to set up two-factor
// authentication (an authenticator app) on first sign-in.
import { createClient } from "@supabase/supabase-js";

const [, , email, fullName, password] = process.argv;
if (!email || !fullName || !password || password.length < 10) {
  console.error('usage: node --env-file=.env.local scripts/create-owner.mjs <email> "<full name>" "<password, 10+ chars>"');
  process.exit(1);
}
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const probe = await sb.from("staff").select("id").limit(1); // a real GET: HEAD does not report a missing table
if (probe.error) {
  console.error("The staff table doesn't exist: run supabase/admin-phase-0.sql in the Supabase SQL Editor first.");
  process.exit(1);
}

const { data, error } = await sb.auth.admin.createUser({
  email: email.toLowerCase(),
  password,
  email_confirm: true,
  app_metadata: { role: "owner", staff: true },
  user_metadata: { name: fullName },
});
if (error || !data.user) {
  console.error("Couldn't create the user:", error?.message);
  process.exit(1);
}
const { error: insertError } = await sb.from("staff").insert({ id: data.user.id, email: email.toLowerCase(), full_name: fullName, role: "owner", active: true });
if (insertError) {
  await sb.auth.admin.deleteUser(data.user.id);
  console.error("Couldn't save the staff record:", insertError.message);
  process.exit(1);
}
await sb.from("audit_log").insert({ actor_name: "create-owner script", action: "staff.create", entity: "staff", entity_id: data.user.id, after: { email, role: "owner" }, note: "first owner" });
console.log(`Owner created: ${email}. Sign in at /admin/login, then set up two-factor authentication.`);
