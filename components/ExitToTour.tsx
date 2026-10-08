"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const TOP_DWELL = 350; // ekran tepasida shuncha ms tursa — turga qaytamiz (turdagi bilan bir xil)
const WHEEL_UP = 220; // sahifa tepasida turib g'ildirakni shuncha px tepaga aylantirsa
const SETTLE = 300; // tepaga endi yetib kelgan bo'lsa — inersiya bilan chiqib ketmaslik uchun kutamiz
const LEAVE_DELAY = 200; // kursor sahifadan tepaga chiqib ketsa — shuncha ms ichida qaytmasa, chiqamiz
const SWIPE = 70; // telefonda: shuncha px o'ngga surish yoki tepada pastga tortish — turga

// Telefonda bosish ham soxta "mousemove" yuboradi — sichqoncha mantig'i faqat haqiqiy sichqonchada ishlasin
const hasMouse = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;
// Ekranning yuqori qismi: shu yerda tursa yoki shu yerdan sahifadan chiqib ketsa — "tepaga"
const inTopBand = (y: number) => y < Math.max(64, window.innerHeight * 0.08);

/**
 * Bo'lim sahifasidan turga (o'sha xonaga) qaytish.
 * Kompyuter: Esc, sichqoncha ekran tepasiga, sahifa tepasida g'ildirak tepaga.
 * Telefon: o'ngga surish yoki sahifa tepasida pastga tortish.
 */
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
      if (!hasMouse()) return;
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
      if (hasMouse() && inTopBand(e.clientY)) topTimer = window.setTimeout(back, LEAVE_DELAY);
    };

    // Telefon: asosan gorizontal o'ngga surish — orqaga; sahifa tepasida asosan pastga tortish — orqaga
    let tx = 0;
    let ty = 0;
    let startedAtTop = false;
    const onTouchStart = (e: TouchEvent) => {
      tx = e.touches[0].clientX;
      ty = e.touches[0].clientY;
      startedAtTop = window.scrollY <= 0;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - tx;
      const dy = e.changedTouches[0].clientY - ty;
      const swipeRight = dx > SWIPE && Math.abs(dx) > Math.abs(dy) * 1.5;
      const pullDown = startedAtTop && window.scrollY <= 0 && dy > SWIPE && dy > Math.abs(dx) * 1.5;
      if (swipeRight || pullDown) back();
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", cancelTop); // tezda qaytib kirsa — bekor
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      cancelTop();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", cancelTop);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [router, slug]);

  return null;
}
