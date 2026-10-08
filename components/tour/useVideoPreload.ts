"use client";

import { useEffect, useState } from "react";

type Sources = { sd: string; hd: string };

// Sahifalar o'rtasida qayta yuklamaslik uchun modul darajasida saqlanadi.
// Kalit — video manzili: manzil (?v=) o'zgarsa eski blob qaytarilmaydi.
const cache = new Map<string, string>();

// Katta/retina ekranga HD, telefonga SD — trafikni tejash uchun
const pickUrl = (s: Sources) => (window.innerWidth * window.devicePixelRatio > 1300 ? s.hd : s.sd);

/** Videoni to'liq yuklab blob URL qiladi — seek tarmoqqa bog'liq bo'lmasligi uchun. */
export function useVideoPreload(sources: Sources) {
  // Serverda window yo'q -> null; sahifaga qaytilganda keshdagi blob darhol olinadi
  const [state, setState] = useState(() => {
    if (typeof window === "undefined") return { src: null as string | null, progress: 0 };
    const hit = cache.get(pickUrl(sources)) ?? null;
    return { src: hit, progress: hit ? 1 : 0 };
  });

  useEffect(() => {
    const url = pickUrl(sources);
    if (cache.has(url)) return; // boshlang'ich holatda allaqachon olingan
    const ctrl = new AbortController();

    (async () => {
      try {
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
        const total = Number(res.headers.get("content-length")) || 0;
        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let loaded = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          loaded += value.length;
          if (total) setState((s) => ({ ...s, progress: loaded / total }));
        }
        const blobUrl = URL.createObjectURL(new Blob(chunks as BlobPart[], { type: "video/mp4" }));
        cache.set(url, blobUrl);
        setState({ src: blobUrl, progress: 1 });
      } catch {
        if (ctrl.signal.aborted) return;
        setState({ src: url, progress: 1 }); // fallback: oddiy streaming
      }
    })();

    return () => ctrl.abort();
  }, [sources]); // VIDEO — modul darajasidagi o'zgarmas obyekt

  return { src: state.src, progress: state.progress };
}
