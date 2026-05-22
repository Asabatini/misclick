import { useState, useEffect, useRef } from 'react';
import { DndContext, DragEndEvent, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Save, ChevronLeft, ChevronRight, Copy, Clock, RefreshCw } from 'lucide-react';
import { bossAssignmentsAPI, membersAPI } from '@/lib/api';
import { getWeekStart, getWeekEnd, MYTHIC_BOSSES, getClassColor } from '@/lib/utils';
import type { Member, BossRoster } from '@/types';

export default function BossAssignments() {
  const [currentWeek, setCurrentWeek] = useState(getWeekStart());
  const [members, setMembers] = useState<Member[]>([]);
  const [assignments, setAssignments] = useState<BossRoster>({});
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadData();
  }, [currentWeek]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [membersRes, assignmentsRes] = await Promise.all([
        membersAPI.getAll(),
        bossAssignmentsAPI.getWeek(currentWeek),
      ]);
      setMembers(membersRes.data);
      setAssignments(assignmentsRes.data);
      updateAvailableMembers(membersRes.data);
    } catch (err) {
      console.error('Failed to load boss assignments', err);
    } finally {
      setLoading(false);
    }
  };

  const updateAvailableMembers = (allMembers: Member[]) => {
    // Keep all members available to allow multiple assignments
    setAvailableMembers(allMembers);
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      console.log('No drop target');
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();
    
    console.log('Drag ended:', { activeId, overId });

    // Check if dragging from available members to a boss role section
    if (overId.startsWith('boss-')) {
      // Parse: boss-{bossName}-{role}
      const parts = overId.replace('boss-', '').split('-role-');
      console.log('Drop zone parts:', parts);
      if (parts.length === 2) {
        const bossName = parts[0];
        const role = parts[1]; // 'tank', 'healer', or 'dps'
        const memberId = parseInt(activeId.replace('member-', ''));
        const member = members.find(m => m.id === memberId);
        
        console.log('Adding member to boss:', { bossName, role, memberId, member });
        if (member) {
          addMemberToBoss(bossName, member, role);
        }
      }
    }
    // Check if removing from boss back to available
    else if (overId === 'available' && activeId.startsWith('assigned-')) {
      const parts = activeId.replace('assigned-', '').split('-');
      if (parts.length >= 2) {
        const memberId = parseInt(parts[parts.length - 1]);
        const bossName = parts.slice(0, -1).join('-');
        console.log('Removing member from boss:', { bossName, memberId });
        removeMemberFromBoss(bossName, memberId);
      }
    } else {
      console.log('No matching drag/drop handler');
    }
  };

  const addMemberToBoss = (bossName: string, member: Member, role: string) => {
    setAssignments(prev => {
      const bossAssignments = prev[bossName] || [];
      const newAssignment = {
        id: Date.now(),
        week_start: currentWeek,
        boss_name: bossName,
        member_id: member.id,
        name: member.name,
        class: member.class,
        spec: member.spec,
        role: role, // Use the drop zone role
        position: bossAssignments.length,
      };
      return {
        ...prev,
        [bossName]: [...bossAssignments, newAssignment],
      };
    });
    // Keep member in available list for multiple assignments
  };

  const removeMemberFromBoss = (bossName: string, memberId: number) => {
    setAssignments(prev => ({
      ...prev,
      [bossName]: (prev[bossName] || []).filter(a => a.member_id !== memberId),
    }));
    // Member stays in available list since they're always available
  };

  const saveAssignments = async () => {
    try {
      const allAssignments = Object.entries(assignments).flatMap(([bossName, bossMembers]) =>
        bossMembers.map((member, index) => ({
          boss_name: bossName,
          member_id: member.member_id,
          position: index,
          role: member.role || 'dps', // Include the role (tank/healer/dps/bench) with default
        }))
      );

      await bossAssignmentsAPI.saveWeek(currentWeek, allAssignments);
      alert('Boss assignments saved successfully!');
    } catch (err) {
      alert('Failed to save boss assignments');
      console.error(err);
    }
  };

  const syncRoster = async () => {
    try {
      setSyncing(true);
      await membersAPI.sync();
      await loadData();
      alert('Roster synced successfully from Blizzard!');
    } catch (err) {
      alert('Failed to sync roster from Blizzard API');
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const clearBossRoster = async (bossName: string) => {
    if (!confirm(`Clear all assignments for ${bossName}?`)) {
      return;
    }
    
    try {
      await bossAssignmentsAPI.clearBoss(currentWeek, bossName);
      setAssignments(prev => ({
        ...prev,
        [bossName]: [],
      }));
      alert(`Roster for ${bossName} cleared successfully!`);
    } catch (err) {
      alert(`Failed to clear roster for ${bossName}`);
      console.error(err);
    }
  };

  const copyBossRoster = (fromBoss: string, toBoss: string) => {
    const sourceAssignments = assignments[fromBoss] || [];
    if (sourceAssignments.length === 0) {
      alert(`${fromBoss} has no assignments to copy`);
      return;
    }

    const copiedAssignments = sourceAssignments.map(assignment => ({
      ...assignment,
      id: Date.now() + Math.random(), // New unique ID
      boss_name: toBoss,
    }));

    setAssignments(prev => ({
      ...prev,
      [toBoss]: copiedAssignments,
    }));
    alert(`Copied roster from ${fromBoss} to ${toBoss}`);
  };

  const copyFromLastWeek = async (bossName: string) => {
    try {
      const lastWeekDate = new Date(currentWeek);
      lastWeekDate.setDate(lastWeekDate.getDate() - 7);
      const lastWeek = getWeekStart(lastWeekDate);

      const lastWeekData = await bossAssignmentsAPI.getWeek(lastWeek);
      const lastWeekBossAssignments = lastWeekData.data[bossName] || [];

      if (lastWeekBossAssignments.length === 0) {
        alert(`${bossName} had no assignments last week`);
        return;
      }

      const copiedAssignments = lastWeekBossAssignments.map((assignment: any) => ({
        ...assignment,
        id: Date.now() + Math.random(),
        week_start: currentWeek,
      }));

      setAssignments(prev => ({
        ...prev,
        [bossName]: copiedAssignments,
      }));
      alert(`Copied ${bossName} roster from last week`);
    } catch (err) {
      alert('Failed to copy from last week');
      console.error(err);
    }
  };

  const changeWeek = (direction: 'prev' | 'next') => {
    const date = new Date(currentWeek);
    date.setDate(date.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(getWeekStart(date));
  };

  if (loading) {
    return <div className="text-center py-8">Loading boss assignments...</div>;
  }

  const activeMember = activeId 
    ? members.find(m => `member-${m.id}` === activeId) || 
      Object.values(assignments).flat().find(a => `assigned-${a.boss_name}-${a.member_id}` === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Boss Assignments</h2>
            <p className="text-gray-400">Drag and drop members to assign them to boss fights</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button onClick={() => changeWeek('prev')} className="btn btn-secondary p-2">
                <ChevronLeft size={20} />
              </button>
              <span className="font-medium px-4">
                Week of {currentWeek} - {getWeekEnd(currentWeek)}
              </span>
              <button onClick={() => changeWeek('next')} className="btn btn-secondary p-2">
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={syncRoster} 
                disabled={syncing}
                className="btn btn-secondary flex items-center gap-2"
              >
                <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing...' : 'Sync Roster'}
              </button>
              <button onClick={saveAssignments} className="btn btn-primary flex items-center gap-2">
                <Save size={18} />
                Save Roster
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Available Members */}
          <div className="lg:col-span-1">
            <AvailableMembersSection members={availableMembers} />
          </div>

          {/* Boss Assignments */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {MYTHIC_BOSSES.map(boss => (
                <BossCard
                  key={boss.name}
                  boss={boss}
                  assignments={assignments[boss.name] || []}
                  allBosses={MYTHIC_BOSSES}
                  onRemove={(memberId) => removeMemberFromBoss(boss.name, memberId)}
                  onClear={() => clearBossRoster(boss.name)}
                  onCopyFrom={(fromBoss) => copyBossRoster(fromBoss, boss.name)}
                  onCopyFromLastWeek={() => copyFromLastWeek(boss.name)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeMember ? (
          <div className="bg-gray-700 p-3 rounded-lg shadow-lg border border-gray-600">
            <div className="font-medium" style={{ color: getClassColor(activeMember.class || '') }}>
              {activeMember.name}
            </div>
            <div className="text-sm" style={{ color: getClassColor(activeMember.class || '') }}>
              {activeMember.class}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function AvailableMembersSection({ members }: { members: Member[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const { setNodeRef, isOver } = useDroppable({
    id: 'available',
  });

  const filteredMembers = members.filter(member => {
    const search = searchTerm.toLowerCase();
    return (
      member.name.toLowerCase().includes(search) ||
      member.class.toLowerCase().includes(search)
    );
  });

  return (
    <div className="card">
      <h3 className="text-lg font-bold mb-4">Guild Roster</h3>
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search by name or class..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
        />
      </div>
      <div 
        ref={setNodeRef}
        className={`space-y-2 min-h-[200px] rounded p-2 transition-colors ${
          isOver ? 'bg-green-900/30 border-2 border-green-500' : ''
        }`}
      >
        <SortableContext items={filteredMembers.map(m => `member-${m.id}`)} strategy={verticalListSortingStrategy}>
          {filteredMembers.map(member => (
            <DraggableMember key={member.id} member={member} />
          ))}
        </SortableContext>
        {filteredMembers.length === 0 && members.length > 0 && (
          <p className="text-gray-400 text-sm text-center py-4">No members match your search</p>
        )}
        {members.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-4">All members assigned</p>
        )}
      </div>
    </div>
  );
}

function DraggableMember({ member }: { member: Member }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `member-${member.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-gray-700 p-3 rounded-lg cursor-move hover:bg-gray-600 transition-colors"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="font-medium" style={{ color: getClassColor(member.class) }}>
            {member.name}
          </div>
          <div className="text-sm" style={{ color: getClassColor(member.class) }}>
            {member.class}
          </div>
        </div>
      </div>
    </div>
  );
}

function BossCard({ 
  boss, 
  assignments, 
  allBosses,
  onRemove,
  onClear,
  onCopyFrom,
  onCopyFromLastWeek
}: { 
  boss: { name: string; tanks: number; healers: number; dps: number };
  assignments: any[];
  allBosses: { name: string; tanks: number; healers: number; dps: number }[];
  onRemove: (memberId: number) => void;
  onClear: () => void;
  onCopyFrom: (fromBoss: string) => void;
  onCopyFromLastWeek: () => void;
}) {
  const tankAssignments = assignments.filter(a => a.role === 'tank');
  const healerAssignments = assignments.filter(a => a.role === 'healer');
  const dpsAssignments = assignments.filter(a => a.role === 'dps');
  const benchAssignments = assignments.filter(a => a.role === 'bench');
  
  const RoleSection = ({ role, assignments, colorClass }: any) => {
    const dropId = `boss-${boss.name}-role-${role}`;
    const { setNodeRef, isOver } = useDroppable({
      id: dropId,
    });

    const roleLabel = role === 'tank' ? '🛡️ Tanks' : 
                      role === 'healer' ? '💚 Healers' : 
                      role === 'dps' ? '⚔️ DPS' : 
                      '🪑 Bench';
    
    const countDisplay = `(${assignments.length})`;

    return (
      <div className="border border-gray-600 rounded p-2">
        <div className={`text-xs font-bold mb-2 ${colorClass}`}>
          {roleLabel} {countDisplay}
        </div>
        <div 
          ref={setNodeRef}
          className={`space-y-1 min-h-[60px] rounded p-1 transition-colors ${
            isOver ? 'bg-blue-900/30 border-2 border-blue-500' : ''
          }`}
        >
          {assignments.map((assignment: any) => (
            <div
              key={`assigned-${boss.name}-${assignment.member_id}`}
              className="bg-gray-700 p-2 rounded flex justify-between items-center group text-xs"
            >
              <div className="flex-1 truncate">
                <div className="font-medium" style={{ color: getClassColor(assignment.class || '') }}>
                  {assignment.name}
                </div>
              </div>
              <button
                onClick={() => onRemove(assignment.member_id)}
                className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
              >
                ×
              </button>
            </div>
          ))}
          {assignments.length === 0 && (
            <p className="text-gray-500 text-xs italic text-center py-2">Drop here</p>
          )}
        </div>
      </div>
    );
  };
  
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const copyMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (copyMenuRef.current && !copyMenuRef.current.contains(event.target as Node)) {
        setShowCopyMenu(false);
      }
    };

    if (showCopyMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCopyMenu]);

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-md font-bold text-wow-gold">{boss.name}</h3>
        <div className="flex gap-2">
          <div className="relative" ref={copyMenuRef}>
            <button
              onClick={() => setShowCopyMenu(!showCopyMenu)}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
              title="Copy roster"
            >
              <Copy size={12} />
            </button>
            {showCopyMenu && (
              <div className="absolute right-0 top-6 bg-gray-800 border border-gray-600 rounded shadow-lg z-10 min-w-[200px]">
                <button
                  onClick={() => {
                    onCopyFromLastWeek();
                    setShowCopyMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-700 flex items-center gap-2"
                >
                  <Clock size={12} />
                  Copy from Last Week
                </button>
                <div className="border-t border-gray-600 my-1"></div>
                <div className="px-3 py-1 text-[10px] text-gray-500 uppercase">Copy from boss:</div>
                {allBosses
                  .filter(b => b.name !== boss.name)
                  .map(b => (
                    <button
                      key={b.name}
                      onClick={() => {
                        onCopyFrom(b.name);
                        setShowCopyMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-700"
                    >
                      {b.name}
                    </button>
                  ))}
              </div>
            )}
          </div>
          {assignments.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <RoleSection role="tank" count={boss.tanks} assignments={tankAssignments} colorClass="text-blue-400" />
        <RoleSection role="healer" count={boss.healers} assignments={healerAssignments} colorClass="text-green-400" />
        <RoleSection role="dps" count={boss.dps} assignments={dpsAssignments} colorClass="text-red-400" />
        <RoleSection role="bench" count={undefined} assignments={benchAssignments} colorClass="text-yellow-400" />
      </div>
    </div>
  );
}
