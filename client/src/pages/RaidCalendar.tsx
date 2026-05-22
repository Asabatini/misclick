import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { eventsAPI, absencesAPI } from '@/lib/api';
import type { RaidEvent, Absence } from '@/types';

export default function RaidCalendar() {
  const [events, setEvents] = useState<RaidEvent[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsRes, absencesRes] = await Promise.all([
        eventsAPI.getAll(),
        absencesAPI.getAll(),
      ]);
      setEvents(eventsRes.data);
      setAbsences(absencesRes.data);
    } catch (err) {
      console.error('Failed to load calendar data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (arg: any) => {
    const title = prompt('Enter raid event title:');
    if (title) {
      createEvent(title, arg.dateStr);
    }
  };

  const handleEventClick = (clickInfo: any) => {
    if (confirm(`Delete event '${clickInfo.event.title}'?`)) {
      deleteEvent(parseInt(clickInfo.event.id));
    }
  };

  const createEvent = async (title: string, date: string) => {
    try {
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59);
      
      await eventsAPI.create({
        title,
        start_date: date,
        end_date: endDate.toISOString(),
      });
      loadData();
    } catch (err) {
      alert('Failed to create event');
      console.error(err);
    }
  };

  const deleteEvent = async (id: number) => {
    try {
      await eventsAPI.delete(id);
      loadData();
    } catch (err) {
      alert('Failed to delete event');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading calendar...</div>;
  }

  const calendarEvents = [
    ...events.map(event => ({
      id: event.id.toString(),
      title: event.title,
      start: event.start_date,
      end: event.end_date,
      backgroundColor: '#2563eb',
      borderColor: '#1d4ed8',
    })),
    ...absences.map(absence => ({
      id: `absence-${absence.id}`,
      title: `${absence.member_name} - OUT`,
      start: absence.start_date,
      end: absence.end_date,
      backgroundColor: '#dc2626',
      borderColor: '#b91c1c',
    })),
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Raid Calendar</h2>
          <p className="text-gray-400">
            Click on a date to add a raid event. Red events indicate member absences.
          </p>
        </div>
        <button
          onClick={() => {
            const title = prompt('Enter raid event title:');
            const date = prompt('Enter date (YYYY-MM-DD):');
            if (title && date) {
              createEvent(title, date);
            }
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Add Event
        </button>
      </div>

      <div className="card">
        <div className="calendar-wrapper">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={calendarEvents}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek',
            }}
            height="auto"
            eventDisplay="block"
          />
        </div>
      </div>

      <style>{`
        .calendar-wrapper {
          --fc-border-color: #374151;
          --fc-button-bg-color: #4b5563;
          --fc-button-border-color: #374151;
          --fc-button-hover-bg-color: #6b7280;
          --fc-button-hover-border-color: #4b5563;
          --fc-button-active-bg-color: #374151;
          --fc-button-active-border-color: #1f2937;
          --fc-today-bg-color: rgba(59, 130, 246, 0.1);
        }
        
        .fc {
          color: #e5e7eb;
        }
        
        .fc .fc-button {
          text-transform: capitalize;
        }
        
        .fc-theme-standard td,
        .fc-theme-standard th {
          border-color: var(--fc-border-color);
        }
        
        .fc-day-today {
          background-color: var(--fc-today-bg-color) !important;
        }
        
        .fc-daygrid-day-number {
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}
