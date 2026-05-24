import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, ClipboardList, Swords, MessageSquare } from 'lucide-react';
import Home from './pages/Home';
import BossAssignments from './pages/BossAssignments';
import Absences from './pages/Absences';
import FightPreferences from './pages/FightPreferences';

function App() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: HomeIcon, label: 'Home' },
    { path: '/boss-assignments', icon: Swords, label: 'Boss Assignments' },
    { path: '/absences', icon: ClipboardList, label: 'Absences' },
    { path: '/preferences', icon: MessageSquare, label: 'Fight Preferences' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-wow-gold">Misclick Guild Manager</h1>
          <p className="text-gray-400">World of Warcraft Guild Management</p>
        </div>
      </header>

      {/* Navigation */}
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/boss-assignments" element={<BossAssignments />} />
          <Route path="/absences" element={<Absences />} />
          <Route path="/preferences" element={<FightPreferences />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
