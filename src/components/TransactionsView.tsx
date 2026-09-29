import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Printer,
  Ban,
  PackageMinus,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Filter,
  Image as ImageIcon,
  Award,
  Globe,
  Store,
  X,
} from 'lucide-react';
import { Transaction } from '../types';
import { useApp } from '../context/AppContext';
import { formatIDR, formatDateTime, downloadCSV } from '../utils/formatters';
import { ReceiptModal } from './ReceiptModal';

export const TransactionsView: React.FC = () => {
  const { transactions, voidTransaction } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [viewingReceiptTx, setViewingReceiptTx] = useState<Transaction | null>(null);

  // Void confirmation modal state
  const [txToVoid, setTxToVoid] = useState<Transaction | null>(null);
  const [returnStockOnVoid, setReturnStockOnVoid] = useState<boolean>(true);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        tx.id.toLowerCase().includes(q) ||
        tx.customerName.toLowerCase().includes(q) ||
        (tx.onlineOrderNumber && tx.onlineOrderNumber.toLowerCase().includes(q));

      const matchChannel =
        selectedChannel === 'Semua' ||
        (selectedChannel === 'OFFLINE' && tx.channel === 'OFFLINE') ||
        (selectedChannel === 'ONLINE' && tx.channel === 'ONLINE') ||
        (selectedChannel === tx.onlinePlatform);

      const matchStatus = selectedStatus === 'Semua' || tx.status === selectedStatus;

      return matchSearch && matchChannel && matchStatus;
    });
  }, [transactions, searchQuery, selectedChannel, selectedStatus]);

  const handleExportCSV = () => {
    const headers =
      'Invoice ID,Tanggal Waktu,Saluran,Platform,No Order Online,Pelanggan,Metode Bayar,Subtotal,Diskon,Pajak,Total,Penghasilan Bersih Online,HPP (COGS),Laba Kotor,Status\n';
    const rows = filteredTransactions
      .map((t) => {
        return `"${t.id}","${t.timestamp}","${t.channel}","${t.onlinePlatform || '-'}","${
          t.onlineOrderNumber || '-'
        }","${t.customerName}","${t.paymentMethod}",${t.subtotal},${t.discountAmount},${t.taxAmount},${
          t.totalAmount
        },${t.onlineNetIncome || '-'},${t.totalCOGS},${t.grossProfit},"${t.status}"`;
      })
      .join('\n');

    downloadCSV(
      `k99_riwayat_transaksi_${new Date().toISOString().split('T')[0]}.csv`,
      headers + rows
    );
  };

  const handleConfirmVoid = () => {
    if (!txToVoid) return;
    voidTransaction(txToVoid.id, returnStockOnVoid);
    setTxToVoid(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Riwayat Transaksi POS</h2>
          <span className="text-xs text-neutral-400">
            Daftar invoice penjualan offline kedai dan online ojol (ShopeeFood, GrabFood, GoFood).
          </span>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors w-fit"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Ekspor Data Transaksi (CSV)</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ID transaksi, nama pelanggan, no ojol..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400">Saluran:</span>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="Semua">Semua Saluran</option>
              <option value="OFFLINE">Offline (Kedai)</option>
              <option value="ONLINE">Semua Online (Ojol)</option>
              <option value="ShopeeFood">ShopeeFood</option>
              <option value="GrabFood">GrabFood</option>
              <option value="GoFood">GoFood</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="Semua">Semua Status</option>
              <option value="COMPLETED">Berhasil (Completed)</option>
              <option value="CANCELLED">Dibatalkan (Void)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 text-neutral-400 uppercase tracking-wider font-semibold border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Invoice / Waktu</th>
                <th className="py-3 px-4">Saluran & Pelanggan</th>
                <th className="py-3 px-4">Rincian Menu Pesanan</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4 text-right">Total Menu</th>
                <th className="py-3 px-4 text-right">Net Bersih</th>
                <th className="py-3 px-4 text-right">HPP Bahan</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-500 font-sans">
                    Tidak ada riwayat transaksi yang cocok.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isCompleted = tx.status === 'COMPLETED';

                  return (
                    <tr key={tx.id} className="hover:bg-neutral-800/30 transition-colors">
                      {/* Invoice & Time */}
                      <td className="py-3 px-4 font-sans">
                        <span className="font-bold text-white block font-mono">{tx.id}</span>
                        <span className="text-[11px] text-neutral-400 block mt-0.5">
                          {formatDateTime(tx.timestamp)}
                        </span>
                      </td>

                      {/* Channel & Customer */}
                      <td className="py-3 px-4 font-sans">
                        <div className="flex items-center gap-1.5 mb-1">
                          {tx.channel === 'ONLINE' ? (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                tx.onlinePlatform === 'ShopeeFood'
                                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                                  : tx.onlinePlatform === 'GrabFood'
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                  : 'bg-red-500/20 text-red-400 border-red-500/40'
                              }`}
                            >
                              {tx.onlinePlatform}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                              Offline Kedai
                            </span>
                          )}
                          {tx.pointsEarned && (
                            <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-0.5">
                              <Award className="w-2.5 h-2.5" />
                              <span>+{tx.pointsEarned} Poin</span>
                            </span>
                          )}
                        </div>

                        <span className="font-semibold text-neutral-200 block">{tx.customerName}</span>
                        {tx.onlineOrderNumber && (
                          <span className="text-[10px] text-neutral-400 block font-mono">
                            No: {tx.onlineOrderNumber}
                          </span>
                        )}
                      </td>

                      {/* Items Preview */}
                      <td className="py-3 px-4 font-sans max-w-xs">
                        <div className="truncate text-neutral-300">
                          {tx.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">
                          {tx.deductedMaterials?.length || 0} bahan baku dipotong otomatis
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-4 font-sans text-neutral-300">
                        <span>{tx.paymentMethod}</span>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-4 text-right font-bold text-white tabular-nums">
                        {formatIDR(tx.totalAmount)}
                      </td>

                      {/* Net Income */}
                      <td className="py-3 px-4 text-right font-bold tabular-nums text-emerald-400">
                        {tx.channel === 'ONLINE' && tx.onlineNetIncome
                          ? formatIDR(tx.onlineNetIncome)
                          : formatIDR(tx.totalAmount - tx.taxAmount)}
                      </td>

                      {/* HPP / COGS */}
                      <td className="py-3 px-4 text-right text-amber-400 font-semibold tabular-nums">
                        {formatIDR(tx.totalCOGS)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center font-sans">
                        {isCompleted ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                            Sukses
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-red-400 bg-red-950/80 border border-red-800 px-2 py-0.5 rounded">
                            Dibatalkan
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center font-sans">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewingReceiptTx(tx)}
                            className="p-1.5 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-md border border-neutral-700 transition-colors"
                            title="Lihat / Cetak Struk"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {isCompleted && (
                            <button
                              onClick={() => setTxToVoid(tx)}
                              className="p-1.5 text-neutral-400 hover:text-red-400 bg-neutral-800 hover:bg-neutral-700 rounded-md border border-neutral-700 transition-colors"
                              title="Batalkan Transaksi (Void)"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Struk Modal */}
      {viewingReceiptTx && (
        <ReceiptModal transaction={viewingReceiptTx} onClose={() => setViewingReceiptTx(null)} />
      )}

      {/* Void Modal */}
      {txToVoid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <Ban className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-white">Batalkan Transaksi (Void)?</h3>
                <span className="text-xs text-neutral-400">Invoice: {txToVoid.id}</span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Transaksi sebesar <span className="font-bold font-mono text-white">{formatIDR(txToVoid.totalAmount)}</span> akan
              dibatalkan statusnya dan dikeluarkan dari total omzet penjualan.
            </p>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
              <label className="flex items-center gap-2.5 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={returnStockOnVoid}
                  onChange={(e) => setReturnStockOnVoid(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Kembalikan bahan baku yang terpotong ke gudang stok</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTxToVoid(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-800 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-sm"
              >
                Konfirmasi Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
