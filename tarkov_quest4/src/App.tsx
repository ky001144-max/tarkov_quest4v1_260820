import { useEffect, useState, useMemo } from 'react';
import type { Quest, Trader, MapInfo, MapMarker } from './types/tarkov';
import { fetchQuestsData, TRADERS, MAPS } from './services/tarkovApi';
import { extractQuestMarkersForMap } from './utils/coordinateTransform';
import { Navbar } from './components/Navbar';
import { QuestSidebar } from './components/QuestSidebar';
import { MapViewer } from './components/MapViewer';
import { Loader2 } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'tarkov_accepted_quests_v1';

export function App() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [traders] = useState<Trader[]>(TRADERS);
  const [maps] = useState<MapInfo[]>(MAPS);
  const [selectedMap, setSelectedMap] = useState<string>('customs');
  const [selectedTrader, setSelectedTrader] = useState<string | number | null>(null);
  const [acceptedQuestIds, setAcceptedQuestIds] = useState<Set<string | number>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to parse saved quests from localStorage:', e);
    }
    // Default initial accepted quests for nice demonstration (Debut & Checking)
    return new Set([0, 1, '5936d90786f7742b1420ba5b', '5936da9e86f7742d65037edf']);
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load Quests Data
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchQuestsData();
        if (isMounted) {
          setQuests(data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || '퀘스트 데이터를 불러오는데 실패했습니다.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save accepted quests to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(Array.from(acceptedQuestIds)));
    } catch (e) {
      console.error('Failed to save accepted quests to localStorage:', e);
    }
  }, [acceptedQuestIds]);

  // Toggle Quest accepted status
  const handleToggleQuest = (questId: string | number) => {
    setAcceptedQuestIds((prev) => {
      const next = new Set(prev);
      if (next.has(questId) || next.has(String(questId))) {
        next.delete(questId);
        next.delete(String(questId));
      } else {
        next.add(questId);
      }
      return next;
    });
  };

  const handleClearAllQuests = () => {
    setAcceptedQuestIds(new Set());
  };

  const handleSelectAllVisibleQuests = () => {
    setAcceptedQuestIds((prev) => {
      const next = new Set(prev);
      quests.forEach((q) => next.add(q.id));
      return next;
    });
  };

  // Compute map markers for current selected map
  const activeMarkers: MapMarker[] = useMemo(() => {
    if (!selectedMap || selectedMap === 'all') {
      return extractQuestMarkersForMap(quests, acceptedQuestIds, 'customs');
    }
    return extractQuestMarkersForMap(quests, acceptedQuestIds, selectedMap);
  }, [quests, acceptedQuestIds, selectedMap]);

  const currentMapObj = maps.find((m) => m.id.toLowerCase() === selectedMap.toLowerCase()) || maps[0];

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 overflow-hidden text-zinc-100">
      {/* Top Navbar */}
      <Navbar
        maps={maps}
        selectedMap={selectedMap}
        onSelectMap={setSelectedMap}
        acceptedCount={acceptedQuestIds.size}
        onClearAllQuests={handleClearAllQuests}
        onSelectAllVisibleQuests={handleSelectAllVisibleQuests}
      />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden relative">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 p-8">
            <Loader2 size={40} className="text-amber-500 animate-spin mb-4" />
            <p className="text-zinc-300 font-semibold text-base">Tarkov 퀘스트 & 맵 데이터 로딩 중...</p>
            <p className="text-zinc-500 text-xs mt-1">tarkov.dev GraphQL API 및 백업 데이터를 동기화하고 있습니다.</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 p-8 text-center">
            <p className="text-rose-400 font-bold text-lg">오류가 발생했습니다</p>
            <p className="text-zinc-400 text-sm mt-2">{error}</p>
          </div>
        ) : (
          <>
            {/* Left Sidebar: Quest List & Accordions */}
            <QuestSidebar
              quests={quests}
              traders={traders}
              maps={maps}
              acceptedQuestIds={acceptedQuestIds}
              onToggleQuest={handleToggleQuest}
              selectedMap={selectedMap}
              onSelectMap={setSelectedMap}
              selectedTrader={selectedTrader}
              onSelectTrader={setSelectedTrader}
            />

            {/* Right Main Area: Interactive Tarkov Map Viewer */}
            <MapViewer
              mapId={currentMapObj.id}
              mapName={currentMapObj.name}
              markers={activeMarkers}
              activeCount={acceptedQuestIds.size}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
