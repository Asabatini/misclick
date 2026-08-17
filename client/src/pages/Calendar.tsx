import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { eventsAPI, absencesAPI, membersAPI } from '@/lib/api';
import type { RaidEvent, Absence, Member } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isInRange(date: string, start: string, end: string): boolean {
  return date >= start.slice(0, 10) && date <= end.slice(0, 10);
}

export default function Calendar() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<RaidEvent[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [prefillDate, setPrefillDate] = useState('');
  const { canEditBossAssignments, canAddAbsencesPreferences } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsRes, absencesRes, membersRes] = await Promise.all([
        eventsAPI.getAll(),
        absencesAPI.getAll(),
        membersAPI.getAll(),
      ]);
      setEvents(eventsRes.data);
      setAbsences(absencesRes.data);
      setMembers(membersRes.data);
    } catch (err) {
      console.error('Failed to load calendar data', err);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else { setViewMonth(m => m - 1); }
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else { setViewMonth(m => m + 1); }
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  const handleDayClick = (dateStr: string) => {
    if (!canAddAbsencesPreferences) return;
    setPrefillDate(dateStr);
    setShowAbsenceForm(true);
  };

  const deleteAbsence = async (id: number) => {
    if (!confirm('Delete this absence?')) return;
    try {
      await absencesAPI.delete(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteEvent = async (id: number) => {
    if (!confirm('Delete this event?')) return;
    try {
      await eventsAPI.delete(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const todayStr = toISO(today.getFullYear(), today.getMonth(), today.getDate());

  const calendarCells = useMemo(() => {
    const cells: Array<{ date: string | null; day: number | null }> = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push({ date: null, day: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: toISO(viewYear, viewMonth, d), day: d });
    }
    return cells;
  }, [viewYear, viewMonth, daysInMonth, firstDayOfMonth]);

  if (loading) {
    return <div className="text-center py-8">Loading calendar...</div>;
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Calendar</h2>
          <p className="text-gray-400">Raid schedule and member absences</p>
        </div>
        <div className="flex gap-2">
          {canEditBossAssignments && (
            <button
              onClick={() => { setPrefillDate(''); setShowEventForm(true); }}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Plus size={18} />
              Add Event
            </button>
          )}
          {canAddAbsencesPreferences && (
            <button
              onClick={() => { setPrefillDate(''); setShowAbsenceForm(true); }}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              Report Absence
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-gray-400">Raid Event</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-500" />
          <span className="text-gray-400">Absence</span>
        </div>
        {canAddAbsencesPreferences && (
          <span className="text-gray-500 text-xs self-center ml-1">Click a day to pre-fill the date</span>
        )}
      </div>

      {/* Calendar Card */}
      <div className="card overflow-hidden">
        {/* Month Navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <button
            onClick={prevMonth}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold">{MONTHS[viewMonth]} {viewYear}</h3>
            <button
              onClick={goToToday}
              className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-gray-300"
            >
              Today
            </button>
          </div>
          <button
            onClick={nextMonth}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day-of-week Headers */}
        <div className="grid grid-cols-7 border-b border-gray-700">
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarCells.map((cell, idx) => {
            if (!cell.date) {
              return (
                <div
                  key={`pad-${idx}`}
                  className="min-h-[6rem] border-b border-r border-gray-700/40 bg-gray-900/20"
                />
              );
            }

            const dayEvents = events.filter(e => isInRange(cell.date!, e.start_date, e.end_date));
            const dayAbsences = absences.filter(a => isInRange(cell.date!, a.start_date, a.end_date));
            const isToday = cell.date === todayStr;

            return (
              <div
                key={cell.date}
                onClick={() => handleDayClick(cell.date!)}
                className={`min-h-[6rem] border-b border-r border-gray-700/40 p-1.5 transition-colors ${
                  canAddAbsencesPreferences ? 'cursor-pointer hover:bg-gray-700/20' : ''
                } ${isToday ? 'bg-blue-900/10' : ''}`}
              >
                {/* Day Number */}
                <div
                  className={`text-sm font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-blue-500 text-white' : 'text-gray-300'
                  }`}
                >
                  {cell.day}
                </div>

                {/* Events */}
                <div className="space-y-0.5">
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      className="flex items-center gap-1 text-xs bg-blue-600/80 text-white rounded px-1.5 py-0.5"
                      title={event.description ?? event.title}
                    >
                      <span className="truncate flex-1">{event.title}</span>
                      {canEditBossAssignments && (
                        <button
                          onClick={e => { e.stopPropagation(); deleteEvent(event.id); }}
                          className="flex-shrink-0 hover:text-red-300 transition-colors"
                          title="Remove event"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Absences */}
                  {dayAbsences.map(absence => (
                    <div
                      key={absence.id}
                      className="flex items-center gap-1 text-xs bg-orange-600/60 text-orange-200 rounded px-1.5 py-0.5"
                      title={absence.reason ? `${absence.member_name}: ${absence.reason}` : absence.member_name}
                    >
                      <span className="truncate flex-1">{absence.member_name}</span>
                      {canEditBossAssignments && (
                        <button
                          onClick={e => { e.stopPropagation(); deleteAbsence(absence.id); }}
                          className="flex-shrink-0 hover:text-red-300 transition-colors"
                          title="Remove absence"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Absence Form Modal */}
      {showAbsenceForm && (
        <AbsenceForm
          members={members}
          prefillDate={prefillDate}
          onClose={() => setShowAbsenceForm(false)}
          onSave={() => { setShowAbsenceForm(false); loadData(); }}
        />
      )}

      {/* Event Form Modal */}
      {showEventForm && (
        <EventForm
          prefillDate={prefillDate}
          onClose={() => setShowEventForm(false)}
          onSave={() => { setShowEventForm(false); loadData(); }}
        />
      )}
    </div>
  );
}

function EventForm({
  prefillDate,
  onClose,
  onSave,
}: {
  prefillDate: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    start_date: prefillDate,
    end_date: prefillDate,
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.start_date || !formData.end_date) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      await eventsAPI.create({
        title: formData.title,
        start_date: formData.start_date,
        end_date: formData.end_date,
        description: formData.description || undefined,
      });
      onSave();
    } catch (err) {
      alert('Failed to create event');
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="card max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Add Raid Event</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Raid Night"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date *</label>
              <input
                type="date"
                className="input"
                value={formData.start_date}
                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">End Date *</label>
              <input
                type="date"
                className="input"
                value={formData.end_date}
                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <input
              type="text"
              className="input"
              placeholder="Optional"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AbsenceForm({
  members,
  prefillDate,
  onClose,
  onSave,
}: {
  members: Member[];
  prefillDate: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    member_id: '',
    start_date: prefillDate,
    end_date: prefillDate,
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.member_id || !formData.start_date || !formData.end_date) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      await absencesAPI.create({
        member_id: parseInt(formData.member_id),
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason || undefined,
      });
      onSave();
    } catch (err) {
      alert('Failed to report absence');
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="card max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Report Absence</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Member *</label>
            <select
              className="input"
              value={formData.member_id}
              onChange={e => setFormData({ ...formData, member_id: e.target.value })}
              required
            >
              <option value="">Select a member</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.class}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date *</label>
              <input
                type="date"
                className="input"
                value={formData.start_date}
                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">End Date *</label>
              <input
                type="date"
                className="input"
                value={formData.end_date}
                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Reason</label>
            <input
              type="text"
              className="input"
              placeholder="Optional"
              value={formData.reason}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
