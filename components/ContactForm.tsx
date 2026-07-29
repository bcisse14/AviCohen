"use client";

import { useId, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const statusId = useId();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");
    setSuccessMessage("");

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(
          result?.message ??
            "Une erreur est survenue lors de l'envoi. Merci de réessayer ou de nous appeler directement."
        );
        return;
      }

      setStatus("success");
      setSuccessMessage(
        result?.message ??
          "Votre message a bien été envoyé. Le cabinet vous répondra dans les meilleurs délais."
      );
      form.reset();
    } catch {
      setStatus("error");
      setErrorMessage(
        "Une erreur est survenue lors de l'envoi. Merci de réessayer ou de nous appeler directement."
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Champ piège anti-robot : invisible pour les personnes, jamais rempli par un utilisateur légitime. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="site-web">Ne pas remplir ce champ</label>
        <input
          type="text"
          id="site-web"
          name="site-web"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="nom" className="text-sm font-medium text-ink">
          Nom complet
        </label>
        <input
          id="nom"
          name="nom"
          type="text"
          required
          maxLength={100}
          autoComplete="name"
          className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-3 text-ink outline-none focus-visible:border-accent"
        />
      </div>

      <div>
        <label htmlFor="email" className="text-sm font-medium text-ink">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={200}
          autoComplete="email"
          className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-3 text-ink outline-none focus-visible:border-accent"
        />
      </div>

      <div>
        <label htmlFor="telephone" className="text-sm font-medium text-ink">
          Téléphone (facultatif)
        </label>
        <input
          id="telephone"
          name="telephone"
          type="tel"
          maxLength={20}
          autoComplete="tel"
          className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-3 text-ink outline-none focus-visible:border-accent"
        />
      </div>

      <div>
        <label htmlFor="message" className="text-sm font-medium text-ink">
          Votre message
        </label>
        <textarea
          id="message"
          name="message"
          required
          maxLength={2000}
          rows={5}
          className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-3 text-ink outline-none focus-visible:border-accent"
        />
      </div>

      <button
        type="submit"
        className="btn-primary self-start"
        disabled={status === "loading"}
      >
        {status === "loading" ? "Envoi en cours…" : "Envoyer le message"}
      </button>

      <p role="status" aria-live="polite" id={statusId} className="text-sm">
        {status === "success" ? (
          <span className="text-accent">
            {successMessage ||
              "Votre message a bien été envoyé. Le cabinet vous répondra dans les meilleurs délais."}
          </span>
        ) : null}
        {status === "error" ? (
          <span className="text-red-400">{errorMessage}</span>
        ) : null}
      </p>
    </form>
  );
}
