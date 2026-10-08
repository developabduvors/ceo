// Har bir bo'lim videodagi aniq soniyaga bog'langan — kamera shu nuqtaga "yuradi".
// Raqamlar (stats) hozircha namunaviy; backend tayyor bo'lgach API'dan olinadi.

// ?v= — video almashtirilganda brauzer keshi eski faylni bermasligi uchun
export const VIDEO = { sd: "/media/tour.mp4?v=9", hd: "/media/tour-hd.mp4?v=9" }; // gemini_generated_video_01110108.mp4: lanczos + yengil unsharp, AI yo'q

export type Stat = { value: string; label: string };
export type Service = { title: string; text: string };

export type Department = {
  slug: string;
  name: string;
  short: string;
  tagline: string;
  description: string;
  time: number; // videodagi to'xtash nuqtasi (soniya)
  focus: string; // tor ekranda kadrning qaysi qismi ko'rinsin (object-position x)
  accent: string;
  poster: string;
  stats: Stat[];
  services: Service[];
  process: string[];
};

// Qabulxona — "Kirish"dan keyin kamera to'xtaydigan joy
export const LOBBY = {
  name: "Qabulxona",
  time: 2.15,
  accent: "#e8d5b0",
  focus: "45%",
  poster: "/media/rooms/qabulxona.jpg",
};

export const DEPARTMENTS: Department[] = [
  {
    slug: "moliya",
    name: "Moliya",
    short: "Byudjet, hisob-kitob, tahlil",
    tagline: "Har bir so‘m — hisobda.",
    description:
      "Moliya bo‘limi kompaniyaning pul oqimlarini rejalashtiradi, nazorat qiladi va har oy rahbariyatga aniq hisobot taqdim etadi.",
    time: 3.6,
    accent: "#34d399",
    poster: "/media/rooms/moliya.jpg",
    focus: "42%",
    stats: [
      { value: "12.4 mlrd", label: "yillik aylanma, so‘m" },
      { value: "98.7%", label: "hisobot aniqligi" },
      { value: "24 soat", label: "to‘lovni tasdiqlash" },
    ],
    services: [
      { title: "Byudjetlashtirish", text: "Bo‘limlar kesimida yillik va choraklik byudjetlar, xarajat limitlari." },
      { title: "Buxgalteriya va soliq", text: "Birlamchi hujjatlar, soliq hisobotlari va audit bilan ishlash." },
      { title: "Moliyaviy tahlil", text: "Rentabellik, pul oqimi va KPI dashboardlari real vaqtda." },
      { title: "To‘lovlar nazorati", text: "Kontragentlar bilan hisob-kitob va debitorlik qarzlarini kuzatish." },
    ],
    process: ["Rejalash", "Hisobga olish", "Tahlil", "Hisobot"],
  },
  {
    slug: "marketing",
    name: "Marketing",
    short: "Brend, kontent, reklama",
    tagline: "Brendni bozorga olib chiqamiz.",
    description:
      "Marketing jamoasi brend ovozini yaratadi: fotosessiyalardan tortib reklama kampaniyalarigacha — hammasi bitta studiyada.",
    time: 5.0,
    accent: "#fb923c",
    poster: "/media/rooms/marketing.jpg",
    focus: "40%",
    stats: [
      { value: "+340%", label: "ijtimoiy tarmoq qamrovi" },
      { value: "1.2M", label: "oylik ko‘rishlar" },
      { value: "48", label: "faol kampaniya" },
    ],
    services: [
      { title: "Brend strategiyasi", text: "Pozitsiyalash, vizual identitet va kommunikatsiya qoidalari." },
      { title: "Kontent studiya", text: "Foto, video va dizayn — mahsulotlar uchun o‘z ishlab chiqarishimiz." },
      { title: "SMM va reklama", text: "Target, kontekst va influenser kampaniyalari, natijaga yo‘naltirilgan." },
      { title: "Bozor tadqiqoti", text: "Raqobatchilar tahlili, mijoz so‘rovnomalari va trendlar." },
    ],
    process: ["Tadqiqot", "G‘oya", "Ishlab chiqarish", "Tahlil"],
  },
  {
    slug: "hr",
    name: "HR",
    short: "Yollash, rivojlanish, madaniyat",
    tagline: "Eng katta kapital — odamlar.",
    description:
      "HR bo‘limi to‘g‘ri insonlarni topadi, ularni jamoaga qo‘shadi va har bir xodimning o‘sishi uchun sharoit yaratadi.",
    time: 7.0,
    accent: "#a78bfa",
    poster: "/media/rooms/hr.jpg",
    focus: "58%",
    stats: [
      { value: "120+", label: "xodimlar" },
      { value: "4.8 / 5", label: "xodimlar mamnuniyati" },
      { value: "14 kun", label: "o‘rtacha yollash muddati" },
    ],
    services: [
      { title: "Yollash va suhbat", text: "Vakansiyalar, nomzodlar bazasi va bosqichma-bosqich intervyular." },
      { title: "Onboarding", text: "Yangi xodim uchun birinchi 90 kunlik moslashuv dasturi." },
      { title: "O‘qitish va rivojlanish", text: "Treninglar, mentorlik va individual o‘sish rejalari." },
      { title: "Ish haqi va motivatsiya", text: "Grading tizimi, bonuslar va ijtimoiy paketlar." },
    ],
    process: ["Vakansiya", "Suhbat", "Onboarding", "Rivojlanish"],
  },
  {
    slug: "sklad",
    name: "Sklad",
    short: "Saqlash, qadoqlash, logistika",
    tagline: "Har bir quti — o‘z joyida.",
    description:
      "Sklad bo‘limi tovarlarni qabul qiladi, aniq manzil bo‘yicha saqlaydi va buyurtmalarni tez yig‘ib, mijozga jo‘natadi.",
    time: 9.3, // video 9.54s (HR'ga qayta sakrash kesilgan)
    accent: "#38bdf8",
    poster: "/media/rooms/sklad.jpg",
    focus: "50%",
    stats: [
      { value: "8 500+", label: "SKU pozitsiya" },
      { value: "99.2%", label: "inventar aniqligi" },
      { value: "2 soat", label: "buyurtma yig‘ish" },
    ],
    services: [
      { title: "Qabul qilish", text: "Yetkazib beruvchidan kelgan tovarni tekshirish va tizimga kiritish." },
      { title: "Saqlash va inventar", text: "Manzilli saqlash, muntazam inventarizatsiya va qoldiq nazorati." },
      { title: "Yig‘ish va qadoqlash", text: "Buyurtmalarni tez va xatosiz yig‘ish, xavfsiz qadoqlash." },
      { title: "Logistika", text: "Shahar va viloyatlarga yetkazib berish, kuryerlar bilan integratsiya." },
    ],
    process: ["Qabul", "Saqlash", "Yig‘ish", "Jo‘natish"],
  },
];

export const getDepartment = (slug: string) => DEPARTMENTS.find((d) => d.slug === slug);
