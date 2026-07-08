import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Home as HomeIcon, ClipboardList, Swords, MessageSquare, Users, LogOut, User, Shield, Tv } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import BossAssignments from './pages/BossAssignments';
import Roster from './pages/Roster';
import Absences from './pages/Absences';
import FightPreferences from './pages/FightPreferences';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import StreamManagement from './pages/StreamManagement';

function App() {
  const location = useLocation();
  const { user, loading, logout, isAuthenticated, canViewAllTabs, canManageUsers, canEditBossAssignments } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  // Redirect to home if already logged in and trying to access login
  if (isAuthenticated && location.pathname === '/login') {
    return <Navigate to="/" replace />;
  }

  // Define navigation items based on user role
  const navItems = [
    { path: '/', icon: HomeIcon, label: 'Home', roles: ['Administrator', 'Officer', 'Raider', 'Member', 'Guest'] },
    { path: '/roster', icon: Shield, label: 'Roster', roles: ['Administrator', 'Officer'] },
    { path: '/boss-assignments', icon: Swords, label: 'Boss Assignments', roles: ['Administrator', 'Officer', 'Raider', 'Member', 'Guest'] },
    { path: '/absences', icon: ClipboardList, label: 'Absences', roles: ['Administrator', 'Officer', 'Raider', 'Member'] },
    { path: '/preferences', icon: MessageSquare, label: 'Fight Preferences', roles: ['Administrator', 'Officer', 'Raider', 'Member', 'Guest'] },
    { path: '/streams', icon: Tv, label: 'Streams', roles: ['Administrator'] },
    { path: '/users', icon: Users, label: 'User Management', roles: ['Administrator'] },
  ].filter(item => user && item.roles.includes(user.role));

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-wow-gold">Misclick Guild Manager</h1>
              <p className="text-gray-400">World of Warcraft Guild Management</p>
            </div>
            {user && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm">
                    <User size={16} />
                    <span className="font-medium">{user.username}</span>
                  </div>
                  <div className="text-xs text-gray-400">{user.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
                  title="Logout"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      {isAuthenticated && (
        <nav className="bg-gray-800 border-b border-gray-700">
          <div className="container mx-auto px-4">
            <ul className="flex space-x-1">
              {navItems.map(({ path, icon: Icon, label }) => (
                <li key={path}>
                  <Link
                    to={path}
                    className={`flex items-center gap-2 px-4 py-3 transition-colors ${
                      location.pathname === path
                        ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route 
            path="/roster" 
            element={canEditBossAssignments ? <Roster /> : <Navigate to="/" replace />} 
          />
          <Route path="/boss-assignments" element={<BossAssignments />} />
          <Route 
            path="/absences" 
            element={canViewAllTabs ? <Absences /> : <Navigate to="/" replace />} 
          />
          <Route path="/preferences" element={<FightPreferences />} />
          <Route 
            path="/streams" 
            element={canManageUsers ? <StreamManagement /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/users" 
            element={canManageUsers ? <UserManagement /> : <Navigate to="/" replace />} 
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
