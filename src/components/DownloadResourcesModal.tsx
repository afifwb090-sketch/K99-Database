import React, { useState } from 'react';
import {
  Download,
  FolderArchive,
  Database,
  FileSpreadsheet,
  Terminal,
  ExternalLink,
  CheckCircle,
  Copy,
  Check,
  X,
  FileCode,
  Laptop,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { downloadProjectZip, downloadBackupJson } from '../utils/projectDownloader';

interface DownloadResourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadResourcesModal: React.FC<DownloadResourcesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    storeSettings,
    menuItems,
    rawMaterials,
    transactions,
    currentShift,
    customers,
  } = useApp();

  const [isZipping, setIsZipping] = useState(false);
  const [zipStatus, setZipStatus] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      await downloadProjectZip((status) => setZipStatus(status));
      setTimeout(() => {
        setIsZipping(false);
        setZipStatus(null);
      }, 3000);
    } catch (err) {
      console.error('Failed to create project ZIP:', err);
      setZipStatus('Gagal membuat zip, silakan coba lagi.');
      setIsZipping(false);
    }
  };

  const handleDownloadDatabaseJson = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      storeSettings,
      menuItems,
      rawMaterials,
      transactions,
      currentShift,
      customers,
    };
    downloadBackupJson(backupData);
  };

  const handleDownloadTransactionsCsv = () => {
    const headers = ['ID Transaksi', 'Waktu', 'Saluran', 'Tipe Order', 'Pelanggan', 'Metode Bayar', 'Subtotal', 'Diskon', 'Pajak', 'Total Tagihan'];
    const rows = transactions.map((t) => [
      t.id,
      t.timestamp,
      t.channel,
      t.orderType,
      `"${t.customerName || 'Walk-in'}"`,
      t.paymentMethod,
      t.subtotal,
      t.discountAmount,
      t.taxAmount,
      t.totalAmount,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `k99_coffee_transaksi_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyCommand = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Pusat Unduh Resource & Source Code
              </h2>
              <p className="text-xs text-neutral-400">
                Unduh seluruh kode sumber proyek, database kedai, atau file cadangan K99 Coffee POS
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Option 1: Direct Source Code ZIP */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-neutral-900 to-neutral-900 border border-amber-500/30 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <FolderArchive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Unduh Seluruh Source Code Proyek (.ZIP)
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Lengkap
                    </span>
                  </h3>
                  <p className="text-neutral-400 mt-1 leading-relaxed">
                    Termasuk seluruh kode React, komponen kasir, resep BOM, grafik tren Recharts, Tailwind CSS, ikon PWA desktop, backend Express, dan wrapper Electron.
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownloadZip}
                disabled={isZipping}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-900/40 flex items-center gap-2 transition transform active:scale-95 shrink-0 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isZipping ? 'Mengompresi...' : 'Unduh ZIP'}</span>
              </button>
            </div>

            {zipStatus && (
              <div className="px-3 py-2 bg-neutral-950/80 rounded-lg border border-amber-500/30 text-amber-300 flex items-center gap-2 text-[11px] animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{zipStatus}</span>
              </div>
            )}
          </div>

          {/* Option 2 & 3 Grid: Database and CSV */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Database JSON */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-white font-bold text-xs mb-1.5">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Cadangan Database (.JSON)</span>
                </div>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  Menyimpan {menuItems.length} menu produk, {rawMaterials.length} bahan baku, riwayat shift, dan {transactions.length} transaksi saat ini.
                </p>
              </div>
              <button
                onClick={handleDownloadDatabaseJson}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 font-semibold transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Database JSON</span>
              </button>
            </div>

            {/* Transactions CSV */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-white font-bold text-xs mb-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                  <span>Laporan Penjualan (.CSV)</span>
                </div>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  Ekspor rekapan tabel transaksi penjualan untuk dibuka di Microsoft Excel atau Google Spreadsheet.
                </p>
              </div>
              <button
                onClick={handleDownloadTransactionsCsv}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 font-semibold transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Format CSV (Excel)</span>
              </button>
            </div>
          </div>

          {/* AI Studio Interface instructions */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
            <div className="flex items-center gap-2 text-white font-bold">
              <HelpCircle className="w-4 h-4 text-amber-500" />
              <span>Cara Mengunduh dari Antarmuka Google AI Studio (Bilah Atas)</span>
            </div>
            <p className="text-neutral-400 leading-relaxed">
              Selain tombol unduh langsung di atas, Anda juga dapat mengunduh proyek melalui antarmuka bawaan Google AI Studio:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-neutral-300 pl-1">
              <li>
                Lihat ke <strong>pojok kanan atas antarmuka Google AI Studio</strong> (di atas panel pratinjau).
              </li>
              <li>
                Klik tombol <strong>"Export"</strong> atau menu <strong>titik tiga (⋮)</strong>.
              </li>
              <li>
                Pilih opsi <strong>"Download code as ZIP"</strong> atau <strong>"Export to GitHub"</strong> untuk menyimpan seluruh repo ke akun GitHub pribadi Anda.
              </li>
            </ol>
          </div>

          {/* Quick Start Running on Local PC */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-500" />
                Cara Menjalankan Setelah Diekstrak di Komputer Lokal:
              </span>
              <button
                onClick={() =>
                  copyCommand('npm install && npm run dev', 'install-dev')
                }
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
              >
                {copiedCmd === 'install-dev' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedCmd === 'install-dev' ? 'Tersalin' : 'Salin Perintah'}
              </button>
            </div>
            <pre className="p-3 bg-neutral-900 rounded-lg text-neutral-300 font-mono text-[11px] overflow-x-auto leading-relaxed border border-neutral-800">
{`# 1. Ekstrak file ZIP, buka terminal di folder proyek
npm install --legacy-peer-deps

# 2. Jalankan mode web lokal:
npm run dev

# 3. Atau jalankan langsung sebagai Aplikasi Desktop (Electron):
npm run desktop`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            K99 Coffee ERP • Semua resource siap digunakan secara offline
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
