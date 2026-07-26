/**
 * The countries offered by the Arabic dialect picker.
 *
 * Display data only. The prompt-side profile for each country — the marker
 * vocabulary and register notes that actually steer the writing — lives in the
 * backend at `src/common/config/dialects.config.ts` and deliberately does not
 * ship to the browser. The backend is also the authority on which codes are
 * valid: if these two lists ever drift, `POST /jobs` rejects the unknown code
 * by name rather than silently writing the wrong dialect.
 */
export interface DialectOption {
  /** ISO-2 code, sent as `country`. */
  code: string;
  /** English name, for the picker face. */
  name: string;
  /** Endonym, so the list reads natively to the person choosing. */
  nameAr: string;
}

export const DIALECT_GROUPS: { region: string; options: DialectOption[] }[] = [
  {
    region: "Egypt & Sudan",
    options: [
      { code: "EG", name: "Egypt", nameAr: "مصر" },
      { code: "SD", name: "Sudan", nameAr: "السودان" },
    ],
  },
  {
    region: "Levant",
    options: [
      { code: "JO", name: "Jordan", nameAr: "الأردن" },
      { code: "PS", name: "Palestine", nameAr: "فلسطين" },
      { code: "LB", name: "Lebanon", nameAr: "لبنان" },
      { code: "SY", name: "Syria", nameAr: "سوريا" },
    ],
  },
  {
    region: "Gulf",
    options: [
      { code: "SA", name: "Saudi Arabia", nameAr: "السعودية" },
      { code: "AE", name: "United Arab Emirates", nameAr: "الإمارات" },
      { code: "KW", name: "Kuwait", nameAr: "الكويت" },
      { code: "QA", name: "Qatar", nameAr: "قطر" },
      { code: "BH", name: "Bahrain", nameAr: "البحرين" },
      { code: "OM", name: "Oman", nameAr: "عُمان" },
    ],
  },
  {
    region: "Iraq",
    options: [{ code: "IQ", name: "Iraq", nameAr: "العراق" }],
  },
  {
    region: "Maghreb",
    options: [
      { code: "MA", name: "Morocco", nameAr: "المغرب" },
      { code: "DZ", name: "Algeria", nameAr: "الجزائر" },
      { code: "TN", name: "Tunisia", nameAr: "تونس" },
      { code: "LY", name: "Libya", nameAr: "ليبيا" },
    ],
  },
  {
    region: "Yemen",
    options: [{ code: "YE", name: "Yemen", nameAr: "اليمن" }],
  },
];

const BY_CODE = new Map(
  DIALECT_GROUPS.flatMap((g) => g.options).map((o) => [o.code, o]),
);

export function dialectName(code?: string | null): string | undefined {
  return code ? BY_CODE.get(code)?.name : undefined;
}
