import { Suspense, type CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ExitToTour } from "@/components/ExitToTour";
import { Reveal } from "@/components/Reveal";
import { DEPARTMENTS, getDepartment } from "@/lib/departments";

const pad = (n: number) => String(n).padStart(2, "0");

export function generateStaticParams() {
  return DEPARTMENTS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/bolim/[slug]">): Promise<Metadata> {
  const d = getDepartment((await params).slug);
  return d ? { title: `${d.name} bo‘limi — CEO AI`, description: d.description } : {};
}

// partialPrefetching yoqilgan: params <Suspense> ichida o'qiladi — navigatsiya darhol boshlanadi
export default function DepartmentPage({ params }: PageProps<"/bolim/[slug]">) {
  return (
    <Suspense fallback={<main className="min-h-svh bg-[var(--bg)]" />}>
      <Department params={params} />
    </Suspense>
  );
}

async function Department({ params }: Pick<PageProps<"/bolim/[slug]">, "params">) {
  const { slug } = await params;
  const d = getDepartment(slug);
  if (!d) notFound();

  const index = DEPARTMENTS.indexOf(d);

  return (
    <main style={{ "--accent": d.accent } as CSSProperties}>
      {/* Chiqish: sichqoncha ekran tepasiga / tepada g'ildirak tepaga / Esc — turga, shu xonaga */}
      <ExitToTour slug={d.slug} />
      {/* ───── Hero: videodagi o'sha xona kadri ───── */}
      <section className="relative flex h-[92svh] min-h-[560px] flex-col justify-end overflow-hidden">
        <Image src={d.poster} alt={`${d.name} bo‘limi`} fill priority sizes="100vw" quality={90} className="kenburns object-cover" />
        {/* faqat pastki (matn) qismi qoraytiriladi — rasm tiniq qoladi */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/30 via-35% to-transparent" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/45 to-transparent" />

        <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-5 sm:px-10">
          <span className="rise font-display text-sm tracking-[0.25em]">CEO&nbsp;AI</span>
        </header>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-14 sm:px-10">
          <p className="rise text-xs uppercase tracking-[0.35em] text-[var(--accent)]" style={{ "--d": "150ms" } as CSSProperties}>
            {pad(index + 1)} / {pad(DEPARTMENTS.length)} — Bo‘lim
          </p>
          <h1
            className="rise mt-3 font-display text-[clamp(3.5rem,13vw,9rem)] font-extrabold leading-[0.9] tracking-tight"
            style={{ "--d": "250ms" } as CSSProperties}
          >
            {d.name}
          </h1>
          <p className="rise mt-5 max-w-xl text-xl text-white/85 sm:text-2xl" style={{ "--d": "350ms" } as CSSProperties}>
            {d.tagline}
          </p>
          <div className="draw-line mt-10 h-px bg-white/25" style={{ "--d": "500ms" } as CSSProperties} />
          <dl className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {d.stats.map((s, i) => (
              <div key={s.label} className="rise" style={{ "--d": `${600 + i * 100}ms` } as CSSProperties}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-display text-3xl sm:text-4xl">{s.value}</dd>
                <dd className="mt-1 text-sm text-white/60">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ───── Bo'lim haqida ───── */}
      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-10">
        <Reveal>
          <p className="max-w-3xl text-2xl leading-snug text-white/90 sm:text-3xl">{d.description}</p>
        </Reveal>
      </section>

      {/* ───── Vazifalar ───── */}
      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-10">
        <Reveal>
          <h2 className="mb-10 text-xs uppercase tracking-[0.35em] text-[var(--muted)]">Asosiy vazifalar</h2>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2">
          {d.services.map((s, i) => (
            <Reveal key={s.title} delay={i * 90}>
              <article className="group h-full rounded-2xl border border-[var(--line)] bg-white/[0.03] p-7 transition-colors duration-500 hover:border-[var(--accent)] hover:bg-white/[0.06]">
                <span className="font-display text-sm text-[var(--accent)]">{pad(i + 1)}</span>
                <h3 className="mt-6 font-display text-xl sm:text-2xl">{s.title}</h3>
                <p className="mt-3 text-white/65">{s.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───── Ish jarayoni ───── */}
      <section className="mx-auto max-w-6xl px-5 pb-28 sm:px-10">
        <Reveal>
          <h2 className="mb-12 text-xs uppercase tracking-[0.35em] text-[var(--muted)]">Ish jarayoni</h2>
        </Reveal>
        <ol className="grid gap-8 sm:grid-cols-4">
          {d.process.map((step, i) => (
            <Reveal as="li" key={step} delay={i * 120} className="relative border-t border-[var(--line)] pt-6">
              <span className="absolute -top-[5px] left-0 h-[9px] w-[9px] rounded-full bg-[var(--accent)]" aria-hidden />
              <span className="text-xs text-[var(--muted)]">{pad(i + 1)}-bosqich</span>
              <p className="mt-2 font-display text-lg">{step}</p>
            </Reveal>
          ))}
        </ol>
      </section>
    </main>
  );
}
