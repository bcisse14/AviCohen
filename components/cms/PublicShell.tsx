import type { CSSProperties, ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SkipLink } from "@/components/ui";
import { ContentBlock } from "./Blocks";
import { isBlockVisible, type Settings } from "@/lib/cms/schema";

export function PublicShell({ settings, children, preview = false }: { settings: Settings; children: ReactNode; preview?: boolean }) {
  const style = { "--accent": settings.accent } as CSSProperties;
  return <div style={style}>
    <SkipLink />
    <Header settings={{ name: settings.name, navigation: settings.navigation, team: settings.team }} />
    <main id="contenu-principal">
      {settings.announcements.filter((b) => isBlockVisible(b)).map((block) => <ContentBlock key={block.id} block={block} settings={settings} dismissalScope={preview ? "preview:global" : "global"} />)}
      {children}
    </main>
    <Footer settings={settings} />
  </div>;
}
