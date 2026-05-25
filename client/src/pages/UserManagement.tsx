import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usersAPI, type UserManagement } from '@/lib/api';
import { Users, Shield, Edit, Trash2, KeyRound } from 'lucide-react';

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserManagement | null>(null);
  const [newRole, setNewRole] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;

    try {
      await usersAPI.updateRole(selectedUser.id, newRole);
      await loadUsers();
      setShowRoleModal(false);
      setSelectedUser(null);
      setNewRole('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      await usersAPI.resetPassword(selectedUser.id, newPassword);
      alert('Password reset successfully');
      setShowPasswordModal(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reset password');
    }
  };

  const handleDeleteUser = async (user: UserManagement) => {
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) {
      return;
    }

    try {
      await usersAPI.delete(user.id);
      await loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Administrator': return 'bg-red-900/30 text-red-400 border-red-500';
      case 'Officer': return 'bg-purple-900/30 text-purple-400 border-purple-500';
      case 'Raider': return 'bg-blue-900/30 text-blue-400 border-blue-500';
      case 'Member': return 'bg-green-900/30 text-green-400 border-green-500';
      case 'Guest': return 'bg-gray-800 text-gray-400 border-gray-600';
      default: return 'bg-gray-800 text-gray-400 border-gray-600';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users size={32} />
          User Management
        </h1>
      </div>

      {/* Users Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-750">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.username}</span>
                    {user.id === currentUser?.id && (
                      <span className="text-xs text-blue-400">(You)</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setNewRole(user.role);
                        setShowRoleModal(true);
                      }}
                      className="p-2 text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Change role"
                      disabled={user.id === currentUser?.id}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowPasswordModal(true);
                      }}
                      className="p-2 text-yellow-400 hover:bg-yellow-900/20 rounded-lg transition-colors"
                      title="Reset password"
                    >
                      <KeyRound size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete user"
                      disabled={user.id === currentUser?.id}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Shield size={24} />
              Change User Role
            </h3>
            <p className="text-gray-400 mb-4">
              Changing role for: <span className="font-medium text-white">{selectedUser.username}</span>
            </p>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg mb-4 focus:outline-none focus:border-blue-500"
            >
              <option value="Administrator">Administrator</option>
              <option value="Officer">Officer</option>
              <option value="Raider">Raider</option>
              <option value="Member">Member</option>
              <option value="Guest">Guest</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleUpdateRole}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Update Role
              </button>
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                  setNewRole('');
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <KeyRound size={24} />
              Reset Password
            </h3>
            <p className="text-gray-400 mb-4">
              Resetting password for: <span className="font-medium text-white">{selectedUser.username}</span>
            </p>
            <input
              type="password"
              placeholder="New password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg mb-4 focus:outline-none focus:border-blue-500"
              minLength={6}
            />
            <div className="flex gap-2">
              <button
                onClick={handleResetPassword}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Reset Password
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedUser(null);
                  setNewPassword('');
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
