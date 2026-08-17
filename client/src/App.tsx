import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Home as HomeIcon, CalendarDays, Users, LogOut, User, Tv, UserPlus } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import StreamManagement from './pages/StreamManagement';
import Recruitment from './pages/Recruitment';

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
    { path: '/calendar', icon: CalendarDays, label: 'Calendar', roles: ['Administrator', 'Officer', 'Raider', 'Member'] },
    { path: '/recruitment', icon: UserPlus, label: 'Recruitment', roles: ['Administrator', 'Officer', 'Raider', 'Member', 'Guest'] },
    { path: '/streams', icon: Tv, label: 'Streams', roles: ['Administrator'] },
    { path: '/users', icon: Users, label: 'User Management', roles: ['Administrator'] },
  ].filter(item => user && item.roles.includes(user.role));

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="relative bg-[#080810] shadow-2xl overflow-hidden">
        {/* Atmospheric glows */}
        <div className="absolute top-0 left-1/4 w-72 h-20 bg-purple-600/10 blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-72 h-20 bg-indigo-600/8 blur-3xl pointer-events-none" />
        {/* Gold shimmer bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent" />
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <img
                src="/Misclick%20logo%20Google.png"
                alt="Misclick"
                className="h-16 w-16 object-contain"
                style={{ filter: 'drop-shadow(0 0 12px rgba(255,209,0,0.35))' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
              <div>
                <h1
                  className="text-4xl font-black tracking-tight text-wow-gold leading-none"
                  style={{ textShadow: '0 0 30px rgba(255,209,0,0.25), 0 2px 8px rgba(0,0,0,0.9)' }}
                >
                  MISCLICK
                </h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-[0.18em]">Sargeras-US</span>
                  <span className="text-yellow-700/50">◆</span>
                  <span className="text-xs text-gray-500 uppercase tracking-[0.12em]">World of Warcraft</span>
                </div>
              </div>
            </div>
            {user && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm justify-end">
                    <User size={14} className="text-gray-400" />
                    <span className="font-semibold text-gray-200">{user.username}</span>
                  </div>
                  <div className="text-xs text-purple-400 font-medium mt-0.5">{user.role}</div>
                </div>
                <div className="w-px h-8 bg-gray-700" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm"
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
        <nav className="bg-[#0d0d18] border-b border-yellow-900/30">
          <div className="container mx-auto px-6">
            <ul className="flex">
              {navItems.map(({ path, icon: Icon, label }) => (
                <li key={path}>
                  <Link
                    to={path}
                    className={`flex items-center gap-2 px-4 py-3.5 text-sm transition-all border-b-2 ${
                      location.pathname === path
                        ? 'text-wow-gold border-wow-gold bg-yellow-500/5 font-semibold'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border-transparent'
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
            path="/calendar"
            element={canViewAllTabs ? <Calendar /> : <Navigate to="/" replace />}
          />
          <Route path="/recruitment" element={<Recruitment />} />
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
