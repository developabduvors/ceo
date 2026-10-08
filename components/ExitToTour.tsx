"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const TOP_DWELL = 350; // ekran tepasida shuncha ms tursa — turga qaytamiz (turdagi bilan bir xil)
const WHEEL_UP = 220; // sahifa tepasida turib g'ildirakni shuncha px tepaga aylantirsa
const SETTLE = 300; // tepaga endi yetib kelgan bo'lsa — inersiya bilan chiqib ketmaslik uchun kutamiz
const LEAVE_DELAY = 200; // kursor sahifadan tepaga chiqib ketsa — shuncha ms ichida qaytmasa, chiqamiz

// Ekranning yuqori qismi: shu yerda tursa yoki shu yerdan sahifadan chiqib ketsa — "tepaga"
const inTopBand = (y: number) => y < Math.max(64, window.innerHeight * 0.08);

/** Bo'lim sahifasidan turga (o'sha xonaga) qaytish: Esc, ekran tepasi, tepada g'ildirak tepaga. */
export function ExitToTour({ slug }: { slug: string }) {
  const router = useRouter();

  useEffect(() => {
    const back = () => router.push(`/#${slug}`);
    let topTimer = 0;
    let wheelSum = 0;
    let atTopSince = window.scrollY <= 0 ? performance.now() : 0;

    const cancelTop = () => {
      clearTimeout(topTimer);
      topTimer = 0;
    };
    const onMove = (e: MouseEvent) => {
      if (inTopBand(e.clientY)) {
        if (!topTimer) topTimer = window.setTimeout(back, TOP_DWELL);
      } else cancelTop();
    };
    const onScroll = () => {
      atTopSince = window.scrollY <= 0 ? atTopSince || performance.now() : 0;
      wheelSum = 0;
    };
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY >= 0 || !atTopSince || performance.now() - atTopSince < SETTLE) {
        wheelSum = 0;
        return;
      }
      wheelSum -= e.deltaY;
      if (wheelSum > WHEEL_UP) back();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && back();

    // Kursor sahifadan tepaga chiqib ketdi (brauzer paneliga) — bu ham "tepaga" harakati.
    // Tez harakatda Chrome chiqish nuqtasini 0 emas, 10–40px kabi beradi — shuning uchun butun yuqori qism.
    const onLeave = (e: MouseEvent) => {
      cancelTop();
      if (inTopBand(e.clientY)) topTimer = window.setTimeout(back, LEAVE_DELAY);
    };

    window.addEventListener("mousemove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", cancelTop); // tezda qaytib kirsa — bekor
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      cancelTop();
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", cancelTop);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [router, slug]);

  return null;
}
