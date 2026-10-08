"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { DEPARTMENTS, LOBBY, VIDEO } from "@/lib/departments";
import { useCamera } from "./useCamera";
import { useVideoPreload } from "./useVideoPreload";

// intro -> (Kirish yoki g'ildirak) -> tour -> (bo'lim tanlandi) -> leaving -> /bolim/[slug]
type Phase = "intro" | "entering" | "tour" | "leaving";
const LOBBY_INDEX = -1;
const pad = (n: number) => String(n).padStart(2, "0");

// Kamera to'xtaydigan nuqtalar: 0 — bino (bosh sahifa), 1 — qabulxona, 2.. — bo'limlar
const STOPS = [0, LOBBY.time, ...DEPARTMENTS.map((d) => d.time)];
const LAST = STOPS.length - 1;
const SCRUB = 0.004; // g'ildirakning 1px = 0.004s video (sichqonchaning bitta "tiq"i ≈ 0.4s)
const SNAP_DELAY = 160; // g'ildirak to'xtagach shuncha ms o'tib eng yaqin xonaga boriladi
const TOP_DWELL = 350; // ekran tepasida shuncha ms tursa — bosh sahifa (tasodifiy o'tib ketishdan himoya)
const LEAVE_DELAY = 200; // kursor sahifadan tepaga chiqib ketsa — shuncha ms ichida qaytmasa, bosh sahifa
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
// Ekranning yuqori qismi: shu yerda tursa yoki shu yerdan sahifadan chiqib ketsa — bosh sahifa
const inTopBand = (y: number) => y < Math.max(64, window.innerHeight * 0.08);
const activeOf = (stop: number) => (stop >= 2 ? stop - 2 : LOBBY_INDEX);

