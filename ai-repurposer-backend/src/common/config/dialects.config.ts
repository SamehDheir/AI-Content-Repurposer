/**
 * Arabic is not one register. A post written in Modern Standard Arabic reads
 * like a news bulletin to someone scrolling in Cairo or Riyadh, which is the
 * fastest way to make generated content feel machine-made. So a job can name a
 * target country, and the writing prompt switches to that country's spoken
 * dialect.
 *
 * `markers` is the part that actually does the work. Llama 3.1 8B knows *of*
 * these dialects but drifts back to MSA within a paragraph unless it is handed
 * concrete words to reach for, so each profile lists the high-frequency
 * function words that a reader uses to place a text instantly: the question
 * words, "want", "now", "like this", the negator, the intensifier. They are
 * anchors, not a grammar — the model fills in the rest once the register is set.
 */
export interface DialectProfile {
  /** English name, used in the prompt. */
  country: string;
  /** Endonym, shown in the picker so the list reads natively. */
  countryAr: string;
  /** What speakers call the dialect. */
  dialect: string;
  /** Grouping for the picker's optgroups. */
  region: 'Egypt & Sudan' | 'Levant' | 'Gulf' | 'Iraq' | 'Maghreb' | 'Yemen';
  /** High-frequency words that place the text in this dialect. */
  markers: string;
  /** One line on how the country's social writing actually sounds. */
  register: string;
}

