import { useState, useRef, useEffect } from 'react';
import type { MapMarker } from '../types/tarkov';
import { MapPin, ZoomIn, ZoomOut, RotateCcw, Crosshair, Layers } from 'lucide-react';

interface MapViewerProps {
  mapId: string;
  mapName: string;
  markers: MapMarker[];
  activeCount: number;
}

export const LOCAL_MAP_URLS: Record<string, string> = {
  customs: '/maps/customs.svg',
  woods: '/maps/woods.svg',
  shoreline: '/maps/shoreline.svg',
  interchange: '/maps/interchange.svg',
  reserve: '/maps/reserve.svg',
  lighthouse: '/maps/lighthouse.svg',
  streets: '/maps/streets.svg',
  factory: '/maps/factory.svg',
  labs: '/maps/labs.svg',
  'ground-zero': '/maps/ground-zero.svg',
};

export const ONLINE_FALLBACK_URLS: Record<string, string> = {
  customs: 'https://raw.githubusercontent.com/the-hideout/tarkov-dev-svg-maps/main/Customs.svg',
  woods: 'https://raw.githubusercontent.com/the-hideout/tarkov-dev-svg-maps/main/Woods.svg',
  shoreline: 'https://raw.githubusercontent.com/the-hideout/tarkov-dev-svg-maps/main/Shoreline.svg',
  interchange: 'https://raw.githubusercontent.com/the-hideout/tarkov-dev-svg-maps/main/Interchange.svg',
  reserve: 'https://raw.githubusercontent.com/the-hideout/tarkov-dev-svg-maps/main/Reserve.svg',
  lighthouse: 'https://raw.githubusercontent.com/the-hideout/tarkov-dev-svg-maps/main/Lighthouse.svg',
  streets: 'https://raw.githubusercontent.com/the-hideout/tarkov-dev-svg-maps/main/StreetsOfTarkov.svg',
  factory: 'https://raw.githubusercontent.com/the-hideout/tarkov-dev-svg-maps/main/Factory.svg',
  labs: 'https://raw.githubusercontent.com/the-hideout/tarkov-dev-svg-maps/main/Labs.svg',
  'ground-zero': 'https://raw.githubusercontent.com/the-hideout/tarkov-dev-svg-maps/main/GroundZero.svg',
};

