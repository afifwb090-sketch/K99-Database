import React from 'react';
import {
  Coffee,
  ShoppingBag,
  Package,
  FileSpreadsheet,
  Receipt,
  Clock,
  Settings,
  AlertTriangle,
  PlusCircle,
  ShieldCheck,
  Users,
  Download,
  Cloud,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export type ActiveTab =
  | 'pos'
  | 'inventory'
  | 'recipes'
  | 'customers'
  | 'reports'
  | 'transactions'
  | 'shift'
  | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenExpenseModal: () => void;
  onOpenSheetsModal: () => void;
  onOpenDownloadModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenExpenseModal,
  onOpenSheetsModal,
  onOpenDownloadModal,
}) => {
  const { lowStockItems, currentShift, storeSettings, customers } = useApp();

  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'pos', label: 'Kasir POS', icon: ShoppingBag },
    { id: 'inventory', label: 'Bahan Baku & Stok', icon: Package },
    { id: 'recipes', label: 'Resep & BOM', icon: Coffee },
    { id: 'customers', label: 'Pelanggan & Poin', icon: Users },
    { id: 'reports', label: 'Laporan Keuangan', icon: FileSpreadsheet },
    { id: 'transactions', label: 'Riwayat Transaksi', icon: Receipt },
    { id: 'shift', label: 'Shift & Kas', icon: Clock },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur border-b border-neutral-800 text-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('pos')}
              className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg p-1"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white block leading-tight">
                  {storeSettings.storeName} <span className="text-amber-500">POS</span>
                </span>
                <span className="text-xs text-neutral-400 block leading-none">
                  Sistem ERP Kedai Kopi
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-sm shadow-amber-900/40'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  {item.id === 'inventory' && lowStockItems.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded bg-amber-500/30 text-amber-300 border border-amber-500/40">
                      {lowStockItems.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2.5">
            {lowStockItems.length > 0 && (
              <button
                onClick={() => setActiveTab('inventory')}
                title={`${lowStockItems.length} bahan baku mencapai batas minimum!`}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="tabular-nums font-semibold">{lowStockItems.length}</span>
                <span className="hidden xl:inline">Bahan Menipis</span>
              </button>
            )}

            <button
              onClick={onOpenExpenseModal}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-500" />
              <span className="whitespace-nowrap">Catat Beban</span>
            </button>

            <button
              onClick={onOpenSheetsModal}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors"
              title="Integrasi Backend Google Sheets & Cloudflare Pages"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline font-bold">Google Sheets</span>
            </button>

            {onOpenDownloadModal && (
              <button
                onClick={onOpenDownloadModal}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors"
                title="Pusat Unduh Source Code & Resource Proyek"
              >
                <Download className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden xl:inline">Unduh Resource</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('shift')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors"
              title="Kelola Laci Kas & Shift"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline text-neutral-300">Shift:</span>
              <span className="text-emerald-400 truncate max-w-[90px]">
                {currentShift.cashierName.split(' ')[0]}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar for smaller screens */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-neutral-800/80 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-600 text-white'
                    : 'text-neutral-400 hover:text-white bg-neutral-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.id === 'inventory' && lowStockItems.length > 0 && (
                  <span className="px-1 text-[10px] font-bold rounded bg-amber-400 text-neutral-900">
                    {lowStockItems.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
