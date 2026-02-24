"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AccessPage() {
  const [key, setKey] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  function enter() {
    setMsg(null);
    if (!key.trim()) return setMsg("Enter access key.");
    // store in localStorage so admin page can read it (optional)
    localStorage.setItem("ADMIN_KEY", key.trim());
    router.push("/admin");
  }

  return (
    <main style={{ maxWidth: 520, margin: "60px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ marginTop: 0 }}>Access</h1>
      <p style={{ color: "#444" }}>Private access page (not linked publicly).</p>

      <div style={{ display: "grid", gap: 10, border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Access key"
          style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
        />
        <button onClick={enter} style={{ padding: 12, borderRadius: 10, border: "none", background: "black", color: "white" }}>
          Enter Admin
        </button>
        {msg && <p style={{ margin: 0 }}>{msg}</p>}
      </div>
    </main>
  );
}