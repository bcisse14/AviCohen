import Link from "next/link";
import { IconImplant, IconSparkleSmile, IconTooth } from "@/components/icons";
import type { Specialty } from "@/lib/site-config";

const icons: Record<string, typeof IconTooth> = {
  implantologie: IconImplant,
  "esthetique-dentaire": IconSparkleSmile,
  "dentisterie-numerique": IconTooth,
};

export function SpecialtyGrid({ specialties }: { specialties: Specialty[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {specialties.map((specialty) => {
        const Icon = icons[specialty.slug] ?? IconTooth;
        return (
          <Link
            key={specialty.slug}
            href={specialty.href}
            className="group flex flex-col rounded-2xl border border-border bg-surface p-7 no-underline transition-colors hover:border-accent"
          >
            <Icon className="h-10 w-10 text-accent" />
            <h3 className="mt-5 text-xl text-ink">{specialty.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {specialty.summary}
            </p>
            <span className="mt-5 text-sm font-medium text-accent">
              En savoir plus →
            </span>
          </Link>
        );
      })}
    </div>
  );
}
