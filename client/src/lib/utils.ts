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

// Midnight Season 1 Raid Bosses with role requirements
export const MYTHIC_BOSSES = [
  { name: 'Chimaerus the Undreamt God', tanks: 2, healers: 5, dps: 13 },
  { name: 'Imperator Averzian', tanks: 2, healers: 5, dps: 13 },
  { name: 'Vorasius', tanks: 2, healers: 4, dps: 14 },
  { name: 'Fallen-King Salhadaar', tanks: 2, healers: 5, dps: 13 },
  { name: 'Vaelgor and Ezzorak', tanks: 2, healers: 5, dps: 13 },
  { name: 'Lightblinded Vanguard', tanks: 2, healers: 4, dps: 14 },
  { name: 'Crown of the Cosmos', tanks: 2, healers: 5, dps: 13 },
  { name: 'Belo\'ren, Child of A\'lar', tanks: 2, healers: 5, dps: 13 },
  { name: 'Midnight Falls', tanks: 2, healers: 5, dps: 13 },
];
