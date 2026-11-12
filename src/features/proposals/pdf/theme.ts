import { Font, StyleSheet } from "@react-pdf/renderer";

// react-pdf 4.9 quirks:
// - lineHeight does not inherit reliably, so every text style sets its own.
// - Any lineHeight on the page, or on a render-prop Text, silently drops that
//   dynamic text (the page number). Keep both free of lineHeight.

export const PDF_COLORS = {
  ink: "#171717",
  muted: "#6B6B6B",
  hairline: "#E4E4E4",
  band: "#F6F6F6",
  accent: "#FFD21E",
  gap: "#FFF1B8",
  gapInk: "#8A5A00",
};

let registered = false;

/** Fonts load from /public; Outfit has no ₹, so the sign comes from a one-glyph Noto Sans subset. */
export function registerPdfFonts(origin: string) {
  if (registered) return;
  registered = true;
  Font.register({
    family: "Outfit",
    fonts: [400, 500, 600, 700].map((fontWeight) => ({
      src: `${origin}/fonts/pdf/Outfit-${fontWeight}.ttf`,
      fontWeight,
    })),
  });
  Font.register({
    family: "Rupee",
    fonts: [400, 700].map((fontWeight) => ({
      src: `${origin}/fonts/pdf/NotoSansRupee-${fontWeight}.ttf`,
      fontWeight,
    })),
  });
  Font.registerHyphenationCallback(breakLongWord);
}

/** Words up to this length never break, so names, amounts and ordinary words stay whole. */
export const MAX_UNBROKEN_WORD = 18;

/**
 * Break points react-pdf may use inside a word. Ordinary words get none. A
 * longer one (a URL, email, handle or unspaced text) is split into chunks so it
 * wraps inside its column instead of overflowing it; react-pdf adds a hyphen
 * at the break.
 */
export function breakLongWord(word: string): string[] {
  if (word.length <= MAX_UNBROKEN_WORD) return [word];
  const chunks: string[] = [];
  for (let i = 0; i < word.length; i += 8) chunks.push(word.slice(i, i + 8));
  return chunks;
}

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: "Outfit",
    fontSize: 9.5,
    color: PDF_COLORS.ink,
    paddingTop: 36,
    paddingBottom: 56,
    paddingHorizontal: 44,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
  headerNumber: { fontSize: 9, lineHeight: 1.2, color: PDF_COLORS.muted },
  eyebrow: { fontSize: 7.5, lineHeight: 1.2, letterSpacing: 1.2, fontWeight: 600, color: PDF_COLORS.muted },
  title: { fontSize: 20, lineHeight: 1.2, fontWeight: 600 },
  subtitle: { fontSize: 9.5, lineHeight: 1.4, color: PDF_COLORS.muted, marginTop: 3 },
  titleBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: PDF_COLORS.hairline,
    marginBottom: 16,
  },
  titleMain: { flex: 1 },
  titleMeta: { width: 150, gap: 3 },
  metaLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  metaLabel: { fontSize: 8, lineHeight: 1.4, color: PDF_COLORS.muted },
  metaValue: { fontSize: 9, lineHeight: 1.4, fontWeight: 500, textAlign: "right" },
  // Sits directly under TitleBlock and reuses its bottom hairline as its top edge.
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
    marginTop: -16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: PDF_COLORS.hairline,
    marginBottom: 18,
  },
  infoLabel: { fontSize: 7.5, lineHeight: 1.3, letterSpacing: 1, fontWeight: 600, color: PDF_COLORS.muted },
  infoValue: { fontSize: 9.5, lineHeight: 1.4, fontWeight: 500, marginTop: 3 },
  parties: { flexDirection: "row", gap: 24, marginBottom: 18 },
  party: { flex: 1 },
  partyName: { fontSize: 10, lineHeight: 1.4, fontWeight: 600, marginTop: 4 },
  partyLine: { fontSize: 9, lineHeight: 1.45, color: PDF_COLORS.muted },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 11, lineHeight: 1.3, fontWeight: 600, marginBottom: 5 },
  body: { fontSize: 9.5, lineHeight: 1.45 },
  small: { fontSize: 8.5, lineHeight: 1.4, color: PDF_COLORS.muted },
  strong: { fontWeight: 600 },
  bulletRow: { flexDirection: "row", gap: 6, marginBottom: 2 },
  bullet: { fontSize: 9.5, lineHeight: 1.45, width: 8 },
  bulletText: { flex: 1, fontSize: 9.5, lineHeight: 1.45 },
  // No border on the container: a bordered parent holding an unbreakable first
  // group mis-places the rows after it when that group moves to the next page.
  tableGroup: { marginBottom: 6 },
  table: { borderTopWidth: 1, borderColor: PDF_COLORS.hairline, marginBottom: 6 },
  tableHead: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: PDF_COLORS.hairline,
    backgroundColor: PDF_COLORS.band,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderColor: PDF_COLORS.hairline,
  },
  tableTotal: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 6 },
  th: { fontSize: 8, lineHeight: 1.3, fontWeight: 600, color: PDF_COLORS.muted },
  td: { fontSize: 9.5, lineHeight: 1.4 },
  gap: { backgroundColor: PDF_COLORS.gap, color: PDF_COLORS.gapInk },
  // marginTop "auto" takes up the free space on the last page; paddingTop is the
  // minimum gap from the content above.
  signOff: { marginTop: "auto", paddingTop: 16 },
  signatures: { flexDirection: "row", gap: 24, marginTop: 10 },
  signature: { flex: 1, borderTopWidth: 1, borderColor: PDF_COLORS.hairline, paddingTop: 6 },
  signatureLine: { fontSize: 9, lineHeight: 1.9 },
  // Absolute, page-level text: react-pdf skips render-prop Text nested in a fixed View.
  footerText: { position: "absolute", bottom: 26, fontSize: 8, color: PDF_COLORS.muted },
});
