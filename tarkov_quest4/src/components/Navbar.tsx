import type { MapInfo } from '../types/tarkov';
import { Compass, CheckSquare, Trash2, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  maps: MapInfo[];
  selectedMap: string;
  onSelectMap: (mapId: string) => void;
  acceptedCount: number;
  onClearAllQuests: () => void;
  onSelectAllVisibleQuests: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  maps,
  selectedMap,
  onSelectMap,
  acceptedCount,
  onClearAllQuests,
  onSelectAllVisibleQuests,
}) => {
  return (
    <header className="h-14 bg-zinc-950 border-b border-zinc-800/80 px-4 flex items-center justify-between shrink-0 select-none z-20">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-zinc-950 shadow-md">
          <Compass size={20} className="stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-white font-black text-sm tracking-wider flex items-center gap-2">
            TARKOV QUEST MAP
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono font-semibold flex items-center gap-1">
              <ShieldCheck size={11} /> 수락: {acceptedCount}개
            </span>
          </h1>
          <p className="text-[10px] text-zinc-400">TARKOV.DEV QUEST & MAP TRACKER</p>
        </div>
      </div>

      {/* Map Selector Pills */}
      <div className="flex items-center gap-1 overflow-x-auto max-w-2xl px-2 scrollbar-none">
        {maps.map((map) => {
          const isActive = selectedMap.toLowerCase() === map.id.toLowerCase();
          return (
            <button
              key={map.id}
              onClick={() => onSelectMap(map.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 border ${
                isActive
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-md shadow-amber-500/10'
                  : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              {map.name}
            </button>
          );
        })}
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSelectAllVisibleQuests}
          className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          title="현재 조건의 퀘스트 모두 선택"
        >
          <CheckSquare size={14} className="text-amber-400" />
          모두 선택
        </button>

        <button
          onClick={onClearAllQuests}
          className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 hover:border-rose-900/50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          title="모든 수락한 퀘스트 해제"
        >
          <Trash2 size={14} />
          초기화
        </button>
      </div>
    </header>
  );
};