export const DIALECTS = {
  EG: {
    country: 'Egypt',
    countryAr: 'مصر',
    dialect: 'Egyptian Arabic (المصري)',
    region: 'Egypt & Sudan',
    markers: 'إزاي، عايز، دلوقتي، كده، مش، أوي، إيه، فين، ليه، عشان، حاجة، بص',
    register:
      'Light and quick, with a joke never far away. Cairo social media voice: talks to the reader directly, never lectures.',
  },
  SD: {
    country: 'Sudan',
    countryAr: 'السودان',
    dialect: 'Sudanese Arabic (السوداني)',
    region: 'Egypt & Sudan',
    markers: 'كيف، داير، هسع، كده، ما، خالص، شنو، وين، مالو، تمام، بتاع',
    register: 'Warm and unhurried, courteous, fond of understatement.',
  },
  SA: {
    country: 'Saudi Arabia',
    countryAr: 'السعودية',
    dialect: 'Saudi Arabic (الخليجي النجدي)',
    region: 'Gulf',
    markers: 'كيف، وش، أبغى، الحين، كذا، مو، مرة، وين، ليش، عشان، زين',
    register:
      'The register of Saudi X/Twitter: direct, dry, confident, short lines.',
  },
  AE: {
    country: 'United Arab Emirates',
    countryAr: 'الإمارات',
    dialect: 'Emirati Arabic (الإماراتي)',
    region: 'Gulf',
    markers: 'شحالك، شو، أبا، الحين، جذي، وايد، ما في، وين، ليش، عيل، خلاص',
    register: 'Relaxed and modern, comfortable mixing in a business term.',
  },
  KW: {
    country: 'Kuwait',
    countryAr: 'الكويت',
    dialect: 'Kuwaiti Arabic (الكويتي)',
    region: 'Gulf',
    markers: 'شلون، شنو، أبي، الحين، جذي، وايد، ماكو، وين، ليش، زين',
    register: 'Chatty and familiar, the tone of a voice note to a friend.',
  },
  QA: {
    country: 'Qatar',
    countryAr: 'قطر',
    dialect: 'Qatari Arabic (القطري)',
    region: 'Gulf',
    markers: 'شلونك، شنو، أبي، الحين، جذي، وايد، وين، ليش، زين، عاد',
    register: 'Measured and polite, close to Gulf standard.',
  },
  BH: {
    country: 'Bahrain',
    countryAr: 'البحرين',
    dialect: 'Bahraini Arabic (البحريني)',
    region: 'Gulf',
    markers: 'شلون، شنو، أبي، الحين، جذي، وايد، ماكو، وين، ليش، زين',
    register: 'Easy and sociable, quick to be playful.',
  },
  OM: {
    country: 'Oman',
    countryAr: 'عُمان',
    dialect: 'Omani Arabic (العُماني)',
    region: 'Gulf',
    markers: 'كيف حالك، إيش، أبغى، الحين، كذي، ما، وين، ليش، زين، صح',
    register: 'Calm and softly formal, unshowy.',
  },
  IQ: {
    country: 'Iraq',
    countryAr: 'العراق',
    dialect: 'Iraqi Arabic (العراقي)',
    region: 'Iraq',
    markers: 'شلون، شنو، أريد، هسه، هيچ، ماكو، هواي، وين، ليش، زين، اكو',
    register: 'Expressive and wry, warm, unafraid of a sharp line.',
  },
  JO: {
    country: 'Jordan',
    countryAr: 'الأردن',
    dialect: 'Jordanian Arabic (الأردني)',
    region: 'Levant',
    markers: 'كيف، شو، بدي، هسه، هيك، مش، كتير، وين، ليش، منيح، زلمة',
    register: 'Straightforward and friendly, practical.',
  },
  PS: {
    country: 'Palestine',
    countryAr: 'فلسطين',
    dialect: 'Palestinian Arabic (الفلسطيني)',
    region: 'Levant',
    markers: 'كيف، شو، بدي، هسا، هيك، مش، كتير، وين، ليش، منيح، يعني',
    register: 'Grounded and direct, plain-spoken, quietly warm.',
  },
  LB: {
    country: 'Lebanon',
    countryAr: 'لبنان',
    dialect: 'Lebanese Arabic (اللبناني)',
    region: 'Levant',
    markers: 'كيف، شو، بدي، هلق، هيك، مش، كتير، وين، ليش، منيح، كتير حلو',
    register: 'Fast and stylish, light on its feet, a touch of irony.',
  },
  SY: {
    country: 'Syria',
    countryAr: 'سوريا',
    dialect: 'Syrian Arabic (السوري)',
    region: 'Levant',
    markers: 'كيف، شو، بدي، هلق، هيك، مو، كتير، وين، ليش، منيح، تمام',
    register: 'Gentle and courteous, storytelling by habit.',
  },
  MA: {
    country: 'Morocco',
    countryAr: 'المغرب',
    dialect: 'Moroccan Darija (الدارجة المغربية)',
    region: 'Maghreb',
    markers: 'كيفاش، شنو، بغيت، دابا، هكاك، ماشي، بزاف، فين، علاش، مزيان، واخا',
    register:
      'Punchy and colloquial. A French loanword where a Moroccan would really use one, not as decoration.',
  },
  DZ: {
    country: 'Algeria',
    countryAr: 'الجزائر',
    dialect: 'Algerian Darja (الدارجة الجزائرية)',
    region: 'Maghreb',
    markers: 'كيفاش، واش، حاب، دروك، هكذا، ماشي، بزاف، وين، علاش، مليح، صح',
    register: 'Blunt and funny, no ceremony.',
  },
  TN: {
    country: 'Tunisia',
    countryAr: 'تونس',
    dialect: 'Tunisian Derja (الدارجة التونسية)',
    region: 'Maghreb',
    markers: 'كيفاش، شنوة، نحب، توا، هكة، موش، برشا، وين، علاش، باهي، ياسر',
    register: 'Quick and dry, understated humour.',
  },
  LY: {
    country: 'Libya',
    countryAr: 'ليبيا',
    dialect: 'Libyan Arabic (الليبي)',
    region: 'Maghreb',
    markers: 'كيف، شن، نبي، توا، هكي، مش، هلبا، وين، علاش، باهي، مليح',
    register: 'Plain and neighbourly, direct.',
  },
  YE: {
    country: 'Yemen',
    countryAr: 'اليمن',
    dialect: 'Yemeni Arabic (اليمني)',
    region: 'Yemen',
    markers: 'كيف، إيش، أشتي، دحين، كذا، ما، كثير، وين، ليش، زين، طيب',
    register: 'Courteous and deliberate, proverb-friendly.',
  },
} as const satisfies Record<string, DialectProfile>;

export type CountryCode = keyof typeof DIALECTS;

export const COUNTRY_CODES = Object.keys(DIALECTS) as CountryCode[];

export function getDialect(code?: string | null): DialectProfile | undefined {
  if (!code) return undefined;
  return DIALECTS[code as CountryCode];
}