export const MapViewer: React.FC<MapViewerProps> = ({ mapId, mapName, markers, activeCount }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  const normalizedMapId = mapId.toLowerCase();
  const [currentImgSrc, setCurrentImgSrc] = useState<string>(
    LOCAL_MAP_URLS[normalizedMapId] || ONLINE_FALLBACK_URLS[normalizedMapId] || '/maps/customs.svg'
  );
  const [mapLoadError, setMapLoadError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setSelectedMarker(null);
    setMapLoadError(false);
    setCurrentImgSrc(LOCAL_MAP_URLS[normalizedMapId] || ONLINE_FALLBACK_URLS[normalizedMapId] || '/maps/customs.svg');
  }, [mapId, normalizedMapId]);

  const handleImageError = () => {
    const fallback = ONLINE_FALLBACK_URLS[normalizedMapId];
    if (fallback && currentImgSrc !== fallback) {
      console.log('Local map image failed, switching to GitHub fallback:', fallback);
      setCurrentImgSrc(fallback);
    } else {
      setMapLoadError(true);
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.3, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.3, 0.6));
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setScale((prev) => Math.max(0.6, Math.min(prev + delta, 4)));
  };

  return (
    <div className="map-viewer-container flex-1 relative overflow-hidden bg-zinc-950 select-none flex flex-col h-full">
      {/* Map Top Bar Info */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3 bg-zinc-900/90 backdrop-blur-md border border-zinc-800/80 px-4 py-2.5 rounded-xl shadow-2xl">
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <Layers size={18} />
        </div>
        <div>
          <h2 className="text-white font-bold text-base leading-tight tracking-wide flex items-center gap-2">
            {mapName}
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono">
              MAP
            </span>
          </h2>
          <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
            <span>표시된 퀘스트 핀:</span>
            <span className="font-bold text-amber-400">{markers.length}개</span>
            <span className="text-zinc-600">|</span>
            <span>수락한 퀘스트:</span>
            <span className="text-zinc-300">{activeCount}개</span>
          </p>
        </div>
      </div>

      {/* Map Control Buttons */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-zinc-900/90 backdrop-blur-md border border-zinc-800/80 p-1.5 rounded-xl shadow-2xl">
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          title="확대 (+)"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          title="축소 (-)"
        >
          <ZoomOut size={18} />
        </button>
        <div className="h-px bg-zinc-800 my-0.5" />
        <button
          onClick={handleResetZoom}
          className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          title="화면 초기화"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Interactive Map Viewport */}
      <div
        ref={containerRef}
        className={`w-full h-full flex items-center justify-center cursor-${isDragging ? 'grabbing' : 'grab'} overflow-hidden relative p-8`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="relative transition-transform duration-75 ease-out origin-center inline-block"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            width: '90%',
            maxWidth: '1200px',
          }}
        >
          {/* Map Image / SVG */}
          {!mapLoadError ? (
            <img
              src={currentImgSrc}
              alt={mapName}
              className="w-full h-auto block rounded-2xl shadow-2xl border border-zinc-800/50 pointer-events-none bg-zinc-900/60"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-96 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center">
              <Crosshair size={48} className="text-amber-500/40 mb-3" />
              <p className="text-zinc-300 font-medium text-lg">{mapName} 지도 라벨</p>
              <p className="text-zinc-500 text-sm mt-1 max-w-sm">
                지도를 로딩하는 중이거나 대체 이미지 플레이스홀더를 표시 중입니다.
              </p>
            </div>
          )}

          {/* Grid Overlay for Tactical Look */}
          <div className="absolute inset-0 border border-amber-500/10 rounded-2xl pointer-events-none bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />

          {/* Quest Markers Layer */}
          {markers.map((marker) => (
            <div
              key={marker.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMarker(marker);
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10 hover:z-30 transition-all duration-150"
              style={{
                left: `${marker.xPercent}%`,
                top: `${marker.yPercent}%`,
              }}
            >
              {/* Marker Pin Icon */}
              <div className="relative flex items-center justify-center">
                <div className="absolute w-8 h-8 rounded-full bg-amber-500/20 animate-ping opacity-75" />
                <div className="p-2 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-zinc-950 shadow-lg border-2 border-zinc-900 group-hover:scale-125 transition-transform duration-200">
                  <MapPin size={16} className="fill-current" />
                </div>
              </div>

              {/* Marker Label Badge */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap bg-zinc-900/95 border border-zinc-700/80 px-2.5 py-1 rounded-md shadow-xl text-xs text-amber-300 font-medium">
                {marker.questTitle}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Marker Detail Modal / Tooltip */}
      {selectedMarker && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-zinc-900/95 backdrop-blur-xl border border-amber-500/40 p-4 rounded-2xl shadow-2xl max-w-md w-11/12 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <MapPin size={20} />
              </div>
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
                  {selectedMarker.traderName}
                </span>
                <h4 className="text-white font-bold text-base mt-1">{selectedMarker.questTitle}</h4>
                {selectedMarker.questTitleEn && selectedMarker.questTitleEn !== selectedMarker.questTitle && (
                  <p className="text-xs text-zinc-400 font-medium">{selectedMarker.questTitleEn}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedMarker(null)}
              className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-zinc-800 text-sm text-zinc-300 space-y-1.5">
            <p className="flex items-start gap-2">
              <span className="text-amber-500 font-semibold min-w-16">목표:</span>
              <span className="text-zinc-200">{selectedMarker.objectiveText}</span>
            </p>
            <p className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="min-w-16 text-zinc-500">맵 위치:</span>
              <span>
                2D (X: {selectedMarker.xPercent}%, Y: {selectedMarker.yPercent}%)
                {selectedMarker.floor && ` • 층: ${selectedMarker.floor}`}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
