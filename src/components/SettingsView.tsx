import React, { useState } from 'react';
import {
  Store,
  Percent,
  Receipt,
  Download,
  Upload,
  RotateCcw,
  Check,
  Coffee,
  Plus,
  Trash2,
  Monitor,
  Laptop,
  CheckCircle,
  Maximize2,
  Minimize2,
  Keyboard,
  FolderArchive,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StoreSettings, MenuItem, MenuCategory } from '../types';
import { formatIDR } from '../utils/formatters';
import { usePWAInstall } from '../utils/usePWAInstall';

interface SettingsViewProps {
  onOpenDownloadModal?: () => void;
  onOpenSheetsModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenDownloadModal,
  onOpenSheetsModal,
}) => {
  const {
    storeSettings,
    updateSettings,
    resetToInitialData,
    menuItems,
    addMenuItem,
    deleteMenuItem,
    rawMaterials,
  } = useApp();

  const { isInstallable, isStandalone, isInstalled, install } = usePWAInstall();

  const [settings, setSettings] = useState<StoreSettings>({ ...storeSettings });
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);

  // New menu modal
  const [isAddMenuOpen, setIsAddMenuOpen] = useState<boolean>(false);
  const [menuName, setMenuName] = useState<string>('');
  const [menuCategory, setMenuCategory] = useState<MenuCategory>('Signature Coffee');
  const [menuPrice, setMenuPrice] = useState<number>(25000);
  const [menuDesc, setMenuDesc] = useState<string>('');
  const [menuAllowsTemp, setMenuAllowsTemp] = useState<boolean>(true);
  const [menuAllowsSize, setMenuAllowsSize] = useState<boolean>(true);
  const [menuAllowsSugar, setMenuAllowsSugar] = useState<boolean>(true);
  const [menuAllowsMilk, setMenuAllowsMilk] = useState<boolean>(true);

  const categories: MenuCategory[] = [
    'Signature Coffee',
    'Espresso Based',
    'Milk & Latte',
    'Manual Brew',
    'Non-Coffee',
    'Pastry & Snacks',
    'Beans',
  ];

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleBackupJSON = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      storeSettings,
      rawMaterials,
      menuItems,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_k99_coffee_pos_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAddNewMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuName.trim()) return;

    // Default recipe with basic items if coffee
    const initialRecipe =
      menuCategory.includes('Coffee') || menuCategory === 'Milk & Latte'
        ? [
            { rawMaterialId: 'mat-1', quantity: 18, unit: 'g' as const },
            { rawMaterialId: 'mat-9', quantity: 1, unit: 'pcs' as const },
            { rawMaterialId: 'mat-11', quantity: 1, unit: 'pcs' as const },
          ]
        : [{ rawMaterialId: 'mat-9', quantity: 1, unit: 'pcs' as const }];

    addMenuItem({
      name: menuName.trim(),
      category: menuCategory,
      price: Number(menuPrice),
      description: menuDesc.trim() || 'Menu spesial racikan K99 Coffee.',
      recipe: initialRecipe,
      isAvailable: true,
      allowsTemperatureChoice: menuAllowsTemp,
      allowsSizeChoice: menuAllowsSize,
      allowsSugarLevel: menuAllowsSugar,
      allowsMilkOptions: menuAllowsMilk,
    });

    setIsAddMenuOpen(false);
    setMenuName('');
    setMenuDesc('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Pengaturan Kedai Kopi & Sistem ERP</h2>
        <span className="text-xs text-neutral-400">
          Sesuaikan identitas kedai, tarif pajak resto PB1, format struk kasir, serta cadangan data.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Store Profile & Tax */}
        <div className="lg:col-span-7 space-y-6">
          <form
            onSubmit={handleSaveSettings}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Store className="w-4 h-4 text-amber-500" />
                <span>Profil Kedai Kopi & Format Struk</span>
              </div>
              {saveSuccess && (
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                  <Check className="w-3.5 h-3.5" />
                  <span>Pengaturan Tersimpan</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Nama Kedai Kopi</label>
                <input
                  type="text"
                  required
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Tagline / Slogan</label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-300 font-semibold mb-1">Alamat Lengkap Toko</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">No. WhatsApp / Telepon</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Informasi WiFi Pengunjung</label>
                <input
                  type="text"
                  value={settings.wifiInfo}
                  onChange={(e) => setSettings({ ...settings, wifiInfo: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-300 font-semibold mb-1">Catatan Kaki Struk (Footer)</label>
              <input
                type="text"
                value={settings.receiptFooter}
                onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Tax Settings */}
            <div className="pt-3 border-t border-neutral-800 space-y-3">
              <span className="font-bold text-neutral-300 uppercase tracking-wider block">
                Pajak Restoran (PB1)
              </span>
              <div className="flex items-center justify-between p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableTax}
                    onChange={(e) => setSettings({ ...settings, enableTax: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-white">Aktifkan PB1 Restoran Otomatis</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.taxRatePercent}
                    onChange={(e) =>
                      setSettings({ ...settings, taxRatePercent: Number(e.target.value) })
                    }
                    className="w-16 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-right text-white font-mono font-bold"
                  />
                  <span className="text-neutral-400 font-mono">%</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm transition-colors"
              >
                Simpan Perubahan Profil
              </button>
            </div>
          </form>

          {/* Backup & System Reset Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4 text-xs">
            <h3 className="font-bold text-white text-sm">Cadangan Data & Reset Sistem</h3>
            <p className="text-neutral-400 leading-relaxed">
              Seluruh data inventaris bahan baku, transaksi kasir, resep BOM, dan laporan keuangan tersimpan aman
              secara offline dan lokal di browser Anda. Anda dapat mengunduh salinan berkas JSON kapan saja.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              {onOpenDownloadModal && (
                <button
                  type="button"
                  onClick={onOpenDownloadModal}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-amber-300 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 rounded-lg transition-colors"
                >
                  <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
                  <span>Unduh Source Code (.ZIP)</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleBackupJSON}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Cadangan JSON</span>
              </button>

              {!showConfirmReset ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(true)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-400 hover:text-white bg-red-950/40 hover:bg-red-900/60 border border-red-900/60 rounded-lg transition-colors ml-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset ke Data Contoh Awal</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 ml-auto bg-red-950/80 border border-red-500/40 p-2 rounded-lg">
                  <span className="text-[11px] text-red-200">Yakin reset semua data?</span>
                  <button
                    type="button"
                    onClick={() => {
                      resetToInitialData();
                      setShowConfirmReset(false);
                      setResetSuccess(true);
                      setTimeout(() => setResetSuccess(false), 3000);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold bg-red-600 hover:bg-red-500 text-white rounded"
                  >
                    Ya, Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmReset(false)}
                    className="px-2 py-1 text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>

            {resetSuccess && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Data K99 Coffee berhasil direset ke data awal.</span>
              </div>
            )}
          </div>

          {/* Integrasi Backend Google Sheets & Hosting Cloudflare Pages Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Backend Google Sheets & Hosting Cloudflare</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                Serverless & Gratis
              </span>
            </div>

            <p className="text-neutral-400 leading-relaxed">
              K99 Coffee beroperasi sebagai <strong>Web App modern</strong> yang siap di-deploy langsung ke <strong>Cloudflare Pages</strong>. Seluruh riwayat transaksi kasir, log pemotongan bahan baku, beban operasional, dan rekap shift dapat otomatis tersinkronisasi ke Google Spreadsheet milik Anda via Google Apps Script Webhook.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1">
                <span className="font-semibold text-white block">Google Spreadsheet Database</span>
                <span className="text-neutral-400 block text-[11px]">
                  Otomatis mencatat row transaksi, pemotongan gram/ml bahan, serta akumulasi poin loyalty pelanggan secara real-time.
                </span>
              </div>

              <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1">
                <span className="font-semibold text-white block">Hosting Cloudflare Pages</span>
                <span className="text-neutral-400 block text-[11px]">
                  Routing SPA instan dengan <code className="text-emerald-300">_redirects</code> otomatis, CDN global secepat kilat, dan SSL HTTPS aktif.
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-2.5">
              {onOpenSheetsModal && (
                <button
                  type="button"
                  onClick={onOpenSheetsModal}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Buka Konfigurasi Google Sheets & Script</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Menu Master Data Management */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-white text-sm">Daftar Menu Produk ({menuItems.length})</h3>
              </div>
              <button
                onClick={() => setIsAddMenuOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Menu Baru</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-white block">{item.name}</span>
                    <span className="text-[11px] text-neutral-400">
                      {item.category} · {item.recipe.length} bahan resep
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-amber-400 tabular-nums">
                      {formatIDR(item.price)}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus menu "${item.name}" dari sistem?`)) {
                          deleteMenuItem(item.id);
                        }
                      }}
                      className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add New Menu Modal */}
      {isAddMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white">Tambah Menu Baru</h3>

            <form onSubmit={handleAddNewMenu} className="space-y-3.5">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Nama Minuman / Makanan</label>
                <input
                  type="text"
                  required
                  value={menuName}
                  onChange={(e) => setMenuName(e.target.value)}
                  placeholder="Contoh: Sea Salt Caramel Cold Brew"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Kategori</label>
                  <select
                    value={menuCategory}
                    onChange={(e) => setMenuCategory(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={menuPrice}
                    onChange={(e) => setMenuPrice(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Deskripsi Produk</label>
                <input
                  type="text"
                  value={menuDesc}
                  onChange={(e) => setMenuDesc(e.target.value)}
                  placeholder="Deskripsi singkat rasa dan racikan..."
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 border-t border-neutral-800 space-y-2">
                <span className="font-semibold text-neutral-300 block">Opsi Kustomisasi di Kasir:</span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={menuAllowsTemp}
                      onChange={(e) => setMenuAllowsTemp(e.target.checked)}
                      className="rounded text-amber-600"
                    />
                    <span>Pilihan Hot/Ice</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={menuAllowsSize}
                      onChange={(e) => setMenuAllowsSize(e.target.checked)}
                      className="rounded text-amber-600"
                    />
                    <span>Pilihan Size (Regular/Large)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={menuAllowsSugar}
                      onChange={(e) => setMenuAllowsSugar(e.target.checked)}
                      className="rounded text-amber-600"
                    />
                    <span>Sugar Level (Less/Normal)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={menuAllowsMilk}
                      onChange={(e) => setMenuAllowsMilk(e.target.checked)}
                      className="rounded text-amber-600"
                    />
                    <span>Pilihan Susu (Oat/Almond)</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMenuOpen(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-white bg-neutral-800 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm"
                >
                  Simpan Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
