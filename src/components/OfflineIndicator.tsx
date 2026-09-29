import React from 'react';
import { WifiOff } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWAInstall();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl border border-amber-400/40 animate-bounce">
      <WifiOff className="w-4 h-4 text-white" />
      <span>Mode Offline Aktif — Transaksi & stok tetap dicatat secara lokal.</span>
    </div>
  );
};
