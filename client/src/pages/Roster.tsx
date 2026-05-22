import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from '@dnd-kit/core';
import { RefreshCw, Plus, Edit2, Trash2, Users } from 'lucide-react';
import { membersAPI } from '@/lib/api';
import { getClassColor } from '@/lib/utils';
import type { Member } from '@/types';

export default function Roster() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await membersAPI.getAll();
      setMembers(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load roster');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const syncRoster = async () => {
    try {
      setSyncing(true);
      await membersAPI.sync();
      await loadMembers();
      alert('Roster synced successfully!');
    } catch (err) {
      alert('Failed to sync roster from Blizzard API');
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const deleteMember = async (id: number) => {
    if (!confirm('Are you sure you want to delete this member?')) return;
    
    try {
      await membersAPI.delete(id);
      await loadMembers();
    } catch (err) {
      alert('Failed to delete member');
      console.error(err);
    }
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const memberId = parseInt(active.id.toString().replace('member-', ''));
    const dropZone = over.id.toString();

    let newStatus: 'main' | 'bench' | null = null;
    if (dropZone === 'main-roster') {
      newStatus = 'main';
    } else if (dropZone === 'bench-roster') {
      newStatus = 'bench';
    } else if (dropZone === 'unassigned') {
      newStatus = null;
    }

    // Update member raid_status
    const member = members.find(m => m.id === memberId);
    if (member && member.raid_status !== newStatus) {
      try {
        await membersAPI.update(memberId, { ...member, raid_status: newStatus });
        await loadMembers();
      } catch (err) {
        console.error('Failed to update member status', err);
      }
    }
  };

  const unassignedMembers = members.filter(m => !m.raid_status);
  const mainRoster = members.filter(m => m.raid_status === 'main');
  const benchRoster = members.filter(m => m.raid_status === 'bench');

  if (loading) {
    return <div className="text-center py-8">Loading roster...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Guild Roster</h2>
          <div className="flex gap-2">
            <button
              onClick={syncRoster}
              disabled={syncing}
              className="btn btn-secondary flex items-center gap-2"
            >
              <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync from Blizzard'}
            </button>
            <button
              onClick={() => {
                setEditingMember(null);
                setShowForm(true);
              }}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              Add Member
            </button>
          </div>
        </div>

        {showForm && (
          <MemberForm
            member={editingMember}
            onClose={() => {
              setShowForm(false);
              setEditingMember(null);
            }}
            onSave={() => {
              setShowForm(false);
              setEditingMember(null);
              loadMembers();
            }}
          />
        )}

        {members.length === 0 && (
          <div className="card text-center py-8 text-gray-400">
            No members found. Click "Sync from Blizzard" to import your guild roster.
          </div>
        )}

        {/* Drag and Drop Roster Management */}
        {members.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {/* Unassigned Members */}
            <RosterSection
              id="unassigned"
              title="Available Members"
              members={unassignedMembers}
              emptyMessage="All members assigned to Main or Bench"
            />

            {/* Main Raid Roster */}
            <RosterSection
              id="main-roster"
              title="Main Raid Roster"
              members={mainRoster}
              emptyMessage="Drag members here to add to main roster"
              highlight="blue"
            />

            {/* Bench */}
            <RosterSection
              id="bench-roster"
              title="Bench"
              members={benchRoster}
              emptyMessage="Drag members here to add to bench"
              highlight="yellow"
            />
          </div>
        )}
      </div>
    </DndContext>
  );
}

function RosterSection({ 
  id, 
  title, 
  members, 
  emptyMessage,
  highlight 
}: { 
  id: string; 
  title: string; 
  members: Member[]; 
  emptyMessage: string;
  highlight?: 'blue' | 'yellow';
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const borderColor = isOver 
    ? 'border-green-500' 
    : highlight === 'blue' 
    ? 'border-blue-500' 
    : highlight === 'yellow'
    ? 'border-yellow-500'
    : 'border-gray-700';

  return (
    <div className="card flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Users size={18} />
        <h3 className="text-lg font-bold">{title}</h3>
        <span className="text-sm text-gray-400">({members.length})</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 border-2 ${borderColor} rounded-lg p-4 transition-colors overflow-y-auto`}
        style={{ maxHeight: 'calc(100vh - 250px)' }}
      >
        {members.length === 0 ? (
          <div className="text-center text-gray-500 py-8">{emptyMessage}</div>
        ) : (
          <div className="space-y-2">
            {members.map(member => (
              <DraggableMember key={member.id} member={member} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableMember({ member }: { member: Member }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `member-${member.id}`,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-gray-750 p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium" style={{ color: getClassColor(member.class) }}>
            {member.name}
          </div>
          <div className="text-sm text-gray-400">{member.class}</div>
        </div>
        <div className="text-right">
          {member.level && <div className="text-sm text-gray-400">Lvl {member.level}</div>}
          {member.ilvl && <div className="text-sm text-gray-300">ilvl {member.ilvl}</div>}
        </div>
      </div>
    </div>
  );
}

function MemberForm({ member, onClose, onSave }: { 
  member: Member | null; 
  onClose: () => void; 
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: member?.name || '',
    class: member?.class || 'Warrior',
    rank: member?.rank || '0',
    level: member?.level?.toString() || '',
    ilvl: member?.ilvl?.toString() || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        level: formData.level ? parseInt(formData.level) : undefined,
        ilvl: formData.ilvl ? parseInt(formData.ilvl) : undefined,
      };

      if (member) {
        await membersAPI.update(member.id, data);
      } else {
        await membersAPI.create(data);
      }
      onSave();
    } catch (err) {
      alert('Failed to save member');
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="card max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">
          {member ? 'Edit Member' : 'Add Member'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Class</label>
            <select
              className="input"
              value={formData.class}
              onChange={(e) => setFormData({ ...formData, class: e.target.value })}
              required
            >
              {['Warrior', 'Paladin', 'Hunter', 'Rogue', 'Priest', 'Death Knight', 'Shaman', 'Mage', 'Warlock', 'Monk', 'Druid', 'Demon Hunter', 'Evoker'].map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Rank</label>
            <input
              type="text"
              className="input"
              value={formData.rank}
              onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Level</label>
            <input
              type="number"
              className="input"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              placeholder="Character level (e.g., 80)"
            />
          </div>
          <div>
            <label className="label">Item Level</label>
            <input
              type="number"
              className="input"
              value={formData.ilvl}
              onChange={(e) => setFormData({ ...formData, ilvl: e.target.value })}
              placeholder="Item level (e.g., 283)"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
