import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { fightPreferencesAPI, membersAPI } from '@/lib/api';
import { MYTHIC_BOSSES, getClassColor } from '@/lib/utils';
import type { FightPreference, Member } from '@/types';

export default function FightPreferences() {
  const [preferences, setPreferences] = useState<FightPreference[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedBoss, setSelectedBoss] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [preferencesRes, membersRes] = await Promise.all([
        fightPreferencesAPI.getAll(),
        membersAPI.getAll(),
      ]);
      setPreferences(preferencesRes.data);
      setMembers(membersRes.data);
    } catch (err) {
      console.error('Failed to load fight preferences', err);
    } finally {
      setLoading(false);
    }
  };

  const deletePreference = async (id: number) => {
    if (!confirm('Are you sure you want to delete this preference?')) return;
    
    try {
      await fightPreferencesAPI.delete(id);
      await loadData();
    } catch (err) {
      alert('Failed to delete preference');
      console.error(err);
    }
  };

  const groupedPreferences = preferences.reduce((acc, pref) => {
    if (!acc[pref.boss_name]) {
      acc[pref.boss_name] = [];
    }
    acc[pref.boss_name].push(pref);
    return acc;
  }, {} as Record<string, FightPreference[]>);

  if (loading) {
    return <div className="text-center py-8">Loading fight preferences...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Fight Preferences</h2>
          <p className="text-gray-400">Members can request specific boss fights for gear or progression</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Submit Preference
        </button>
      </div>

      {showForm && (
        <PreferenceForm
          members={members}
          onClose={() => setShowForm(false)}
          onSave={() => {
            setShowForm(false);
            loadData();
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {MYTHIC_BOSSES.map(boss => {
          const count = groupedPreferences[boss.name]?.length || 0;
          const highPriority = groupedPreferences[boss.name]?.filter(p => p.priority === 'high').length || 0;
          
          return (
            <button
              key={boss.name}
              onClick={() => setSelectedBoss(selectedBoss === boss.name ? null : boss.name)}
              className={`card text-left transition-all ${
                selectedBoss === boss.name ? 'ring-2 ring-blue-500' : ''
              } hover:bg-gray-750`}
            >
              <h3 className="font-bold text-wow-gold mb-1">{boss.name}</h3>
              <div className="text-xs text-gray-400 mb-2">
                <span className="text-blue-400">{boss.tanks}T</span> / 
                <span className="text-green-400">{boss.healers}H</span> / 
                <span className="text-red-400">{boss.dps}D</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span>{count} request{count !== 1 ? 's' : ''}</span>
                {highPriority > 0 && (
                  <span className="flex items-center gap-1 text-orange-400">
                    <AlertCircle size={14} />
                    {highPriority} high priority
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedBoss && groupedPreferences[selectedBoss] && (
        <div className="card">
          <h3 className="text-xl font-bold mb-4 text-wow-gold">{selectedBoss} - Requests</h3>
          <div className="space-y-3">
            {groupedPreferences[selectedBoss]
              .sort((a, b) => {
                const priorityOrder = { high: 0, normal: 1, low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
              })
              .map(pref => (
                <div
                  key={pref.id}
                  className={`bg-gray-700 p-4 rounded-lg border-l-4 ${
                    pref.priority === 'high' ? 'border-orange-500' :
                    pref.priority === 'normal' ? 'border-blue-500' :
                    'border-gray-500'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold" style={{ color: getClassColor(pref.class || '') }}>
                          {pref.name}
                        </span>
                        <span className="text-sm" style={{ color: getClassColor(pref.class || '') }}>
                          {pref.class}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          pref.priority === 'high' ? 'bg-orange-900 text-orange-200' :
                          pref.priority === 'normal' ? 'bg-blue-900 text-blue-200' :
                          'bg-gray-600 text-gray-300'
                        }`}>
                          {pref.priority} priority
                        </span>
                      </div>
                      <p className="text-gray-300">{pref.reason}</p>
                    </div>
                    <button
                      onClick={() => deletePreference(pref.id)}
                      className="text-red-400 hover:text-red-300 ml-4"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {!selectedBoss && preferences.length > 0 && (
        <div className="card bg-blue-900/20 border border-blue-500/30">
          <p className="text-blue-300 text-center">
            Click on a boss card above to view member preferences for that fight
          </p>
        </div>
      )}

      {preferences.length === 0 && (
        <div className="card">
          <p className="text-gray-400 text-center">
            No fight preferences submitted yet. Members can use "Submit Preference" to request specific bosses.
          </p>
        </div>
      )}
    </div>
  );
}

function PreferenceForm({ 
  members, 
  onClose, 
  onSave 
}: { 
  members: Member[]; 
  onClose: () => void; 
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    member_id: '',
    boss_name: '',
    reason: '',
    priority: 'normal' as 'high' | 'normal' | 'low',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.member_id || !formData.boss_name || !formData.reason) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await fightPreferencesAPI.create({
        member_id: parseInt(formData.member_id),
        boss_name: formData.boss_name,
        reason: formData.reason,
        priority: formData.priority,
      });
      onSave();
    } catch (err) {
      alert('Failed to submit preference');
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="card max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Submit Fight Preference</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Member</label>
            <select
              className="input"
              value={formData.member_id}
              onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
              required
            >
              <option value="">Select your character</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} - {member.class}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Boss</label>
            <select
              className="input"
              value={formData.boss_name}
              onChange={(e) => setFormData({ ...formData, boss_name: e.target.value })}
              required
            >
              <option value="">Select a boss</option>
              {MYTHIC_BOSSES.map((boss) => (
                <option key={boss.name} value={boss.name}>
                  {boss.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select
              className="input"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              required
            >
              <option value="high">High (BiS or critical progression)</option>
              <option value="normal">Normal (Gear upgrade)</option>
              <option value="low">Low (Minor upgrade)</option>
            </select>
          </div>
          <div>
            <label className="label">Reason</label>
            <textarea
              className="input"
              rows={4}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Why do you want to be on this fight? (e.g., BiS trinket, tier set, want to learn mechanics)"
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
