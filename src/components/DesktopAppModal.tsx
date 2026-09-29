import React, { useState } from 'react';
import {
  Monitor,
  Download,
  CheckCircle,
  ExternalLink,
  Laptop,
  Maximize2,
  Minimize2,
  Terminal,
  ShieldCheck,
  Wifi,
  WifiOff,
  Keyboard,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface DesktopAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenDownloadModal?: () => void;
}

export const DesktopAppModal: React.FC<DesktopAppModalProps> = ({
  isOpen,
  onClose,
  isFullscreen,
  onToggleFullscreen,
  onOpenDownloadModal,
}) => {
  const { isInstallable, isInstalled, isStandalone, isOnline, install } = usePWAInstall();
  const [activeGuideTab, setActiveGuideTab] = useState<'pwa' | 'electron' | 'shortcuts'>('pwa');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const electronInstructions = `# 1. Buka terminal proyek K99 Coffee POS
npm install -D electron

# 2. Jalankan aplikasi desktop secara instan:
npm run desktop

# 3. Untuk membuat file installer .exe (Windows) atau .dmg (macOS):
npm install -D electron-builder
npx electron-builder`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(electronInstructions);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Mode Aplikasi Desktop</h2>
                {isStandalone ? (
                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Aktif (Standalone App)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Mode Browser Web
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                Gunakan K99 Coffee POS sebagai aplikasi desktop mandiri tanpa address bar browser
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Strip & Quick Action */}
        <div className="px-6 py-3 bg-neutral-900/60 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-neutral-300">
              {isOnline ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              )}
              {isOnline ? 'Online (Terhubung)' : 'Offline (Data Tersimpan Lokal)'}
            </span>
            <span className="flex items-center gap-1.5 text-neutral-300">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Kasir Mandiri & Ramah Touchscreen
            </span>
          </div>

          <button
            onClick={onToggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 transition"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                Keluar Layar Penuh
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                Mode Kiosk Kasir (Layar Penuh)
              </>
            )}
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-3 border-b border-neutral-800 flex gap-2">
          <button
            onClick={() => setActiveGuideTab('pwa')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeGuideTab === 'pwa'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Laptop className="w-4 h-4" />
            1. Install Desktop PWA (1-Klik)
          </button>
          <button
            onClick={() => setActiveGuideTab('shortcuts')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeGuideTab === 'shortcuts'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            2. Shortcut Tombol Kasir
          </button>
          <button
            onClick={() => setActiveGuideTab('electron')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeGuideTab === 'electron'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            3. Paket Executable (.EXE / Electron)
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-sm">
          {activeGuideTab === 'pwa' && (
            <div className="space-y-4">
              {/* Standalone status check */}
              {isStandalone ? (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-emerald-300">Aplikasi Sudah Berjalan Dalam Mode Desktop!</h3>
                    <p className="text-xs text-emerald-400/90 mt-1 leading-relaxed">
                      Jendela ini sudah beroperasi penuh sebagai aplikasi desktop mandiri tanpa bilah browser.
                      Data transaksi, stok bahan baku, resep BOM, dan laporan keuangan tersimpan aman secara offline.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-neutral-800/80 border border-neutral-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <h3 className="font-bold text-white text-base">Install K99 Coffee ke Komputer Kasir</h3>
                    <p className="text-xs text-neutral-300">
                      Pasang langsung ke Windows Desktop, macOS Dock, atau Linux App Launcher dengan 1 klik.
                    </p>
                  </div>
                  {isInstallable ? (
                    <button
                      onClick={install}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-900/40 flex items-center gap-2 transition transform active:scale-95 shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      Pasang Aplikasi Desktop
                    </button>
                  ) : (
                    <div className="text-xs text-neutral-400 italic bg-neutral-900 px-3 py-2 rounded-lg border border-neutral-800">
                      Buka via Chrome atau Edge di desktop untuk aktivasi tombol 1-klik.
                    </div>
                  )}
                </div>
              )}

              {/* Instructions per OS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Windows 10 / 11 (Google Chrome & MS Edge)
                  </div>
                  <ol className="text-xs text-neutral-400 space-y-1 list-decimal list-inside leading-relaxed">
                    <li>Klik tombol <strong>Pasang Aplikasi</strong> di atas.</li>
                    <li>Atau klik ikon komputer/instal di kanan address bar browser (ikon <Download className="inline w-3 h-3 text-amber-400" />).</li>
                    <li>Pilih <strong>Install</strong>. Icon shortcut akan otomatis muncul di Desktop & Taskbar Windows.</li>
                  </ol>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Apple macOS (Chrome & Safari Sonoma+)
                  </div>
                  <ol className="text-xs text-neutral-400 space-y-1 list-decimal list-inside leading-relaxed">
                    <li>Di Chrome: Klik <strong>Settings (titik 3) &gt; Cast, Save, and Share &gt; Install K99 Coffee POS</strong>.</li>
                    <li>Di Safari macOS: Klik menu <strong>File &gt; Add to Dock...</strong></li>
                    <li>Aplikasi akan langsung berada di macOS Dock & Launchpad Anda.</li>
                  </ol>
                </div>
              </div>

              {/* Keunggulan Desktop Mode */}
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2.5">
                  Keunggulan Mode Desktop Kedai Kopi:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-neutral-300">
                  <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                    <p className="font-semibold text-white">⚡ Bebas Gangguan</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Tanpa tab browser, tombol back/forward yang rawan tertekan kasir.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                    <p className="font-semibold text-white">📶 Siap Offline 100%</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Kasir tetap bisa melayani order saat koneksi WiFi kedai sedang down.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                    <p className="font-semibold text-white">🖨️ Cetak Struk Cepat</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Integrasi print struk thermal 58mm & 80mm via shortcut Ctrl+P.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeGuideTab === 'shortcuts' && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-300">
                Gunakan keyboard fisik pada komputer kasir Anda untuk transaksi super cepat tanpa mouse:
              </p>

              <div className="border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-950 text-neutral-400 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Tombol Pintas</th>
                      <th className="py-2.5 px-4">Fungsi Tindakan</th>
                      <th className="py-2.5 px-4">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 bg-neutral-900">
                    <tr>
                      <td className="py-2 px-4 font-mono font-bold text-amber-400">F1 / Alt + 1</td>
                      <td className="py-2 px-4 text-white font-medium">Buka Menu Kasir POS</td>
                      <td className="py-2 px-4 text-neutral-400">Layar utama input pesanan tamu</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 font-mono font-bold text-amber-400">F2 / Alt + 2</td>
                      <td className="py-2 px-4 text-white font-medium">Bahan Baku & Stok</td>
                      <td className="py-2 px-4 text-neutral-400">Cek stok menipis dan restock</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 font-mono font-bold text-amber-400">F3 / Alt + 3</td>
                      <td className="py-2 px-4 text-white font-medium">Laporan & Grafik Tren</td>
                      <td className="py-2 px-4 text-neutral-400">Pantau omzet & grafik Recharts</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 font-mono font-bold text-amber-400">F4 / Alt + 4</td>
                      <td className="py-2 px-4 text-white font-medium">Catat Biaya Operasional</td>
                      <td className="py-2 px-4 text-neutral-400">Input beban operasional kedai</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 font-mono font-bold text-amber-400">F11</td>
                      <td className="py-2 px-4 text-white font-medium">Layar Penuh (Kiosk Mode)</td>
                      <td className="py-2 px-4 text-neutral-400">Kunci layar agar fokus pada kasir</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 font-mono font-bold text-amber-400">Ctrl + P</td>
                      <td className="py-2 px-4 text-white font-medium">Cetak Struk Thermal</td>
                      <td className="py-2 px-4 text-neutral-400">Dialog cetak nota ke printer kasir</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 font-mono font-bold text-amber-400">Esc</td>
                      <td className="py-2 px-4 text-white font-medium">Tutup Modal / Batal</td>
                      <td className="py-2 px-4 text-neutral-400">Kembali ke tampilan kasir</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeGuideTab === 'electron' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300">
                <p>
                  File wrapper desktop <strong><code className="text-amber-400">electron-main.cjs</code></strong> sudah disiapkan di root proyek! Anda dapat memaketkan K99 Coffee menjadi file installer native Windows <strong>(.exe)</strong>, macOS <strong>(.dmg)</strong>, atau Linux <strong>(.AppImage)</strong>.
                </p>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-amber-300 overflow-x-auto leading-relaxed">
                  {electronInstructions}
                </pre>
                <button
                  onClick={copyToClipboard}
                  className="absolute top-3 right-3 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition border border-neutral-700"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Tersalin!' : 'Salin Perintah'}
                </button>
              </div>

              <div className="text-xs text-neutral-400 space-y-1">
                <p className="font-semibold text-white">Rangkuman Paket Desktop:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li><strong>PWA Desktop (Rekomendasi Utama)</strong>: Langsung jalan tanpa compile tambahan, hemat resource RAM komputer kasir, dan update otomatis.</li>
                  <li><strong>Electron (.EXE)</strong>: Cocok jika kasir membutuhkan integrasi hardware port COM / Serial printer POS tertentu secara langsung.</li>
                </ul>
              </div>

              {onOpenDownloadModal && (
                <div className="pt-2">
                  <button
                    onClick={onOpenDownloadModal}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 font-bold flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>Unduh Source Code Lengkap (.ZIP) & Database</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            K99 Coffee ERP • Desktop Edition v2.1
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-lg transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
