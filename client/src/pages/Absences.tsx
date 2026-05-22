import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { absencesAPI, membersAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Absence, Member } from '@/types';

export default function Absences() {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [absencesRes, membersRes] = await Promise.all([
        absencesAPI.getAll(),
        membersAPI.getAll(),
      ]);
      setAbsences(absencesRes.data);
      setMembers(membersRes.data);
    } catch (err) {
      console.error('Failed to load absences', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteAbsence = async (id: number) => {
    if (!confirm('Are you sure you want to delete this absence?')) return;
    
    try {
      await absencesAPI.delete(id);
      await loadData();
    } catch (err) {
      alert('Failed to delete absence');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading absences...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Member Absences</h2>
          <p className="text-gray-400">Track when guild members will be unavailable for raids</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Report Absence
        </button>
      </div>

      {showForm && (
        <AbsenceForm
          members={members}
          onClose={() => setShowForm(false)}
          onSave={() => {
            setShowForm(false);
            loadData();
          }}
        />
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4">Member</th>
                <th className="text-left py-3 px-4">Class</th>
                <th className="text-left py-3 px-4">Rank</th>
                <th className="text-left py-3 px-4">Start Date</th>
                <th className="text-left py-3 px-4">End Date</th>
                <th className="text-left py-3 px-4">Reason</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {absences.map((absence) => (
                <tr key={absence.id} className="border-b border-gray-700 hover:bg-gray-750">
                  <td className="py-3 px-4 font-medium">{absence.member_name}</td>
                  <td className="py-3 px-4 text-gray-300">{absence.class}</td>
                  <td className="py-3 px-4 text-gray-300">{absence.rank}</td>
                  <td className="py-3 px-4 text-gray-300">{formatDate(absence.start_date)}</td>
                  <td className="py-3 px-4 text-gray-300">{formatDate(absence.end_date)}</td>
                  <td className="py-3 px-4 text-gray-300">{absence.reason || '-'}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => deleteAbsence(absence.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {absences.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No absences reported. Members can use "Report Absence" to notify about unavailability.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AbsenceForm({ 
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
    start_date: '',
    end_date: '',
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
      <div className="card max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Report Absence</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Member</label>
            <select
              className="input"
              value={formData.member_id}
              onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
              required
            >
              <option value="">Select a member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} - {member.class}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Start Date</label>
            <input
              type="date"
              className="input"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">End Date</label>
            <input
              type="date"
              className="input"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Reason (Optional)</label>
            <textarea
              className="input"
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Vacation, work trip, etc."
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
