import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Figure } from "@/components/Figure";
import { ContactForm } from "@/components/ContactForm";
import { isBlockVisible, isSafeLink, type Block, type CmsImage, type Settings } from "@/lib/cms/schema";
import { announcementKey, interpolate } from "@/lib/cms/announcement";
import { DismissibleAnnouncement } from "./DismissibleAnnouncement";

const widths = { compact: "max-w-3xl", standard: "max-w-content", wide: "max-w-[1600px]", full: "max-w-none" };
const grids = { 1: "grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 xl:grid-cols-4" };
const ratios = { auto: "", square: "aspect-square", landscape: "aspect-[4/3]", wide: "aspect-video", portrait: "aspect-[3/4]" };

export function RichText({ text, settings }: { text: string; settings: Settings }) {
  return (
    <div className="cms-prose min-w-0">
      <ReactMarkdown skipHtml urlTransform={(url) => isSafeLink(url) ? url : ""}
        components={{
          img: ({ alt }) => <span>{alt}</span>,
          a: ({ href, children }) => href ? <a href={href} rel={href.startsWith("https://") ? "noopener noreferrer" : undefined}>{children}</a> : <span>{children}</span>,
        }}>
        {interpolate(text, settings)}
      </ReactMarkdown>
    </div>
  );
}
function Photo({ image, priority = false }: { image: CmsImage; priority?: boolean }) {
  return <figure className="min-w-0">
    <Figure src={image.src} alt={image.alt} fit={image.fit} position={image.position}
      natural={image.ratio === "auto"} className={ratios[image.ratio]} priority={priority} />
    {image.caption && <figcaption className="mt-3 text-sm text-muted">{image.caption}</figcaption>}
  </figure>;
}
function Details({ settings }: { settings: Settings }) {
  const { address } = settings;
  const query = `${address.streetAddress}, ${address.postalCode} ${address.addressLocality}, ${address.addressCountry}`;
  return <div className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
    <div className="grid gap-6 sm:grid-cols-2">
      <address className="not-italic leading-relaxed">
        {address.streetAddress}<br />{address.postalCode} {address.addressLocality}<br />
        <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}>{settings.phone}</a><br />
        {[settings.email, ...settings.additionalEmails].map((email) => <span className="block" key={email}><a href={`mailto:${email}`}>{email}</a></span>)}
      </address>
      <ul className="space-y-2 text-muted">{settings.openingHours.map((slot, i) => <li key={i}>{slot.days} : {slot.hours}</li>)}</ul>
    </div>
    <div className="mt-6 flex flex-wrap gap-3">{settings.team.map((member) => (
      <a className="btn-secondary" href={member.doctolibUrl} target="_blank" rel="noopener noreferrer" key={member.id}>Rendez-vous avec {member.name}</a>
    ))}</div>
    <iframe title="Carte Google Maps du cabinet" src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`}
      loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="mt-6 h-[320px] w-full rounded-2xl border border-border sm:h-[400px]" />
  </div>;
}

export function ContentBlock({ block, settings, heading = "h2", priority = false, dismissalScope = "global" }: {
  block: Block; settings: Settings; heading?: "h1" | "h2"; priority?: boolean; dismissalScope?: string;
}) {
  const Heading = heading;
  const introductoryContent = <>
    {block.eyebrow && <p className="eyebrow">{interpolate(block.eyebrow, settings)}</p>}
    {block.title && <Heading className={`mt-4 break-words ${heading === "h1" ? "text-4xl sm:text-5xl lg:text-6xl" : "text-3xl sm:text-4xl"}`}>{interpolate(block.title, settings)}</Heading>}
    {block.body && <div className="mt-6"><RichText text={block.body} settings={settings} /></div>}
    {block.buttons.length > 0 && <div className={`mt-8 flex flex-wrap gap-4 ${block.align === "center" ? "justify-center" : ""}`}>
      {block.buttons.map((button, index) => <Link className={index ? "btn-secondary" : "btn-primary"} key={index} href={button.href}>{button.label}</Link>)}
    </div>}
    {block.showAppointments && <div className={`mt-5 flex flex-wrap gap-3 ${block.align === "center" ? "justify-center" : ""}`}>
      {settings.team.map((member) => <a className="btn-secondary" key={member.id} href={member.doctolibUrl} target="_blank" rel="noopener noreferrer">Doctolib : {member.name}</a>)}
    </div>}
  </>;
  const content = <section id={`bloc-${block.id}`} className={`border-b border-border ${block.background === "surface" ? "bg-surface" : block.background === "accent" ? "cms-accent-panel" : ""}`}>
    <div className={`mx-auto w-full px-5 py-12 sm:px-6 sm:py-16 lg:px-8 ${widths[block.width]} ${block.align === "center" ? "text-center" : ""}`}>
      {block.type === "split" ? <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className={block.imageSide === "left" ? "lg:order-2" : ""}>
          {introductoryContent}
          {block.items.length > 0 && <div className="mt-6 space-y-4">{block.items.map((item, i) => <details key={i} className="rounded-2xl border border-border bg-background p-5 text-left">
            <summary className="cursor-pointer font-medium text-ink">{item.title}</summary>
            <div className="mt-5"><RichText text={item.body} settings={settings} /></div>
          </details>)}</div>}
        </div>
        <div className={`min-w-0 space-y-6 ${block.imageSide === "left" ? "lg:order-1" : ""}`}>{block.images.map((image, i) => <Photo image={image} key={i} priority={priority && i === 0} />)}</div>
      </div> : <>
        {introductoryContent}
        {(block.type === "image" || block.type === "gallery" || block.type === "announcement") && block.images.length > 0 &&
          <div className={`mt-8 grid gap-6 ${block.type === "image" ? "" : grids[block.columns as keyof typeof grids]}`}>
            {block.images.map((image, i) => <Photo image={image} key={i} priority={priority && i === 0} />)}
          </div>}
        {block.type === "cards" && <div className={`mt-8 grid gap-6 ${grids[block.columns as keyof typeof grids]}`}>
          {block.items.map((item, i) => <article key={i} className="min-w-0 rounded-2xl border border-border bg-background p-6 text-left">
            <h3 className="text-xl">{item.title}</h3><div className="mt-4"><RichText text={item.body} settings={settings} /></div>
          </article>)}
        </div>}
        {block.type === "faq" && <div className="mt-8 space-y-4 text-left">{block.items.map((item, i) => <details className="rounded-2xl border border-border bg-background p-6" key={i}>
          <summary className="cursor-pointer text-lg font-medium">{item.title}</summary><div className="mt-4"><RichText text={item.body} settings={settings} /></div>
        </details>)}</div>}
        {block.type === "team" && <div className={`mt-8 grid gap-6 ${grids[block.columns as keyof typeof grids]}`}>{settings.team.map((member) => <article className="min-w-0 rounded-2xl border border-border bg-background p-6 text-left" key={member.id}>
          <Photo image={member.photo} /><h3 className="mt-5 text-xl">{member.name}</h3><p className="mt-2 text-accent">{member.title}</p>
          <div className="mt-4"><RichText text={member.bio} settings={settings} /></div>
          <a className="btn-secondary mt-5" href={member.doctolibUrl} target="_blank" rel="noopener noreferrer">Rendez-vous avec {member.name}</a>
        </article>)}</div>}
        {block.type === "specialties" && <div className={`mt-8 grid gap-6 ${grids[block.columns as keyof typeof grids]}`}>{settings.specialties.map((specialty) => <article key={specialty.id} className="min-w-0 rounded-2xl border border-border bg-background p-6 text-left">
          <h3 className="text-xl"><Link href={specialty.href}>{specialty.title}</Link></h3><div className="mt-4"><RichText text={specialty.summary} settings={settings} /></div>
        </article>)}</div>}
        {block.type === "details" && <Details settings={settings} />}
        {block.type === "contact" && <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-6 text-left"><ContactForm /></div>
          <div className="min-w-0 text-left"><Details settings={settings} /></div>
        </div>}
      </>}
    </div>
  </section>;
  if (block.type !== "announcement") return content;
  return <DismissibleAnnouncement storageKey={announcementKey(block, settings, dismissalScope)}
    title={interpolate(block.title, settings) || "Information du cabinet"} widthClass={widths[block.width]}>
    {content}
  </DismissibleAnnouncement>;
}
export function Blocks({ blocks, settings, scope }: { blocks: Block[]; settings: Settings; scope: string }) {
  const visible = blocks.filter((b) => isBlockVisible(b));
  const firstHeading = visible.findIndex((b) => b.type !== "announcement" && Boolean(b.title));
  return <>{visible.map((block, i) => <ContentBlock key={block.id} block={block} settings={settings} dismissalScope={`page:${scope}`} heading={i === firstHeading ? "h1" : "h2"} priority={i === 0} />)}</>;
}
