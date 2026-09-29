import React, { useState } from 'react';
import {
  Clock,
  ShieldCheck,
  Banknote,
  QrCode,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Printer,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatIDR, formatDateTime } from '../utils/formatters';

export const ShiftView: React.FC = () => {
  const { currentShift, openShift, closeShift, storeSettings, expenses } = useApp();

  const [actualCash, setActualCash] = useState<number>(0);
  const [closingNotes, setClosingNotes] = useState<string>('');

  // Open shift inputs
  const [newCashier, setNewCashier] = useState<string>('Barista K99 (Shift Siang)');
  const [newInitialCash, setNewInitialCash] = useState<number>(300000);

  // Cash expenses paid from cash drawer during this shift
  const shiftCashExpenses = expenses
    .filter((e) => e.paymentMethod === 'Kas Tunai' && e.date === currentShift.date)
    .reduce((sum, e) => sum + e.amount, 0);

  const expectedCashInDrawer =
    currentShift.initialCash + currentShift.cashSales - shiftCashExpenses;

  const totalShiftSales = currentShift.cashSales + currentShift.nonCashSales;

  const handleCloseShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    closeShift(actualCash, closingNotes);
  };

  const handleOpenShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCashier.trim()) return;
    openShift(newCashier.trim(), newInitialCash);
    setActualCash(0);
  };

  const handlePrintZReport = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Manajemen Laci Kas & Shift</h2>
          <span className="text-xs text-neutral-400">
            Kontrol serah terima kasir, modal kas awal, dan rekonsiliasi uang fisik laci kasir (Z-Report).
          </span>
        </div>

        {currentShift.status === 'CLOSED' && (
          <button
            onClick={handlePrintZReport}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800 rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Laporan Tutup Shift (Z-Report)</span>
          </button>
        )}
      </div>

      {/* Main Shift Status Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-neutral-800 bg-neutral-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                currentShift.status === 'OPEN'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400'
              }`}
            >
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">
                  {currentShift.cashierName}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    currentShift.status === 'OPEN'
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                      : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                  }`}
                >
                  {currentShift.status === 'OPEN' ? 'SHIFT AKTIF' : 'SHIFT DITUTUP'}
                </span>
              </div>
              <span className="text-xs text-neutral-400 block mt-0.5">
                Dibuka pada: {formatDateTime(currentShift.startTime)}
                {currentShift.endTime && ` · Ditutup pada: ${formatDateTime(currentShift.endTime)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Shift Cash Flow Matrix */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-lg">
            <span className="text-xs text-neutral-400 block">Modal Kas Awal (Float)</span>
            <span className="text-lg font-bold text-white font-mono tabular-nums mt-1 block">
              {formatIDR(currentShift.initialCash)}
            </span>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">Uang kembalian awal di laci</span>
          </div>

          <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-lg">
            <span className="text-xs text-neutral-400 block">Penjualan Tunai Shift Ini</span>
            <span className="text-lg font-bold text-amber-400 font-mono tabular-nums mt-1 block">
              {formatIDR(currentShift.cashSales)}
            </span>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">Uang masuk fisik kasir</span>
          </div>

          <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-lg">
            <span className="text-xs text-neutral-400 block">Penjualan QRIS & EDC</span>
            <span className="text-lg font-bold text-blue-400 font-mono tabular-nums mt-1 block">
              {formatIDR(currentShift.nonCashSales)}
            </span>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">Masuk langsung ke rekening</span>
          </div>

          <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-lg">
            <span className="text-xs text-neutral-400 block">Seharusnya Uang di Laci</span>
            <span className="text-lg font-bold text-emerald-400 font-mono tabular-nums mt-1 block">
              {formatIDR(expectedCashInDrawer)}
            </span>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">
              Modal + Tunai - Beban Kas ({formatIDR(shiftCashExpenses)})
            </span>
          </div>
        </div>

        {/* Bottom Section: Close Shift or Open New Shift */}
        <div className="p-6 border-t border-neutral-800 bg-neutral-950/40">
          {currentShift.status === 'OPEN' ? (
            <div className="max-w-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Formulir Tutup Shift (End of Shift / Z-Report)
              </h3>
              <p className="text-xs text-neutral-400">
                Hitung seluruh uang tunai fisik (kertas & koin) yang ada di laci kasir, lalu masukkan totalnya di bawah.
                Sistem akan menghitung apakah kas sesuai, lebih, atau kurang.
              </p>

              <form onSubmit={handleCloseShiftSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">
                    Hitungan Fisik Uang di Laci Kasir (Rp):
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={actualCash || ''}
                    onChange={(e) => setActualCash(Number(e.target.value))}
                    placeholder="Contoh: 358300"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                {actualCash > 0 && (
                  <div
                    className={`p-3 rounded-lg border flex items-center justify-between text-xs font-semibold ${
                      actualCash === expectedCashInDrawer
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                        : actualCash > expectedCashInDrawer
                        ? 'bg-blue-950/60 border-blue-800 text-blue-400'
                        : 'bg-red-950/60 border-red-800 text-red-400'
                    }`}
                  >
                    <span>
                      {actualCash === expectedCashInDrawer
                        ? '✓ Kas Seimbang Sempurna (Tidak Ada Selisih)'
                        : actualCash > expectedCashInDrawer
                        ? 'Kas Lebih (Surplus)'
                        : 'Kas Kurang (Shortage)'}
                    </span>
                    <span className="font-mono tabular-nums">
                      {actualCash - expectedCashInDrawer >= 0 ? '+' : ''}
                      {formatIDR(actualCash - expectedCashInDrawer)}
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">
                    Catatan Tutup Shift (Optional):
                  </label>
                  <input
                    type="text"
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder="Kondisi mesin bersih, sisa biji kopi sudah dimasukkan toples..."
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm transition-colors"
                >
                  Tutup Shift Sekarang
                </button>
              </form>
            </div>
          ) : (
            <div className="max-w-xl space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle className="w-5 h-5" />
                <span>Shift Sebelumnya Telah Ditutup</span>
              </div>

              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Kas Fisik Akhir:</span>
                  <span className="font-mono font-bold text-white">
                    {formatIDR(currentShift.actualCashEnding || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Selisih Kas:</span>
                  <span
                    className={`font-mono font-bold ${
                      (currentShift.cashDifference || 0) === 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {formatIDR(currentShift.cashDifference || 0)}
                  </span>
                </div>
                {currentShift.notes && (
                  <div className="text-neutral-400 italic pt-1">
                    Catatan: "{currentShift.notes}"
                  </div>
                )}
              </div>

              <h4 className="text-sm font-bold text-white uppercase tracking-wider pt-2">
                Buka Shift Kasir Baru:
              </h4>

              <form onSubmit={handleOpenShiftSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Nama Kasir Baru:</label>
                  <input
                    type="text"
                    required
                    value={newCashier}
                    onChange={(e) => setNewCashier(e.target.value)}
                    placeholder="Contoh: Sarah (Shift Sore)"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">
                    Modal Kas Awal di Laci (Float Cash):
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newInitialCash || ''}
                    onChange={(e) => setNewInitialCash(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors"
                >
                  Buka Shift Baru
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
