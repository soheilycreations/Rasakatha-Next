import { redirect } from "next/navigation";
import AdminShell from "./AdminShell";
import { currentSession } from "@/lib/server/guard";
import { permissionsFor } from "@/lib/permissions";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await currentSession();
  if (!session) redirect("/admin/login");
  return (
    <AdminShell
      user={{ id: session.sid, name: session.name, role: session.role, emergency: session.sid === "emergency" }}
      permissions={[...permissionsFor(session.role)]}
    >
      {children}
    </AdminShell>
  );
}
