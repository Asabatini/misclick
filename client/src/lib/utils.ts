// Blizzard official class colors (hex codes)
export const WOW_CLASS_COLORS: Record<string, string> = {
  'Warrior': '#C69B6D',
  'Paladin': '#F48CBA',
  'Hunter': '#AAD372',
  'Rogue': '#FFF468',
  'Priest': '#FFFFFF',
  'Death Knight': '#C41E3A',
  'Shaman': '#0070DD',
  'Mage': '#3FC7EB',
  'Warlock': '#8788EE',
  'Monk': '#00FF98',
  'Druid': '#FF7C0A',
  'Demon Hunter': '#A330C9',
  'Evoker': '#33937F',
};

export function getClassColor(className: string): string {
  return WOW_CLASS_COLORS[className] || '#FFFFFF';
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export function getWeekEnd(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end.toISOString().split('T')[0];
}

// Midnight Season 2 — The Venomous Abyss raid bosses
export const VENOMOUS_ABYSS_BOSSES = [
  { name: "Nek'zali the Soulcoiler" },
  { name: 'Entombed Sentinels' },
  { name: 'Vashnik the Malignant' },
  { name: 'The Lost Explorers' },
  { name: 'Sszorak' },
  { name: 'The Twin Fangs' },
  { name: 'The Coiled Altar' },
  { name: "Ula'tek" },
];

// Legacy alias kept for any remaining references
export const MYTHIC_BOSSES = VENOMOUS_ABYSS_BOSSES;
