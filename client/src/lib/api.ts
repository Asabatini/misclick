import axios from 'axios';
import type { Member, RaidEvent, Absence, BossAssignment, FightPreference, BossRoster } from '@/types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Members API
export const membersAPI = {
  getAll: () => api.get<Member[]>('/members'),
  getOne: (id: number) => api.get<Member>(`/members/${id}`),
  create: (data: Partial<Member>) => api.post<Member>('/members', data),
  update: (id: number, data: Partial<Member>) => api.put<Member>(`/members/${id}`, data),
  delete: (id: number) => api.delete(`/members/${id}`),
  sync: () => api.post('/members/sync'),
};

// Events API
export const eventsAPI = {
  getAll: () => api.get<RaidEvent[]>('/events'),
  getRange: (start: string, end: string) => api.get<RaidEvent[]>(`/events/range?start=${start}&end=${end}`),
  create: (data: Partial<RaidEvent>) => api.post<RaidEvent>('/events', data),
  update: (id: number, data: Partial<RaidEvent>) => api.put<RaidEvent>(`/events/${id}`, data),
  delete: (id: number) => api.delete(`/events/${id}`),
};

// Absences API
export const absencesAPI = {
  getAll: () => api.get<Absence[]>('/absences'),
  getByMember: (memberId: number) => api.get<Absence[]>(`/absences/member/${memberId}`),
  getRange: (start: string, end: string) => api.get<Absence[]>(`/absences/range?start=${start}&end=${end}`),
  create: (data: Partial<Absence>) => api.post<Absence>('/absences', data),
  update: (id: number, data: Partial<Absence>) => api.put<Absence>(`/absences/${id}`, data),
  delete: (id: number) => api.delete(`/absences/${id}`),
};

// Boss Assignments API
export const bossAssignmentsAPI = {
  getAll: () => api.get<BossAssignment[]>('/boss-assignments'),
  getWeek: (weekStart: string) => api.get<BossRoster>(`/boss-assignments/week/${weekStart}`),
  saveWeek: (weekStart: string, assignments: Array<{ boss_name: string; member_id: number; position: number; role: string }>) => 
    api.post(`/boss-assignments/week/${weekStart}`, { assignments }),
  clearBoss: (weekStart: string, bossName: string) => 
    api.delete(`/boss-assignments/week/${weekStart}/boss/${encodeURIComponent(bossName)}`),
  update: (id: number, data: Partial<BossAssignment>) => api.put<BossAssignment>(`/boss-assignments/${id}`, data),
  delete: (id: number) => api.delete(`/boss-assignments/${id}`),
};

// Fight Preferences API
export const fightPreferencesAPI = {
  getAll: () => api.get<FightPreference[]>('/fight-preferences'),
  getByMember: (memberId: number) => api.get<FightPreference[]>(`/fight-preferences/member/${memberId}`),
  getByBoss: (bossName: string) => api.get<FightPreference[]>(`/fight-preferences/boss/${bossName}`),
  create: (data: Partial<FightPreference>) => api.post<FightPreference>('/fight-preferences', data),
  update: (id: number, data: Partial<FightPreference>) => api.put<FightPreference>(`/fight-preferences/${id}`, data),
  delete: (id: number) => api.delete(`/fight-preferences/${id}`),
};

// Boss Kills API
interface BossKill {
  id: number;
  boss_name: string;
  kill_date: string;
  screenshot_url?: string;
  created_at: string;
}

export const bossKillsAPI = {
  getAll: () => api.get<BossKill[]>('/boss-kills'),
  getOne: (id: number) => api.get<BossKill>(`/boss-kills/${id}`),
  create: (data: { boss_name: string; kill_date: string; screenshot_url?: string }) => 
    api.post<BossKill>('/boss-kills', data),
  update: (id: number, data: Partial<BossKill>) => api.put<BossKill>(`/boss-kills/${id}`, data),
  delete: (id: number) => api.delete(`/boss-kills/${id}`),
};

export default api;
