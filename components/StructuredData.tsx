/**
 * Injecte un bloc JSON-LD (schema.org) dans la page. Composant serveur,
 * sans interaction, réutilisable sur plusieurs pages.
 */
export function StructuredData({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
