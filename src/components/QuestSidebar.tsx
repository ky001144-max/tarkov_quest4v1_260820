import { useState } from 'react';
import type { Quest, Trader, MapInfo } from '../types/tarkov';
import {
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
  Search,
  Filter,
  ExternalLink,
  Target,
  Shield,
} from 'lucide-react';

interface QuestSidebarProps {
  quests: Quest[];
  traders: Trader[];
  maps: MapInfo[];
  acceptedQuestIds: Set<string | number>;
  onToggleQuest: (questId: string | number) => void;
  selectedMap: string;
  onSelectMap: (mapId: string) => void;
  selectedTrader: string | number | null;
  onSelectTrader: (traderId: string | number | null) => void;
}

export const QuestSidebar: React.FC<QuestSidebarProps> = ({
  quests,
  traders,
  maps,
  acceptedQuestIds,
  onToggleQuest,
  selectedMap,
  onSelectMap,
  selectedTrader,
  onSelectTrader,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedQuestIds, setExpandedQuestIds] = useState<Set<string | number>>(new Set());
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const toggleExpandQuest = (questId: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedQuestIds((prev) => {
      const next = new Set(prev);
      if (next.has(questId)) {
        next.delete(questId);
      } else {
        next.add(questId);
      }
      return next;
    });
  };

  // Filter quests
  const filteredQuests = quests.filter((quest) => {
    // 1. Active Filter
    if (showActiveOnly && !acceptedQuestIds.has(quest.id) && !acceptedQuestIds.has(String(quest.id))) {
      return false;
    }

    // 2. Trader Filter
    if (selectedTrader !== null) {
      const questTraderId = typeof quest.giver === 'object' ? quest.giver.id : quest.giver;
      if (String(questTraderId) !== String(selectedTrader)) {
        return false;
      }
    }

    // 3. Map Filter
    if (selectedMap !== 'all') {
      const questMapId = quest.map?.id || quest.map?.normalizedName;
      const targetMapId = selectedMap.toLowerCase();

      // Check if quest has matching map or any objective matching map
      const hasMapMatch =
        (questMapId && questMapId.toLowerCase().includes(targetMapId)) ||
        quest.objectives.some(
          (o) =>
            o.location === undefined ||
            String(o.location).toLowerCase().includes(targetMapId) ||
            o.zones?.some((z) => z.map?.name?.toLowerCase().includes(targetMapId))
        );

      if (!hasMapMatch) {
        return false;
      }
    }

    // 4. Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const titleMatch = quest.title.toLowerCase().includes(q);
      const traderMatch = (typeof quest.giver === 'object' ? quest.giver.name : String(quest.giver)).toLowerCase().includes(q);
      const objMatch = quest.objectives.some((o) => o.description?.toLowerCase().includes(q) || String(o.target).toLowerCase().includes(q));

      if (!titleMatch && !traderMatch && !objMatch) {
        return false;
      }
    }

    return true;
  });

  return (
    <aside className="w-96 bg-zinc-900 border-r border-zinc-800/80 flex flex-col h-full z-10 shadow-xl overflow-hidden">
      {/* Header Controls */}
      <div className="p-4 border-b border-zinc-800/80 space-y-3 bg-zinc-950/60">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Shield size={18} />
            </span>
            TARKOV QUESTS
          </h1>
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold">
            수락됨: {acceptedQuestIds.size}개
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="퀘스트, 상인, 아이템 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 transition-colors"
          />
        </div>

        {/* Map Dropdown & Filter toggle */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <select
              value={selectedMap}
              onChange={(e) => onSelectMap(e.target.value)}
              className="w-full appearance-none bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/60 font-medium"
            >
              <option value="all">🌐 모든 지도 (All Maps)</option>
              {maps.map((m) => (
                <option key={m.id} value={m.id}>
                  🗺️ {m.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>

          <button
            onClick={() => setShowActiveOnly((prev) => !prev)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              showActiveOnly
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Filter size={14} />
            수락만
          </button>
        </div>

        {/* Trader Filter Horizontal Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
          <button
            onClick={() => onSelectTrader(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
              selectedTrader === null
                ? 'bg-amber-500 text-zinc-950 font-bold border-amber-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            전체 상인
          </button>
          {traders.map((trader) => (
            <button
              key={trader.id}
              onClick={() => onSelectTrader(trader.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border flex items-center gap-1.5 ${
                String(selectedTrader) === String(trader.id)
                  ? 'bg-amber-500 text-zinc-950 font-bold border-amber-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {trader.name}
            </button>
          ))}
        </div>
      </div>

      {/* Quest List Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-zinc-800/40">
        {filteredQuests.length > 0 ? (
          filteredQuests.map((quest) => {
            const isAccepted = acceptedQuestIds.has(quest.id) || acceptedQuestIds.has(String(quest.id));
            const isExpanded = expandedQuestIds.has(quest.id);
            const traderName = typeof quest.giver === 'object' ? quest.giver.name : String(quest.giver);

            return (
              <div
                key={quest.id}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  isAccepted
                    ? 'bg-zinc-900/90 border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700/80'
                }`}
              >
                {/* Quest Item Header */}
                <div
                  onClick={(e) => toggleExpandQuest(quest.id, e)}
                  className="p-3.5 flex items-start gap-3 cursor-pointer select-none group hover:bg-zinc-800/40 transition-colors"
                >
                  {/* Accept Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleQuest(quest.id);
                    }}
                    className={`mt-0.5 transition-colors ${isAccepted ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'}`}
                    title={isAccepted ? '퀘스트 해제' : '퀘스트 수락'}
                  >
                    {isAccepted ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700/80">
                        {traderName}
                      </span>
                      <span className="text-[11px] text-zinc-500 font-mono">Lvl {quest.minPlayerLevel}+</span>
                    </div>

                    <h3 className="text-sm font-semibold text-zinc-100 mt-1 truncate group-hover:text-amber-300 transition-colors">
                      {quest.title}
                    </h3>
                  </div>

                  {/* Accordion Expand Icon */}
                  <button
                    onClick={(e) => toggleExpandQuest(quest.id, e)}
                    className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors"
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                </div>

                {/* Quest Accordion Content (Detailed Objectives) */}
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-1 bg-zinc-950/70 border-t border-zinc-800/60 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                      <span className="flex items-center gap-1 text-amber-400/90">
                        <Target size={13} />
                        퀘스트 목표 목록 ({quest.objectives.length})
                      </span>
                      {quest.wiki && (
                        <a
                          href={quest.wiki}
                          target="_blank"
                          rel="noreferrer"
                          className="text-zinc-500 hover:text-amber-400 flex items-center gap-1 text-[11px] transition-colors"
                        >
                          위키 <ExternalLink size={10} />
                        </a>
                      )}
                    </div>

                    {/* Objectives List */}
                    <div className="space-y-1.5">
                      {quest.objectives.map((obj, idx) => (
                        <div
                          key={obj.id || idx}
                          className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs space-y-1"
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-amber-500 font-bold uppercase text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                              {obj.type}
                            </span>
                            <span className="text-zinc-200 flex-1 leading-snug">
                              {obj.description || (obj.target ? `${obj.target}` : '목표 정보')}
                            </span>
                          </div>

                          {obj.number && (
                            <p className="text-[11px] text-zinc-400 pl-2">수량: {obj.number}개</p>
                          )}
                          {obj.gps && (
                            <p className="text-[11px] text-amber-400/80 pl-2 flex items-center gap-1">
                              📍 2D 좌표: ({obj.gps.leftPercent}%, {obj.gps.topPercent}%)
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-zinc-500 text-sm">
            검색 결과에 맞는 퀘스트가 없습니다.
          </div>
        )}
      </div>
    </aside>
  );
};
