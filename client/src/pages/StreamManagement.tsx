import { useState, useEffect } from 'react';
import { Tv, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { streamsAPI, type Stream } from '@/lib/api';

export default function StreamManagement() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    platform: 'twitch',
    username: '',
    display_name: '',
  });

  useEffect(() => {
    loadStreams();
  }, []);

  const loadStreams = async () => {
    try {
      setLoading(true);
      const response = await streamsAPI.getAll();
      setStreams(response.data);
    } catch (err) {
      console.error('Failed to load streams', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await streamsAPI.create(formData);
      setFormData({ platform: 'twitch', username: '', display_name: '' });
      setShowForm(false);
      await loadStreams();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add stream');
    }
  };

  const toggleActive = async (stream: Stream) => {
    try {
      await streamsAPI.update(stream.id, { is_active: stream.is_active ? 0 : 1 });
      await loadStreams();
    } catch (err) {
      console.error('Failed to toggle stream', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this stream?')) return;
    
    try {
      await streamsAPI.delete(id);
      await loadStreams();
    } catch (err) {
      console.error('Failed to delete stream', err);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Tv size={32} className="text-purple-500" />
            Stream Management
          </h1>
          <p className="text-gray-400 mt-2">Manage Twitch and YouTube streams displayed on the homepage</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Add Stream
        </button>
      </div>

      {/* Add Stream Form */}
      {showForm && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Add New Stream</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Platform</label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                required
              >
                <option value="twitch">Twitch</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Username {formData.platform === 'twitch' ? '(e.g., gm_pm)' : '(Channel ID or Handle)'}
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                placeholder={formData.platform === 'twitch' ? 'gm_pm' : '@channelname'}
                required
              />
              <p className="text-sm text-gray-400 mt-1">
                {formData.platform === 'twitch' 
                  ? 'Enter the Twitch username (without twitch.tv/)'
                  : 'Enter the YouTube channel ID or @handle'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Display Name</label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                placeholder="Friendly name to display"
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                Add Stream
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ platform: 'twitch', username: '', display_name: '' });
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Streams List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {streams.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Tv size={48} className="mx-auto mb-3 opacity-50" />
            <p>No streams added yet. Click "Add Stream" to get started.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Platform</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Username</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Display Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {streams.map((stream) => (
                <tr key={stream.id} className="hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        stream.platform === 'twitch' ? 'bg-purple-500' : 'bg-red-500'
                      }`} />
                      <span className="capitalize font-medium">{stream.platform}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-gray-300">
                    {stream.username}
                  </td>
                  <td className="px-6 py-4">{stream.display_name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      stream.is_active 
                        ? 'bg-green-900/30 text-green-400' 
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {stream.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(stream)}
                        className="p-2 hover:bg-gray-700 rounded transition-colors"
                        title={stream.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {stream.is_active ? (
                          <EyeOff size={18} className="text-gray-400" />
                        ) : (
                          <Eye size={18} className="text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(stream.id)}
                        className="p-2 hover:bg-red-900/20 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} className="text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <h3 className="font-semibold text-blue-400 mb-2">How Stream Embedding Works</h3>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Only <strong>active</strong> streams will be displayed on the homepage</li>
          <li>• Twitch streams will be checked for live status using the Twitch API</li>
          <li>• YouTube streams will be embedded using the channel's live stream URL</li>
          <li>• Inactive streams won't appear but are saved for future use</li>
        </ul>
      </div>
    </div>
  );
}
