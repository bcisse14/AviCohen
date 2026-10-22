import { createHash } from "node:crypto";
import type { Block, Settings } from "./schema";

export function interpolate(value: string, settings: Settings) {
  const tokens: Record<string, string> = {
    practiceName: settings.practiceName, name: settings.name, tagline: settings.tagline, email: settings.email,
    emails: [settings.email, ...settings.additionalEmails].join(" / "), phone: settings.phone,
    address: `${settings.address.streetAddress}, ${settings.address.postalCode} ${settings.address.addressLocality}`,
  };
  return value.replace(/\{\{(\w+)\}\}/g, (match, key: string) => tokens[key] ?? match);
}

export function announcementKey(block: Block, settings: Settings, scope: string) {
  const content = {
    scope, block,
    title: interpolate(block.title, settings),
    eyebrow: interpolate(block.eyebrow, settings),
    body: interpolate(block.body, settings),
    appointments: block.showAppointments ? settings.team.map(({ name, doctolibUrl }) => ({ name, doctolibUrl })) : [],
  };
  return `cohen:announcement:v1:${createHash("sha256").update(JSON.stringify(content)).digest("hex")}`;
}
