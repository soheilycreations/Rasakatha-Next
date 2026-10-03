// Last-resort 2FA reset for a staff member who has lost both their phone and their recovery codes,
// when no other owner can do it from /admin/staff (and the emergency login isn't available).
//
//   node --env-file=.env.local scripts/reset-2fa.mjs someone@example.com
//
// Clears their authenticator and recovery codes; at the next sign-in they set two-factor up again.
// Writes an audit row (actor: "reset-2fa script"). Needs the service-role key, so only someone with
// access to the server environment can run it.
import { createClient } from "@supabase/supabase-js";

const email = (process.argv[2] || "").toLowerCase();
if (!email) {
  console.error("usage: node --env-file=.env.local scripts/reset-2fa.mjs <staff email>");
  process.exit(1);
}
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: staff, error } = await sb.from("staff").select("id,full_name,role,totp_enabled").eq("email", email).maybeSingle();
if (error || !staff) {
  console.error(error ? `Lookup failed: ${error.message}` : `No staff member with the email ${email}`);
  process.exit(1);
}
const { error: updateError } = await sb.from("staff").update({ totp_secret: null, totp_enabled: false, recovery_codes: [] }).eq("id", staff.id);
if (updateError) {
  console.error("Couldn't reset:", updateError.message);
  process.exit(1);
}
await sb.from("audit_log").insert({
  actor_name: "reset-2fa script",
  action: "staff.totp_reset",
  entity: "staff",
  entity_id: staff.id,
  before: { totp: staff.totp_enabled },
  note: `two-factor reset for ${staff.full_name} (${email}) from the command line`,
});
console.log(`Two-factor reset for ${staff.full_name}. They set it up again at the next sign-in.`);
