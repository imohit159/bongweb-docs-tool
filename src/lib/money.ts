// Money is always whole paise (integer). ₹1 = 100 paise.

const ONES = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function belowHundred(n: number): string {
  if (n < 20) return ONES[n];
  const tens = TENS[Math.floor(n / 10)];
  return n % 10 ? `${tens}-${ONES[n % 10]}` : tens;
}

function belowThousand(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundreds) parts.push(`${ONES[hundreds]} hundred`);
  if (rest) parts.push(belowHundred(rest));
  return parts.join(" ");
}

/** Indian numbering: crore, lakh, thousand. */
export function integerToWords(n: number): string {
  if (!Number.isSafeInteger(n) || n < 0) throw new RangeError("expected a non-negative safe integer");
  if (n === 0) return "zero";
  const crore = Math.floor(n / 10_000_000);
  const lakh = Math.floor((n % 10_000_000) / 100_000);
  const thousand = Math.floor((n % 100_000) / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (crore) parts.push(`${integerToWords(crore)} crore`);
  if (lakh) parts.push(`${belowHundred(lakh)} lakh`);
  if (thousand) parts.push(`${belowHundred(thousand)} thousand`);
  if (rest) parts.push(belowThousand(rest));
  return parts.join(" ");
}

/** "Rupees eighteen thousand only", "Rupees ten and fifty paise only". */
export function amountInWords(paise: number): string {
  if (!Number.isSafeInteger(paise) || paise < 0) throw new RangeError("expected non-negative whole paise");
  const rupees = Math.floor(paise / 100);
  const rest = paise % 100;
  const words = `Rupees ${integerToWords(rupees)}${rest ? ` and ${integerToWords(rest)} paise` : ""} only`;
  return words;
}

const inrWhole = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const inrPaise = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 1800000 → "18,000"; 1050 → "10.50". No currency sign. */
export function formatAmount(paise: number): string {
  return paise % 100 === 0 ? inrWhole.format(paise / 100) : inrPaise.format(paise / 100);
}

/** "₹18,000". */
export function formatInr(paise: number): string {
  return `₹${formatAmount(paise)}`;
}

/** Splits a total by whole percentages; the last part takes the rounding remainder so parts always sum to the total. */
export function splitByPercent(totalPaise: number, percents: readonly number[]): number[] {
  if (percents.reduce((a, b) => a + b, 0) !== 100) throw new RangeError("percentages must sum to 100");
  const parts = percents.map((p) => Math.floor((totalPaise * p) / 100));
  parts[parts.length - 1] += totalPaise - parts.reduce((a, b) => a + b, 0);
  return parts;
}

/** Line amount in paise; qty may be fractional (e.g. 1.5 days), rounded to the nearest paisa. */
export function lineAmount(qty: number, ratePaise: number): number {
  return Math.round(qty * ratePaise);
}
