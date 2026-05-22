export interface Member {
  id: number;
  name: string;
  class: string;
  spec?: string;
  rank: string;
  role: string;
  level?: number;
  ilvl?: number;
  raid_status?: 'main' | 'bench' | null;
  last_updated?: string;
}

export interface RaidEvent {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  description?: string;
  created_at?: string;
}

export interface Absence {
  id: number;
  member_id: number;
  member_name?: string;
  class?: string;
  rank?: string;
  start_date: string;
  end_date: string;
  reason?: string;
  created_at?: string;
}

export interface BossAssignment {
  id: number;
  week_start: string;
  boss_name: string;
  member_id: number;
  name?: string;
  class?: string;
  spec?: string;
  role?: string;
  position: number;
  created_at?: string;
}

export interface FightPreference {
  id: number;
  member_id: number;
  name?: string;
  class?: string;
  spec?: string;
  role?: string;
  boss_name: string;
  reason: string;
  priority: 'high' | 'normal' | 'low';
  created_at?: string;
}

export interface BossRoster {
  [bossName: string]: BossAssignment[];
}
