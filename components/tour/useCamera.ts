"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

type Pending = RefObject<(() => void) | null>;

// Kutilayotgan goTo() promise'ini yopadi
function settle(pending: Pending) {
  pending.current?.();
  pending.current = null;
}

/**
 * Videoni "kamera" sifatida boshqaradi: goTo(t) kamerani t soniyaga silliq olib boradi.
 * - Oldinga: native play() + playbackRate (manzilga yaqinlashganda sekinlashadi).
 * - Orqaga: brauzer teskari o'ynata olmaydi, shuning uchun har kadrda seek qilamiz.
 */
export function useCamera(ref: RefObject<HTMLVideoElement | null>) {
  const raf = useRef(0);
  const pending = useRef<(() => void) | null>(null);

  const goTo = useCallback(
    (target: number, maxRate = 3) =>
      new Promise<void>((resolve) => {
        const v = ref.current;
        if (!v) return resolve();
        cancelAnimationFrame(raf.current);
        settle(pending); // oldingi harakat yangisi bilan almashtirildi
        pending.current = resolve;

        const tick = () => {
          const diff = target - v.currentTime;
          if (Math.abs(diff) < 0.03) {
            v.pause();
            v.currentTime = target;
            return settle(pending);
          }
          if (diff > 0) {
            v.playbackRate = Math.min(maxRate, Math.max(0.5, diff * 3)); // ease-out
            if (v.paused) v.play().catch(() => {});
          } else {
            if (!v.paused) v.pause();
            // oldingi seek tugamaguncha yangisini yubormaymiz — aks holda navbat to'planib qotadi
            if (!v.seeking) v.currentTime = Math.max(target, v.currentTime - Math.min(0.12, Math.max(0.03, -diff * 0.15)));
          }
          raf.current = requestAnimationFrame(tick);
        };
        tick();
      }),
    [ref],
  );

  const jump = useCallback(
    (t: number) => {
      cancelAnimationFrame(raf.current);
      settle(pending);
      const v = ref.current;
      if (v) {
        v.pause();
        v.currentTime = t;
      }
    },
    [ref],
  );

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return { goTo, jump };
}
