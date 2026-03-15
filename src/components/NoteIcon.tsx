/**
 * NoteIcon — maps common fragrance note names to an emoji badge.
 * Returns null if no mapping exists (renders nothing, no wasted space).
 */

const NOTE_MAP: Record<string, string> = {
  // Florals
  rose: "🌹",
  "rose absolute": "🌹",
  jasmine: "🌸",
  lavender: "💜",
  violet: "🌸",
  iris: "💐",
  peony: "🌺",
  geranium: "🌿",
  lily: "🌷",
  orchid: "🌸",
  "ylang-ylang": "🌼",
  ylang: "🌼",
  magnolia: "🌸",
  tuberose: "🌺",
  carnation: "🌸",
  // Citrus
  bergamot: "🍋",
  lemon: "🍋",
  orange: "🍊",
  grapefruit: "🍊",
  mandarin: "🍊",
  lime: "🍈",
  neroli: "🌸",
  yuzu: "🍋",
  tangerine: "🍊",
  "blood orange": "🍊",
  // Woods & Resins
  cedar: "🌲",
  "white cedar": "🌲",
  cedarwood: "🌲",
  sandalwood: "🪵",
  oud: "🪵",
  "agarwood": "🪵",
  vetiver: "🌾",
  patchouli: "🍃",
  oakmoss: "🌿",
  pine: "🌲",
  fir: "🌲",
  birch: "🌿",
  guaiac: "🪵",
  frankincense: "🕯️",
  myrrh: "🕯️",
  benzoin: "🪨",
  labdanum: "🟠",
  elemi: "🌿",
  // Amber & Musks
  vanilla: "🍦",
  amber: "🟡",
  musk: "🐚",
  "white musk": "🐚",
  "clean musk": "🐚",
  ambergris: "🐚",
  tonka: "🫘",
  "tonka bean": "🫘",
  coumarin: "🫘",
  caramel: "🍯",
  honey: "🍯",
  // Spices
  pepper: "🌶️",
  "black pepper": "🌶️",
  "pink pepper": "🌶️",
  cardamom: "✨",
  cinnamon: "🫙",
  ginger: "🫚",
  clove: "🌶️",
  nutmeg: "🪨",
  saffron: "🌼",
  cumin: "🫙",
  // Fruits
  apple: "🍎",
  peach: "🍑",
  pear: "🍐",
  plum: "🫐",
  raspberry: "🫐",
  blackberry: "🫐",
  cherry: "🍒",
  fig: "🫐",
  lychee: "🍒",
  blackcurrant: "🫐",
  melon: "🍈",
  // Aquatic & Fresh
  "sea salt": "🌊",
  water: "💧",
  aquatic: "🌊",
  marine: "🌊",
  ozonic: "💨",
  "green tea": "🍵",
  tea: "🍵",
  mint: "🌿",
  basil: "🌿",
  // Gourmand & Sweet
  coffee: "☕",
  chocolate: "🍫",
  almond: "🌰",
  // Dark & Smoky
  leather: "🟤",
  tobacco: "🚬",
  smoke: "💨",
  incense: "🕯️",
  // Special
  "iso e super": "✨",
  orris: "💐",
  heliotrope: "🌸",
  aldehyde: "✨",
  aldehydes: "✨",
};

interface NoteIconProps {
  note: string;
  className?: string;
}

export function NoteIcon({ note, className = "" }: NoteIconProps) {
  const lower = note.toLowerCase();

  let emoji = NOTE_MAP[lower];

  if (!emoji) {
    for (const [key, val] of Object.entries(NOTE_MAP)) {
      if (lower.includes(key)) {
        emoji = val;
        break;
      }
    }
  }

  if (!emoji) return null;
  return <span className={`leading-none ${className}`}>{emoji}</span>;
}
