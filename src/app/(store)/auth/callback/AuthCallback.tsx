"use client";

import { useEffect, useState } from "react";

// Landing page for Google sign-in: Supabase redirects here with the session in the URL hash.
export default function AuthCallback() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (!accessToken || !refreshToken) {
      queueMicrotask(() => setFailed(true));
      return;
    }
    history.replaceState(null, "", window.location.pathname);
    fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, refreshToken, expiresIn: Number(params.get("expires_in")) || 3600 }),
    })
      .then((res) => {
        if (res.ok) window.location.replace("/");
        else setFailed(true);
      })
      .catch(() => setFailed(true));
  }, []);

  return (
    <div className="px-4 py-20 text-center text-[14px] text-[var(--ink-dim)]" role="status">
      {failed ? "We couldn't sign you in. Please close this page and try again." : "Signing you in…"}
    </div>
  );
}
