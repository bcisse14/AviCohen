import { IconImageOff } from "@/components/icons";

/**
 * Emplacement réservé à une future photographie, à utiliser partout où
 * une image serait normalement attendue mais n'a pas encore été fournie
 * par le client (ex: implantologie, esthétique dentaire). Rend le
 * manque visible plutôt que de le masquer derrière une simple icône
 * décorative.
 */
export function ImagePlaceholder({
  label = "Photo à venir",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={`${label} : aucune photographie disponible pour le moment`}
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface p-10 text-center ${className}`}
    >
      <IconImageOff className="h-10 w-10 text-muted" />
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="max-w-[220px] text-xs text-muted">
        Cette page sera complétée dès réception d&apos;une photographie du
        cabinet.
      </p>
    </div>
  );
}
