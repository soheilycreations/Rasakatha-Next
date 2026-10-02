// Exports books.id + books.cover so cover URLs can be rolled back.
//   node --env-file=.env.local scripts/export-covers.mjs supabase/data/covers-backup.json
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const rows = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb.from("books").select("id, cover").order("id").range(from, from + 999);
  if (error) throw error;
  rows.push(...data);
  if (data.length < 1000) break;
}
fs.writeFileSync(process.argv[2], JSON.stringify(rows));
console.log(rows.length, "books,", rows.filter((r) => r.cover).length, "with covers");
