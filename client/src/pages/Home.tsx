import { useState, useEffect } from 'react';
import { Trophy, Calendar, RefreshCw, Tv } from 'lucide-react';
import { VENOMOUS_ABYSS_BOSSES } from '@/lib/utils';
import { bossKillsAPI, streamsAPI, type Stream } from '@/lib/api';

type Difficulty = 'normal' | 'heroic' | 'mythic';

interface BossKill {
  id: number;
  boss_name: string;
  kill_date: string;
  difficulty: string;
  raid_tier: string;
  screenshot_url?: string;
  created_at: string;
}

const DIFFICULTY_CONFIG: Record<Difficulty, {
  label: string;
  color: string;
  border: string;
  bg: string;
  bar: string;
  tab: string;
  activeTab: string;
}> = {
  normal: {
    label: 'Normal',
    color: 'text-green-400',
    border: 'border-green-500',
    bg: 'bg-green-900/20',
    bar: 'from-green-600 to-green-400',
    tab: 'text-gray-400 hover:text-green-300 hover:bg-gray-700/60',
    activeTab: 'text-green-400 bg-gray-700 border-b-2 border-green-400',
  },
  heroic: {
    label: 'Heroic',
    color: 'text-blue-400',
    border: 'border-blue-500',
    bg: 'bg-blue-900/20',
    bar: 'from-blue-600 to-blue-400',
    tab: 'text-gray-400 hover:text-blue-300 hover:bg-gray-700/60',
    activeTab: 'text-blue-400 bg-gray-700 border-b-2 border-blue-400',
  },
  mythic: {
    label: 'Mythic',
    color: 'text-purple-400',
    border: 'border-purple-500',
    bg: 'bg-purple-900/20',
    bar: 'from-purple-600 to-pink-500',
    tab: 'text-gray-400 hover:text-purple-300 hover:bg-gray-700/60',
    activeTab: 'text-purple-400 bg-gray-700 border-b-2 border-purple-400',
  },
};

const TOTAL_BOSSES = VENOMOUS_ABYSS_BOSSES.length;

export default function Home() {
  const [bossKills, setBossKills] = useState<BossKill[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty>('mythic');

  useEffect(() => {
    loadBossKills();
    loadStreams();
  }, []);

  const loadBossKills = async () => {
    try {
      setLoading(true);
      const response = await bossKillsAPI.getAll();
      setBossKills(response.data as BossKill[]);
    } catch (err) {
      console.error('Failed to load boss kills', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStreams = async () => {
    try {
      const response = await streamsAPI.getActive();
      setStreams(response.data);
    } catch (err) {
      console.error('Failed to load streams', err);
    }
  };

  const syncBossKills = async () => {
    try {
      setSyncing(true);
      await bossKillsAPI.sync();
      await loadBossKills();
    } catch (err) {
      console.error('Failed to sync boss kills', err);
    } finally {
      setSyncing(false);
    }
  };

  const getKillsForDifficulty = (diff: Difficulty) =>
    bossKills.filter(k => (k.difficulty ?? 'mythic') === diff);

  const config = DIFFICULTY_CONFIG[activeDifficulty];
  const difficultyKills = getKillsForDifficulty(activeDifficulty);
  const killedBosses = new Set(difficultyKills.map(k => k.boss_name));
  const progressCount = VENOMOUS_ABYSS_BOSSES.filter(b => killedBosses.has(b.name)).length;
  const progressPercent = TOTAL_BOSSES > 0 ? (progressCount / TOTAL_BOSSES) * 100 : 0;

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Misclick Guild</h1>
        <p className="text-xl text-gray-400">Sargeras-US &bull; Season 2 Midnight</p>
      </div>

      {/* Raid Progression Block */}
      <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
        {/* Raid Title Bar */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="text-yellow-500" size={28} />
            <div>
              <h2 className="text-xl font-bold">The Venomous Abyss</h2>
              <p className="text-sm text-gray-400">Season 2 Midnight &bull; {TOTAL_BOSSES} Bosses</p>
            </div>
          </div>
          <button
            onClick={syncBossKills}
            disabled={syncing}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Sync boss kills from Raider.IO"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync'}
          </button>
        </div>

        {/* Difficulty Tabs */}
        <div className="flex border-b border-gray-700">
          {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((diff) => {
            const dc = DIFFICULTY_CONFIG[diff];
            const isActive = activeDifficulty === diff;
            const diffKillSet = new Set(getKillsForDifficulty(diff).map(k => k.boss_name));
            const diffCount = VENOMOUS_ABYSS_BOSSES.filter(b => diffKillSet.has(b.name)).length;
            return (
              <button
                key={diff}
                onClick={() => setActiveDifficulty(diff)}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${isActive ? dc.activeTab : dc.tab}`}
              >
                {dc.label}
                <span className="ml-2 text-xs font-normal opacity-70">
                  {diffCount}/{TOTAL_BOSSES}
                </span>
              </button>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xl font-bold ${config.color}`}>
              {progressCount}/{TOTAL_BOSSES} Defeated
            </span>
            <span className="text-gray-400 text-sm">{progressPercent.toFixed(0)}% Complete</span>
          </div>
          <div className="relative w-full h-5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full bg-gradient-to-r ${config.bar} transition-all duration-500`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Boss Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {VENOMOUS_ABYSS_BOSSES.map((boss, index) => {
              const isKilled = killedBosses.has(boss.name);
              const killInfo = difficultyKills.find(k => k.boss_name === boss.name);
              return (
                <div
                  key={boss.name}
                  className={`rounded-lg p-4 border-2 transition-all ${
                    isKilled
                      ? `${config.bg} ${config.border}`
                      : 'bg-gray-900/50 border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-500 text-xs font-bold block mb-1">#{index + 1}</span>
                      <h3 className="font-semibold text-sm leading-tight">{boss.name}</h3>
                    </div>
                    {isKilled && (
                      <Trophy className="text-yellow-500 flex-shrink-0 ml-2 mt-0.5" size={16} />
                    )}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-700/60">
                    {isKilled && killInfo ? (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar size={11} />
                        <span>{new Date(killInfo.kill_date).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-600">Not yet defeated</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Streams Section */}
      {streams.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Tv className="text-purple-500" size={24} />
            Live Streams
          </h2>
          <div className={`grid gap-6 ${
            streams.length === 1
              ? 'grid-cols-1'
              : streams.length === 2
              ? 'grid-cols-1 lg:grid-cols-2'
              : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
          }`}>
            {streams.map((stream) => (
              <div key={stream.id} className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="aspect-video bg-gray-900">
                  {stream.platform === 'twitch' ? (
                    <iframe
                      src={`https://player.twitch.tv/?channel=${stream.username}&parent=${window.location.hostname}&autoplay=false`}
                      height="100%"
                      width="100%"
                      allowFullScreen
                      className="w-full h-full"
                      title={`${stream.display_name} Twitch Stream`}
                    />
                  ) : (
                    <iframe
                      src={`https://www.youtube.com/embed/live_stream?channel=${stream.username}&autoplay=0`}
                      height="100%"
                      width="100%"
                      allowFullScreen
                      className="w-full h-full"
                      title={`${stream.display_name} YouTube Stream`}
                    />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{stream.display_name}</h3>
                      <p className="text-sm text-gray-400">
                        {stream.platform === 'twitch' ? '🟣 Twitch' : '🔴 YouTube'}
                      </p>
                    </div>
                    <a
                      href={
                        stream.platform === 'twitch'
                          ? `https://twitch.tv/${stream.username}`
                          : `https://youtube.com/@${stream.username}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-sm transition-colors"
                    >
                      Watch
                    </a>
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