export default function Tour() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const dockRef = useRef<HTMLElement>(null);
  const stopRef = useRef(0); // hozirgi to'xtash nuqtasi (STOPS indeksi)
  const scrubRef = useRef(0); // g'ildirak bilan aylantirilayotgan video vaqti
  const phaseRef = useRef<Phase>("intro");
  const { src, progress } = useVideoPreload(VIDEO);
  const { goTo, jump } = useCamera(videoRef);

  const [ready, setReady] = useState(false);
  const [phase, setPhaseState] = useState<Phase>("intro");
  const [active, setActive] = useState(LOBBY_INDEX);

  const dept = active >= 0 ? DEPARTMENTS[active] : null;
  const accent = dept?.accent ?? LOBBY.accent;
  const stop = dept ?? LOBBY;
  const backdrop = phase === "intro" ? "/media/rooms/intro.jpg" : stop.poster;

  // phase'ni ref'da ham saqlaymiz — window handlerlari eskirgan qiymatni o'qimasligi uchun
  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  // Asosiy navigatsiya: s-to'xtash nuqtasiga borish (0 = bosh sahifa)
  const goStop = useCallback(
    (s: number) => {
      s = clamp(s, 0, LAST);
      stopRef.current = s;
      scrubRef.current = STOPS[s];
      setActive(activeOf(s));
      if (s === 0) {
        setPhase("intro");
        history.replaceState(null, "", "/");
      } else {
        setPhase("tour");
      }
      goTo(STOPS[s]);
    },
    [goTo, setPhase],
  );

  const focus = useCallback((i: number) => stopRef.current !== i + 2 && goStop(i + 2), [goStop]);

  // /#hr kabi havola — intro'siz to'g'ri o'sha bo'limga. Mos xona topilsa true.
  const syncHash = useCallback(() => {
    const i = DEPARTMENTS.findIndex((d) => `#${d.slug}` === window.location.hash);
    if (i < 0) return false;
    stopRef.current = i + 2;
    scrubRef.current = STOPS[i + 2];
    jump(STOPS[i + 2]);
    setActive(i);
    setPhase("tour");
    return true;
  }, [jump, setPhase]);

  const handleLoaded = () => {
    setReady(true);
    syncHash();
  };

  // Next (cacheComponents) tur sahifasini xotirada saqlaydi: bo'limdan qaytilganda komponent qayta
  // yaratilmaydi — holat eski ("leaving", qora parda) qoladi, video ham qayta yuklanmaydi.
  // Sahifa qayta ko'ringanda effektlar qayta ishga tushadi — shu yerda holatni URL bo'yicha tiklaymiz.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const v = videoRef.current;
      if (!v || v.readyState < 1) return; // birinchi yuklanish — buni handleLoaded hal qiladi
      if (!syncHash() && phaseRef.current === "leaving") goStop(stopRef.current);
    });
    return () => cancelAnimationFrame(id);
  }, [syncHash, goStop]);

  // Faqat hash o'zgarsa sahifa qayta yuklanmaydi (loadeddata ham bo'lmaydi)
  useEffect(() => {
    if (!ready) return;
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [ready, syncHash]);

  const enter = () => {
    if (!ready || phase !== "intro") return;
    stopRef.current = 1;
    scrubRef.current = LOBBY.time;
    setPhase("entering");
    goTo(LOBBY.time, 1).then(() => phaseRef.current === "entering" && setPhase("tour")); // 1x — dron parvozi real tezlikda
  };

  const exit = () => goStop(0);

  const open = (i: number) => {
    const d = DEPARTMENTS[i];
    focus(i);
    setPhase("leaving");
    history.replaceState(null, "", `#${d.slug}`); // "Orqaga" bosilsa shu xonaga qaytadi
    goTo(d.time).then(() => setTimeout(() => router.push(`/bolim/${d.slug}`), 500));
  };

  // Sensorli ekranda 1-bosish kamerani olib boradi, 2-bosish bo'limga kiradi
  const handleCard = (i: number) => {
    const canHover = window.matchMedia("(hover: hover)").matches;
    if (canHover || stopRef.current === i + 2) open(i);
    else focus(i);
  };

  useEffect(() => {
    DEPARTMENTS.forEach((d) => router.prefetch(`/bolim/${d.slug}`));
  }, [router]);

  // Mobilda dock gorizontal aylanadi — aktiv kartani markazga keltiramiz.
  // scrollIntoView ishlatilmaydi: u overflow:hidden ota-konteynerni ham siljitib, sahifani "qiyshaytiradi".
  useEffect(() => {
    const dock = dockRef.current;
    const card = dock?.querySelector<HTMLElement>('[data-active="true"]');
    if (!dock || !card || dock.scrollWidth <= dock.clientWidth) return;
    dock.scrollTo({ left: card.offsetLeft - (dock.clientWidth - card.offsetWidth) / 2, behavior: "smooth" });
  }, [active]);

  // Sichqoncha X bo'yicha qaysi xona: kartadan chapda — qabulxona, karta to'g'risida — o'sha bo'lim
  const zoneAt = useCallback((x: number) => {
    const cards = dockRef.current?.querySelectorAll<HTMLElement>(".dock-card");
    if (!cards?.length) return null;
    const lefts = [...cards].map((c) => c.getBoundingClientRect().left);
    if (x < lefts[0]) return 1;
    const i = lefts.findLastIndex((l) => x >= l);
    return i + 2;
  }, []);

  // Boshqaruv: sichqoncha (chap-o'ng = oldinga/orqaga, tepa = bosh sahifa), g'ildirak, strelkalar, swipe.
  useEffect(() => {
    if (!ready) return;
    let snapTimer = 0;
    let dir = 0;
    const busy = () => phaseRef.current === "entering" || phaseRef.current === "leaving";

    const onWheel = (e: WheelEvent) => {
      if (busy() || Math.abs(e.deltaY) < 2) return;
      dir = Math.sign(e.deltaY);
      const t = clamp(scrubRef.current + e.deltaY * SCRUB, 0, STOPS[LAST]);
      scrubRef.current = t;

      if (phaseRef.current === "intro" && dir > 0) setPhase("tour"); // bosh sahifadan pastga — ichkariga
      // HUD'da kamera yaqinlashayotgan xona ko'rinadi
      const near = STOPS.reduce((best, x, i) => (Math.abs(x - t) < Math.abs(STOPS[best] - t) ? i : best), 0);
      if (near >= 1) setActive(activeOf(near));
      goTo(t, 4);

      clearTimeout(snapTimer);
      snapTimer = window.setTimeout(() => {
        // yo'nalish bo'yicha keyingi xona: pastga — oldinga, tepaga — orqaga
        const next =
          dir > 0 ? STOPS.findIndex((x) => x > t - 0.001) : STOPS.findLastIndex((x) => x < t + 0.001);
        goStop(next < 0 ? (dir > 0 ? LAST : 0) : next);
      }, SNAP_DELAY);
    };

    const onKey = (e: KeyboardEvent) => {
      if (busy()) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goStop(stopRef.current + 1);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goStop(stopRef.current - 1);
    };

    // Sichqoncha: zona almashgandagina yuramiz — g'ildirak bilan borilgan xonani mayda titrash buzmasin
    let lastZone = -1;
    let topTimer = 0;
    const cancelTop = () => {
      clearTimeout(topTimer);
      topTimer = 0;
    };
    const goHome = () => {
      topTimer = 0;
      lastZone = -1;
      goStop(0);
    };
    // Kursor sahifadan tepaga chiqib ketdi (brauzer paneliga) — bu ham "tepaga" harakati.
    // Tez harakatda Chrome chiqish nuqtasini 0 emas, 10–40px kabi beradi — shuning uchun butun yuqori qism.
    const onMouseLeave = (e: MouseEvent) => {
      cancelTop();
      if (phaseRef.current === "tour" && inTopBand(e.clientY)) topTimer = window.setTimeout(goHome, LEAVE_DELAY);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (busy() || phaseRef.current !== "tour") {
        lastZone = -1;
        return cancelTop();
      }
      if (inTopBand(e.clientY)) {
        if (!topTimer) topTimer = window.setTimeout(goHome, TOP_DWELL);
        return;
      }
      cancelTop();
      const z = zoneAt(e.clientX);
      if (z === null || z === lastZone) return;
      const first = lastZone === -1; // turga kirgandagi birinchi harakat — faqat eslab qolamiz
      lastZone = z;
      if (!first) goStop(z);
    };

    let startY = 0;
    const onTouchStart = (e: TouchEvent) => (startY = e.touches[0].clientY);
    const onTouchEnd = (e: TouchEvent) => {
      const dy = startY - e.changedTouches[0].clientY;
      if (!busy() && Math.abs(dy) > 50) goStop(stopRef.current + (dy > 0 ? 1 : -1));
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("mousemove", onMouseMove);
    document.documentElement.addEventListener("mouseleave", onMouseLeave);
    document.documentElement.addEventListener("mouseenter", cancelTop); // tezda qaytib kirsa — bekor
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      clearTimeout(snapTimer);
      cancelTop();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("mousemove", onMouseMove);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
      document.documentElement.removeEventListener("mouseenter", cancelTop);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [ready, goTo, goStop, setPhase, zoneAt]);

  const inTour = phase === "tour" || phase === "leaving";

  return (
    <main className="tour" data-phase={phase} style={{ "--accent": accent, "--focus": stop.focus } as CSSProperties}>
      {/* Vertikal ekranda video to'liq ko'rinadi, bo'sh joyni xiralashgan kadr to'ldiradi */}
      <div className="tour-backdrop" style={{ backgroundImage: `url(${backdrop})` }} aria-hidden />
      <video
        ref={videoRef}
        src={src ?? undefined}
        poster="/media/rooms/intro.jpg"
        muted
        playsInline
        preload="auto"
        onLoadedData={handleLoaded}
        className="tour-video"
        aria-hidden
      />
      <div className="tour-shade" aria-hidden />

      {/* ───── Header ───── */}
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-5 sm:px-10">
        <button onClick={inTour ? exit : undefined} className="flex items-center gap-3 font-display text-sm tracking-[0.25em]">
          <span className="logo-mark" aria-hidden />
          CEO&nbsp;AI
        </button>
        {inTour && (
          <div className="rise glass-chip flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-white/70">
            <span className="pulse-dot" aria-hidden />
            <span className="hidden sm:inline">Hozir:</span>
            <span className="text-white">{dept ? `${dept.name} bo‘limi` : LOBBY.name}</span>
          </div>
        )}
      </header>

      {/* ───── Intro: "Kirish" ───── */}
      <section className="intro" aria-hidden={phase !== "intro"}>
        <h1 className="intro-title font-display" aria-label="CEO AI">
          {"CEO AI".split("").map((ch, i) => (
            <span key={i} className="intro-letter" style={{ "--d": `${350 + i * 70}ms` } as CSSProperties}>
              {ch === " " ? " " : ch}
            </span>
          ))}
        </h1>
        <p className="rise max-w-md text-center text-base text-white/90 sm:text-lg" style={{ "--d": "900ms" } as CSSProperties}>
          Moliya, Marketing, HR va Sklad — bitta binoda, bitta tizimda.
        </p>
        <button
          onClick={enter}
          disabled={!ready}
          className="enter-btn group rise"
          style={{ "--d": "1100ms" } as CSSProperties}
        >
          <span className="enter-fill" style={{ transform: `scaleX(${ready ? 1 : progress})` }} aria-hidden />
          <span className="relative">{ready ? "Kirish" : `Yuklanmoqda ${Math.round(progress * 100)}%`}</span>
          {ready && <span className="relative transition-transform group-hover:translate-x-1" aria-hidden>→</span>}
        </button>
      </section>

      {inTour && (
        <>
          {/* ───── Joriy xona matni ───── */}
          <section key={active} className="hud" aria-live="polite">
            <p className="rise text-xs uppercase tracking-[0.35em] text-[var(--accent)]">
              {dept ? `${pad(active + 1)} / ${pad(DEPARTMENTS.length)} — Bo‘lim` : "Qabulxona"}
            </p>
            <h2 className="hud-title rise font-display" style={{ "--d": "60ms" } as CSSProperties}>
              {dept ? dept.name : "Xush kelibsiz"}
            </h2>
            <p className="rise max-w-md text-base text-white/90 sm:text-lg" style={{ "--d": "120ms" } as CSSProperties}>
              {dept ? (
                dept.tagline
              ) : (
                <>
                  <span className="only-hover">Sichqonchani o‘ngga suring — kamera xonalar bo‘ylab yuradi. Tepaga — bosh sahifa.</span>
                  <span className="only-touch">Bo‘limni tanlang — kamera sizni o‘sha xonaga olib boradi.</span>
                </>
              )}
            </p>

            {dept && (
              <button onClick={() => open(active)} className="cta only-touch rise mt-5" style={{ "--d": "180ms" } as CSSProperties}>
                Bo‘limga kirish <span aria-hidden>→</span>
              </button>
            )}
          </section>

          {/* ───── Bo'limlar paneli: sichqoncha qaysi karta to'g'risida bo'lsa — kamera o'sha xonada ───── */}
          <div className="dock-wrap">
            <nav ref={dockRef} className="dock" aria-label="Bo‘limlar">
              {DEPARTMENTS.map((d, i) => (
                <button
                  key={d.slug}
                  className="dock-card rise"
                  data-active={i === active}
                  style={{ "--d": `${300 + i * 80}ms`, "--card": d.accent } as CSSProperties}
                  onMouseEnter={() => focus(i)}
                  onFocus={() => focus(i)}
                  onClick={() => handleCard(i)}
                >
                  <span className="text-[11px] tracking-[0.3em] text-white/50">{pad(i + 1)}</span>
                  <span className="font-display text-base sm:text-lg">{d.name}</span>
                  <span className="dock-short text-xs text-white/60">{d.short}</span>
                  <span className="dock-go only-hover text-xs font-semibold" aria-hidden>
                    Bo‘limga kirish →
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </>
      )}

      <div className="curtain" aria-hidden />
    </main>
  );
}
