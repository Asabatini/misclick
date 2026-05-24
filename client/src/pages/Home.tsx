import { useState, useEffect } from 'react';
import { Trophy, Calendar, Swords, RefreshCw } from 'lucide-react';
import { MYTHIC_BOSSES, getClassColor } from '@/lib/utils';
import { bossKillsAPI } from '@/lib/api';

interface BossKill {
  id: number;
  boss_name: string;
  kill_date: string;
  screenshot_url?: string;
  created_at: string;
}

export default function Home() {
  const [bossKills, setBossKills] = useState<BossKill[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    loadBossKills();
  }, []);

  const loadBossKills = async () => {
    try {
      setLoading(true);
      const response = await bossKillsAPI.getAll();
      setBossKills(response.data);
    } catch (err) {
      console.error('Failed to load boss kills', err);
    } finally {
      setLoading(false);
    }
  };

  const syncBossKills = async () => {
    try {
      setSyncing(true);
      setSyncMessage('');
      const response = await bossKillsAPI.sync();
      setSyncMessage(response.data.message);
      await loadBossKills(); // Reload after sync
      setTimeout(() => setSyncMessage(''), 5000); // Clear message after 5s
    } catch (err: any) {
      console.error('Failed to sync boss kills', err);
      setSyncMessage(err.response?.data?.error || 'Failed to sync boss kills');
    } finally {
      setSyncing(false);
    }
  };

  const killedBosses = new Set(bossKills.map(k => k.boss_name));
  const progressCount = killedBosses.size;
  const totalBosses = MYTHIC_BOSSES.length;
  const progressPercent = (progressCount / totalBosses) * 100;

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Misclick Guild</h1>
        <p className="text-xl text-gray-400">Sargeras-US • Mythic Progression</p>
        
        {/* Sync Button */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={syncBossKills}
            disabled={syncing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync Boss Kills from Blizzard'}
          </button>
          {syncMessage && (
            <p className="text-sm text-green-400">{syncMessage}</p>
          )}
        </div>
      </div>

      {/* Progression Summary */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="text-yellow-500" size={32} />
            <div>
              <h2 className="text-2xl font-bold">Current Progression</h2>
              <p className="text-gray-400">Midnight Rising Mythic</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-blue-400">{progressCount}/{totalBosses}</div>
            <div className="text-sm text-gray-400">Bosses Defeated</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="relative w-full h-8 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
            {progressPercent.toFixed(0)}% Complete
          </div>
        </div>
      </div>

      {/* Boss Status Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Swords size={24} />
          Boss Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MYTHIC_BOSSES.map((boss, index) => {
            const isKilled = killedBosses.has(boss.name);
            const killInfo = bossKills.find(k => k.boss_name === boss.name);
            
            return (
              <div 
                key={boss.name}
                className={`rounded-lg p-4 border-2 transition-all ${
                  isKilled 
                    ? 'bg-green-900/20 border-green-500' 
                    : 'bg-gray-800 border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-500 font-bold">#{index + 1}</span>
                      <h3 className="font-bold">{boss.name}</h3>
                    </div>
                    <div className="text-sm text-gray-400">
                      {boss.tanks}T • {boss.healers}H • {boss.dps}D
                    </div>
                  </div>
                  {isKilled && (
                    <Trophy className="text-yellow-500 flex-shrink-0" size={24} />
                  )}
                </div>
                
                {isKilled && killInfo && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar size={14} />
                      <span>Killed: {new Date(killInfo.kill_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
                
                {!isKilled && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <span className="text-sm text-gray-500">Not yet defeated</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Kills */}
      {bossKills.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={24} />
            Recent Kills
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bossKills.slice(0, 6).map((kill) => (
              <div key={kill.id} className="bg-gray-800 rounded-lg overflow-hidden">
                {kill.screenshot_url && (
                  <div className="aspect-video bg-gray-700">
                    <img 
                      src={kill.screenshot_url} 
                      alt={kill.boss_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2">{kill.boss_name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar size={14} />
                    <span>{new Date(kill.kill_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
