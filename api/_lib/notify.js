// Envoi des codes de confirmation : e-mail (Resend) ou SMS / WhatsApp (Twilio).
import { httpError } from "./http.js";

async function sendEmail(to, subject, text) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!key || !from) throw httpError(503, "L’envoi d’e-mails n’est pas configuré sur le serveur.");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!r.ok) throw httpError(502, "Impossible d’envoyer l’e-mail pour le moment.");
}

async function sendPhone(phoneDigits, text) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from) throw httpError(503, "L’envoi par SMS n’est pas configuré sur le serveur.");
  const wa = process.env.TWILIO_CHANNEL === "whatsapp";
  const form = new URLSearchParams({
    To: (wa ? "whatsapp:" : "") + "+" + phoneDigits,
    From: wa && !from.startsWith("whatsapp:") ? "whatsapp:" + from : from,
    Body: text,
  });
  const r = await fetch("https://api.twilio.com/2010-04-01/Accounts/" + sid + "/Messages.json", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(sid + ":" + token).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  if (!r.ok) throw httpError(502, "Impossible d’envoyer le message pour le moment.");
}

export async function deliverCode(identity, code) {
  const text = "Luky : votre code de confirmation est " + code + ". Il expire dans 10 minutes.";
  if (identity.type === "email") return sendEmail(identity.value, "Votre code Luky", text);
  return sendPhone(identity.value, text);
}
