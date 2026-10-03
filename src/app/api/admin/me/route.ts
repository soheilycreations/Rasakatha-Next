import { NextResponse } from "next/server";
import { currentSession } from "@/lib/server/guard";
import { getStaff, staffSystem } from "@/lib/server/staff";
import { permissionsFor } from "@/lib/permissions";

// Who is signed in and what they may do (the UI uses this to hide what it can't use; the server still checks every request).
export async function GET() {
  const s = await currentSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const staff = s.sid !== "emergency" && (await staffSystem()).ready ? await getStaff(s.sid) : null;
  return NextResponse.json({
    id: s.sid,
    name: s.name,
    role: s.role,
    emergency: s.sid === "emergency",
    twoFactorDone: s.tf,
    totpEnabled: staff?.totp_enabled ?? false,
    hasPin: !!staff?.pin_hash,
    recoveryCodesLeft: staff?.recovery_codes?.length ?? 0,
    permissions: permissionsFor(s.role),
  });
}
