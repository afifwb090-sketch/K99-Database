import React from 'react';
import {
  Maximize2,
  Minimize2,
  Monitor,
  Wifi,
  WifiOff,
  Laptop,
  Download,
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface DesktopWindowControlsProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenDesktopModal: () => void;
  onOpenDownloadModal?: () => void;
}

export const DesktopWindowControls: React.FC<DesktopWindowControlsProps> = ({
  isFullscreen,
  onToggleFullscreen,
  onOpenDesktopModal,
  onOpenDownloadModal,
}) => {
  const { isStandalone, isOnline } = usePWAInstall();

  return (
    <div className="bg-neutral-950 border-b border-neutral-800/80 px-3 py-1.5 flex items-center justify-between text-[11px] select-none text-neutral-400">
      {/* Left: Window simulated controls or branding */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 mr-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block hover:opacity-100 transition" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block hover:opacity-100 transition" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block hover:opacity-100 transition" />
        </div>
        <div className="flex items-center gap-1.5 font-medium text-neutral-300">
          <Monitor className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-semibold text-white">K99 Coffee POS</span>
          <span className="text-neutral-500">•</span>
          <span className="text-neutral-400 hidden sm:inline">Desktop Workstation</span>
        </div>
      </div>

      {/* Center: Status indicators */}
      <div className="flex items-center gap-2">
        {isStandalone ? (
          <span className="px-2 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 font-medium text-[10px] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Desktop Windowed Mode
          </span>
        ) : (
          <button
            onClick={onOpenDesktopModal}
            className="px-2 py-0.2 rounded bg-amber-950/40 text-amber-400 border border-amber-500/30 hover:bg-amber-900/50 font-medium text-[10px] flex items-center gap-1 transition"
          >
            <Laptop className="w-3 h-3" />
            Klik untuk Pasang ke Desktop
          </button>
        )}

        <span className="hidden md:flex items-center gap-1 text-[10px] text-neutral-400">
          {isOnline ? (
            <Wifi className="w-3 h-3 text-emerald-400" />
          ) : (
            <WifiOff className="w-3 h-3 text-amber-400" />
          )}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </span>
      </div>

      {/* Right: Window actions */}
      <div className="flex items-center gap-1.5">
        {onOpenDownloadModal && (
          <button
            onClick={onOpenDownloadModal}
            className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition text-[10px] font-semibold"
            title="Unduh seluruh resource & source code proyek"
          >
            <Download className="w-3 h-3" />
            <span>Unduh Resource</span>
          </button>
        )}
        <button
          onClick={onOpenDesktopModal}
          className="px-2 py-0.5 rounded text-neutral-300 hover:text-white hover:bg-neutral-800 transition text-[10px]"
          title="Buka panduan & shortcut desktop"
        >
          Shortcut & Panduan
        </button>
        <button
          onClick={onToggleFullscreen}
          className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          title={isFullscreen ? 'Keluar Fullscreen (F11)' : 'Layar Penuh Kiosk Kasir (F11)'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
};

