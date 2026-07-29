import { NextResponse } from "next/server";
import { Resend } from "resend";
import { siteConfig } from "@/lib/site-config";

// Force l'exécution dynamique : cette route ne doit jamais être mise en
// cache (elle traite des données de formulaire).
export const dynamic = "force-dynamic";

const MAX_LENGTHS = {
  nom: 100,
  email: 200,
  telephone: 20,
  message: 2000,
} as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isResendSandboxError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    statusCode?: number;
    name?: string;
    message?: string;
  };

  const message = candidate.message?.toLowerCase() ?? "";

  return (
    (candidate.statusCode === 403 || candidate.name === "validation_error") &&
    message.includes("only send testing emails")
  );
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Requête invalide." },
      { status: 400 }
    );
  }

  const nom = typeof body.nom === "string" ? body.nom.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const telephone =
    typeof body.telephone === "string" ? body.telephone.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  // Champ piège anti-robot : doit rester vide pour un envoi légitime.
  const honeypot =
    typeof body["site-web"] === "string" ? body["site-web"].trim() : "";

  if (honeypot) {
    // On répond succès sans rien envoyer, pour ne pas informer le robot.
    return NextResponse.json({ ok: true });
  }

  if (!nom || !email || !message) {
    return NextResponse.json(
      { message: "Merci de renseigner votre nom, votre e-mail et votre message." },
      { status: 400 }
    );
  }

  if (
    nom.length > MAX_LENGTHS.nom ||
    email.length > MAX_LENGTHS.email ||
    telephone.length > MAX_LENGTHS.telephone ||
    message.length > MAX_LENGTHS.message
  ) {
    return NextResponse.json(
      { message: "Un des champs dépasse la longueur autorisée." },
      { status: 400 }
    );
  }

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { message: "L'adresse e-mail saisie n'est pas valide." },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(
      "RESEND_API_KEY est manquante : impossible d'envoyer l'e-mail de contact."
    );
    return NextResponse.json(
      { message: "Le service d'envoi n'est pas configuré pour le moment." },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);
  // TODO (client) : adresse de réception à confirmer. Peut être surchargée
  // via la variable d'environnement CONTACT_EMAIL_TO sans toucher au code.
  const to = process.env.CONTACT_EMAIL_TO || siteConfig.email;
  // TODO (déploiement) : tant que le domaine du cabinet n'est pas vérifié
  // sur Resend, l'adresse d'expédition doit rester "onboarding@resend.dev".
  const from = process.env.CONTACT_EMAIL_FROM || "onboarding@resend.dev";

  try {
    const { error } = await resend.emails.send({
      from: `Site ${siteConfig.practiceName} <${from}>`,
      to,
      reply_to: email,
      subject: `Nouveau message du site - ${nom}`,
      html: `
        <p><strong>Nom :</strong> ${escapeHtml(nom)}</p>
        <p><strong>E-mail :</strong> ${escapeHtml(email)}</p>
        <p><strong>Téléphone :</strong> ${escapeHtml(telephone || "Non renseigné")}</p>
        <p><strong>Message :</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
      `,
    });

    if (error) {
      if (isResendSandboxError(error)) {
        console.warn(
          "Resend est en mode sandbox : le message a été reçu mais l'e-mail n'a pas pu être envoyé."
        );
        return NextResponse.json({
          ok: true,
          skipped: true,
          message:
            "Votre message a bien été reçu. L'envoi d'e-mail est actuellement limité à l'environnement de test, merci de nous contacter directement si nécessaire.",
        });
      }

      console.error("Erreur Resend :", error);
      return NextResponse.json(
        { message: "L'envoi du message a échoué. Merci de réessayer." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isResendSandboxError(error)) {
      console.warn(
        "Resend est en mode sandbox : le message a été reçu mais l'e-mail n'a pas pu être envoyé."
      );
      return NextResponse.json({
        ok: true,
        skipped: true,
        message:
          "Votre message a bien été reçu. L'envoi d'e-mail est actuellement limité à l'environnement de test, merci de nous contacter directement si nécessaire.",
      });
    }

    console.error("Erreur lors de l'envoi du message de contact :", error);
    return NextResponse.json(
      { message: "L'envoi du message a échoué. Merci de réessayer." },
      { status: 500 }
    );
  }
}
