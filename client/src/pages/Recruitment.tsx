import { UserPlus, Clock } from 'lucide-react';

export default function Recruitment() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="bg-gray-800 rounded-full p-6">
        <UserPlus className="text-blue-400" size={48} />
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Recruitment</h2>
        <p className="text-gray-400 text-lg">This section is coming soon.</p>
      </div>
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Clock size={16} />
        <span>Under construction</span>
      </div>
    </div>
  );
}
