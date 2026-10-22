"use client";

import { useState } from "react";
import { cmsRequest } from "./MediaLibrary";

export function Login() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <form className="cms-panel mx-auto max-w-md space-y-5" onSubmit={async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      await cmsRequest("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier: data.get("identifier"), password: data.get("password") }) });
      window.location.assign("/admin");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Connexion impossible."); setBusy(false); }
  }}>
    <h1 className="text-3xl">Administration du site</h1>
    <p className="text-sm text-muted">Connectez-vous pour gérer les pages, photos et annonces du cabinet.</p>
    <label className="cms-label">Identifiant<input type="text" name="identifier" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={254} className="cms-field" /></label>
    <label className="cms-label">Mot de passe<input type="password" name="password" autoComplete="current-password" required maxLength={256} className="cms-field" /></label>
    <button type="submit" disabled={busy} className="btn-primary">{busy ? "Connexion…" : "Se connecter"}</button>
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
  </form>;
}
