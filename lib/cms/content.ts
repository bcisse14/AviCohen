import { cache } from "react";
import { repository } from "./repository";
import { initialDocument } from "./seed";

let warned = false;
export const getPublishedDocument = cache(async () => {
  if (!process.env.DATABASE_URL) {
    if (!warned) {
      console.warn("CMS non configuré : le site affiche le contenu initial. Configurez DATABASE_URL pour activer l'administration.");
      warned = true;
    }
    return initialDocument;
  }
  return repository.getPublished();
});
