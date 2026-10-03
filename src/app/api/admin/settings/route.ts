import { NextResponse } from "next/server";
import { audit } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/guard";
import { getSettings, invalidateSettings } from "@/lib/server/settings";
import { supabase } from "@/lib/server/supabase";
import { settingsSchema } from "@/lib/schemas/admin";

export async function GET() {
  const auth = await requirePermission("settings.view");
  if (!auth.ok) return auth.response;
  invalidateSettings();
  return NextResponse.json(await getSettings());
}

export async function PUT(request: Request) {
  const auth = await requirePermission("settings.edit");
  if (!auth.ok) return auth.response;
  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: `${issue?.path.join(".") || "Settings"}: ${issue?.message ?? "invalid"}` }, { status: 400 });
  }
  invalidateSettings();
  const before = await getSettings();
  const { error } = await supabase()
    .from("settings")
    .upsert({ key: "app", value: parsed.data, updated_at: new Date().toISOString(), updated_by: auth.session.sid === "emergency" ? null : auth.session.sid });
  if (error) {
    const missing = error.code === "PGRST205" || error.code === "42P01";
    return NextResponse.json({ error: missing ? "The settings table doesn't exist yet: run supabase/admin-phase-0.sql." : "Couldn't save the settings" }, { status: missing ? 503 : 500 });
  }
  invalidateSettings();
  await audit({ action: "settings.update", entity: "settings", entityId: "app", before, after: parsed.data });
  return NextResponse.json(parsed.data);
}
