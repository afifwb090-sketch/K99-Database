import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  ArrowDownUp,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  History,
  Search,
  Filter,
  DollarSign,
  Download,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { RawMaterial, MaterialCategory, StockMovement } from '../types';
import { useApp } from '../context/AppContext';
import { formatIDR, formatNumber, formatDateTime, downloadCSV } from '../utils/formatters';

export const InventoryView: React.FC = () => {
  const {
    rawMaterials,
    stockMovements,
    restockMaterial,
    adjustMaterialStock,
    addRawMaterial,
    updateRawMaterial,
    lowStockItems,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'materials' | 'history'>('materials');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Restock modal state
  const [restockItem, setRestockItem] = useState<RawMaterial | null>(null);
  const [restockQty, setRestockQty] = useState<number>(0);
  const [restockTotalCost, setRestockTotalCost] = useState<number>(0);
  const [restockSupplier, setRestockSupplier] = useState<string>('');
  const [restockNotes, setRestockNotes] = useState<string>('');
  const [restockAutoExpense, setRestockAutoExpense] = useState<boolean>(true);
  const [restockPaymentMethod, setRestockPaymentMethod] = useState<'Kas Tunai' | 'Rekening Bank'>('Kas Tunai');

  // Stock Adjustment modal state
  const [adjustItem, setAdjustItem] = useState<RawMaterial | null>(null);
  const [adjustNewStock, setAdjustNewStock] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<'WASTE_SPOIL' | 'MANUAL_ADJUSTMENT'>('MANUAL_ADJUSTMENT');
  const [adjustNotes, setAdjustNotes] = useState<string>('');

  // Add new material modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newMatName, setNewMatName] = useState<string>('');
  const [newMatSku, setNewMatSku] = useState<string>('');
  const [newMatCategory, setNewMatCategory] = useState<MaterialCategory>('Biji Kopi');
  const [newMatStock, setNewMatStock] = useState<number>(0);
  const [newMatUnit, setNewMatUnit] = useState<any>('g');
  const [newMatMinStock, setNewMatMinStock] = useState<number>(500);
  const [newMatCost, setNewMatCost] = useState<number>(150);
  const [newMatSupplier, setNewMatSupplier] = useState<string>('');

  const categories = [
    'Semua',
    'Biji Kopi',
    'Susu & Dairy',
    'Pemanis & Sirup',
    'Bubuk Minuman',
    'Kemasan',
    'Bahan Makanan',
  ];

  // Total inventory asset value
  const totalInventoryAssetValue = useMemo(() => {
    return rawMaterials.reduce((sum, m) => sum + m.currentStock * m.costPerUnit, 0);
  }, [rawMaterials]);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return rawMaterials.filter((m) => {
      const matchCat = selectedCategory === 'Semua' || m.category === selectedCategory;
      const matchQuery =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.supplier.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [rawMaterials, selectedCategory, searchQuery]);

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return stockMovements.filter((sm) => {
      return (
        sm.rawMaterialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sm.referenceId && sm.referenceId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (sm.notes && sm.notes.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [stockMovements, searchQuery]);

  // Handle restock submit
  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem || restockQty <= 0) return;

    restockMaterial({
      materialId: restockItem.id,
      quantityToAdd: restockQty,
      totalCost: restockTotalCost,
      supplier: restockSupplier || restockItem.supplier,
      notes: restockNotes,
      autoRecordExpense: restockAutoExpense,
      paymentMethod: restockPaymentMethod,
    });

    setRestockItem(null);
    setRestockQty(0);
    setRestockTotalCost(0);
  };

  // Handle adjustment submit
  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem) return;

    adjustMaterialStock(adjustItem.id, adjustNewStock, adjustType, adjustNotes);
    setAdjustItem(null);
  };

  // Handle new material submit
  const handleAddNewMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim()) return;

    addRawMaterial({
      name: newMatName.trim(),
      sku: newMatSku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      category: newMatCategory,
      currentStock: Number(newMatStock),
      unit: newMatUnit,
      minStockThreshold: Number(newMatMinStock),
      costPerUnit: Number(newMatCost),
      lastPurchaseDate: new Date().toISOString().split('T')[0],
      supplier: newMatSupplier.trim() || 'Supplier Lokal',
    });

    setIsAddModalOpen(false);
    setNewMatName('');
    setNewMatSku('');
  };

  // Export inventory CSV
  const handleExportCSV = () => {
    const headers = 'SKU,Nama Bahan,Kategori,Stok Saat Ini,Satuan,Batas Minimum,Harga Satuan (HPP),Total Nilai,Supplier,Status\n';
    const rows = rawMaterials
      .map((m) => {
        const status =
          m.currentStock === 0 ? 'Habis' : m.currentStock <= m.minStockThreshold ? 'Menipis' : 'Aman';
        return `"${m.sku}","${m.name}","${m.category}",${m.currentStock},"${m.unit}",${m.minStockThreshold},${m.costPerUnit},${
          m.currentStock * m.costPerUnit
        },"${m.supplier}","${status}"`;
      })
      .join('\n');
    downloadCSV(`k99_inventaris_bahan_${new Date().toISOString().split('T')[0]}.csv`, headers + rows);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Value */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 block font-medium">Total Nilai Aset Stok</span>
            <span className="text-lg font-bold text-white font-mono tabular-nums block mt-1">
              {formatIDR(totalInventoryAssetValue)}
            </span>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">
              Dihitung dari {rawMaterials.length} jenis bahan
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-500">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 block font-medium">Perlu Segera Restock</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`text-lg font-bold font-mono tabular-nums ${
                  lowStockItems.length > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {lowStockItems.length}
              </span>
              <span className="text-xs text-neutral-400">Bahan</span>
            </div>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">
              {lowStockItems.length > 0
                ? `${lowStockItems.map((m) => m.name.split(' ')[0]).join(', ')} menipis`
                : 'Semua stok dalam ambang aman'}
            </span>
          </div>
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
              lowStockItems.length > 0
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            {lowStockItems.length > 0 ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
          </div>
        </div>

        {/* Total Stock Movement Logs */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 block font-medium">Riwayat Pergerakan Stok</span>
            <span className="text-lg font-bold text-white font-mono tabular-nums block mt-1">
              {stockMovements.length}
            </span>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">Log audit terintegrasi kasir</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-blue-400">
            <History className="w-5 h-5" />
          </div>
        </div>

        {/* Quick Add / Restock Action Button */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs text-neutral-400 block font-medium">Manajemen Inventaris</span>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Bahan Baru</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="p-2 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors"
              title="Unduh Data CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        {/* Navigation Tabs between Materials & History */}
        <div className="px-6 py-4 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900/50">
          <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-lg border border-neutral-800/80 w-fit">
            <button
              onClick={() => setActiveTab('materials')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'materials'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Daftar Bahan Baku ({rawMaterials.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'history'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Kartu Stok / Log Pergerakan</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari bahan, SKU, supplier..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Tab 1: Materials List */}
        {activeTab === 'materials' && (
          <div className="p-6 space-y-4">
            {/* Category Segmented Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                      isSelected
                        ? 'bg-neutral-800 text-white border border-neutral-700'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-neutral-800 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950/80 text-neutral-400 uppercase tracking-wider font-semibold border-b border-neutral-800">
                  <tr>
                    <th className="py-3 px-4">Nama Bahan & SKU</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4 text-right">Stok Saat Ini</th>
                    <th className="py-3 px-4 text-right">Batas Min.</th>
                    <th className="py-3 px-4 text-right">HPP / Unit</th>
                    <th className="py-3 px-4 text-right">Total Nilai</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-mono">
                  {filteredMaterials.map((mat) => {
                    const isDepleted = mat.currentStock <= 0;
                    const isLow = mat.currentStock <= mat.minStockThreshold;
                    const totalVal = mat.currentStock * mat.costPerUnit;

                    return (
                      <tr key={mat.id} className="hover:bg-neutral-800/30 transition-colors">
                        {/* Name & SKU */}
                        <td className="py-3 px-4 font-sans">
                          <div className="font-semibold text-white">{mat.name}</div>
                          <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
                            <span className="font-mono">{mat.sku}</span>
                            <span>·</span>
                            <span>{mat.supplier}</span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 font-sans text-neutral-400">
                          {mat.category}
                        </td>

                        {/* Current Stock */}
                        <td className="py-3 px-4 text-right font-bold text-white tabular-nums">
                          {formatNumber(mat.currentStock)} {mat.unit}
                        </td>

                        {/* Min Stock */}
                        <td className="py-3 px-4 text-right text-neutral-400 tabular-nums">
                          {formatNumber(mat.minStockThreshold)} {mat.unit}
                        </td>

                        {/* Cost per unit */}
                        <td className="py-3 px-4 text-right text-neutral-300 tabular-nums">
                          {formatIDR(mat.costPerUnit)} / {mat.unit}
                        </td>

                        {/* Total Value */}
                        <td className="py-3 px-4 text-right font-semibold text-amber-400 tabular-nums">
                          {formatIDR(totalVal)}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center font-sans">
                          {isDepleted ? (
                            <span className="text-[10px] font-bold text-red-400 bg-red-950/80 border border-red-800 px-2 py-0.5 rounded">
                              Habis
                            </span>
                          ) : isLow ? (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded">
                              Menipis
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                              Aman
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center font-sans">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setRestockItem(mat);
                                setRestockQty(mat.unit === 'g' || mat.unit === 'ml' ? 1000 : 50);
                                setRestockTotalCost(
                                  (mat.unit === 'g' || mat.unit === 'ml' ? 1000 : 50) * mat.costPerUnit
                                );
                                setRestockSupplier(mat.supplier);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-md transition-colors"
                            >
                              + Restock
                            </button>
                            <button
                              onClick={() => {
                                setAdjustItem(mat);
                                setAdjustNewStock(mat.currentStock);
                              }}
                              className="p-1 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-md border border-neutral-700 transition-colors"
                              title="Opname / Waste Penyesuaian"
                            >
                              <ArrowDownUp className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Stock Movement Ledger (Audit Trail) */}
        {activeTab === 'history' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>Mencatat setiap kali stok berkurang karena pesanan POS atau bertambah saat restock.</span>
              <span className="font-mono tabular-nums">{filteredMovements.length} riwayat</span>
            </div>

            <div className="overflow-x-auto border border-neutral-800 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950/80 text-neutral-400 uppercase tracking-wider font-semibold border-b border-neutral-800">
                  <tr>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Bahan Baku</th>
                    <th className="py-3 px-4">Tipe Aksi</th>
                    <th className="py-3 px-4 text-right">Perubahan</th>
                    <th className="py-3 px-4 text-right">Saldo Akhir</th>
                    <th className="py-3 px-4">Referensi / No. Order</th>
                    <th className="py-3 px-4">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-mono">
                  {filteredMovements.map((sm) => {
                    const isPositive = sm.quantityChange > 0;
                    return (
                      <tr key={sm.id} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="py-2.5 px-4 text-neutral-400 whitespace-nowrap">
                          {formatDateTime(sm.timestamp)}
                        </td>
                        <td className="py-2.5 px-4 font-sans font-semibold text-white">
                          {sm.rawMaterialName}
                        </td>
                        <td className="py-2.5 px-4 font-sans">
                          {sm.type === 'SALE_DEDUCTION' && (
                            <span className="text-amber-400 font-medium">Penjualan Kasir</span>
                          )}
                          {sm.type === 'PURCHASE_RESTOCK' && (
                            <span className="text-emerald-400 font-medium">Restock Pembelian</span>
                          )}
                          {sm.type === 'WASTE_SPOIL' && (
                            <span className="text-red-400 font-medium">Bahan Basi / Waste</span>
                          )}
                          {sm.type === 'MANUAL_ADJUSTMENT' && (
                            <span className="text-blue-400 font-medium">Stock Opname</span>
                          )}
                        </td>
                        <td
                          className={`py-2.5 px-4 text-right font-bold tabular-nums ${
                            isPositive ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {isPositive ? `+${formatNumber(sm.quantityChange)}` : formatNumber(sm.quantityChange)}{' '}
                          {sm.unit}
                        </td>
                        <td className="py-2.5 px-4 text-right text-neutral-300 font-bold tabular-nums">
                          {formatNumber(sm.stockAfter)} {sm.unit}
                        </td>
                        <td className="py-2.5 px-4 text-neutral-300 font-sans">
                          {sm.referenceId || '-'}
                        </td>
                        <td className="py-2.5 px-4 text-neutral-400 font-sans text-[11px] max-w-xs truncate">
                          {sm.notes || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Restock Modal */}
      {restockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
              <div>
                <h3 className="text-base font-bold text-white">Restock / Tambah Bahan Baku</h3>
                <span className="text-xs text-neutral-400">{restockItem.name}</span>
              </div>
              <button
                onClick={() => setRestockItem(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">
                    Jumlah Masuk ({restockItem.unit})
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={restockQty || ''}
                    onChange={(e) => {
                      const q = Number(e.target.value);
                      setRestockQty(q);
                      setRestockTotalCost(q * restockItem.costPerUnit);
                    }}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">
                    Total Biaya Beli (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={restockTotalCost || ''}
                    onChange={(e) => setRestockTotalCost(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Supplier / Pemasok</label>
                <input
                  type="text"
                  value={restockSupplier}
                  onChange={(e) => setRestockSupplier(e.target.value)}
                  placeholder="Contoh: K99 Roastery / Greenfields"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Catatan Pembelian</label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  placeholder="No faktur / batch roast..."
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Automatic accounting expense integration checkbox */}
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={restockAutoExpense}
                    onChange={(e) => setRestockAutoExpense(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-white">
                    Otomatis catat belanja ini ke Laporan Keuangan (Arus Kas Keluar)
                  </span>
                </label>

                {restockAutoExpense && (
                  <div className="flex items-center gap-3 pl-6 pt-1 text-[11px] text-neutral-400">
                    <span>Sumber Dana:</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="payMethod"
                        checked={restockPaymentMethod === 'Kas Tunai'}
                        onChange={() => setRestockPaymentMethod('Kas Tunai')}
                      />
                      <span>Kas Tunai Laci</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="payMethod"
                        checked={restockPaymentMethod === 'Rekening Bank'}
                        onChange={() => setRestockPaymentMethod('Rekening Bank')}
                      />
                      <span>Rekening Bank</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRestockItem(null)}
                  className="px-4 py-2 text-neutral-400 hover:text-white bg-neutral-800 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm"
                >
                  Simpan Restock ({formatNumber(restockQty)} {restockItem.unit})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {adjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
              <h3 className="text-base font-bold text-white">Penyesuaian Stok (Opname / Waste)</h3>
              <button
                onClick={() => setAdjustItem(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <span className="text-neutral-400 block">Bahan Baku:</span>
                <span className="font-bold text-white text-sm">{adjustItem.name}</span>
                <span className="block text-neutral-500 font-mono mt-0.5">
                  Stok Sistem Saat Ini: {formatNumber(adjustItem.currentStock)} {adjustItem.unit}
                </span>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Jenis Penyesuaian</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="MANUAL_ADJUSTMENT">Stock Opname Fisik (Koreksi Selisih)</option>
                  <option value="WASTE_SPOIL">Bahan Tumpah / Rusak / Kadaluarsa (Waste)</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  Stok Fisik Baru Sebenarnya ({adjustItem.unit})
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={adjustNewStock}
                  onChange={(e) => setAdjustNewStock(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                />
                <span className="block text-[11px] text-neutral-400 mt-1">
                  Selisih: {adjustNewStock - adjustItem.currentStock} {adjustItem.unit}
                </span>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Alasan Penyesuaian</label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Contoh: Susu tumpah saat kalibrasi latte art"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustItem(null)}
                  className="px-4 py-2 text-neutral-400 hover:text-white bg-neutral-800 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm"
                >
                  Perbarui Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Material Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
              <h3 className="text-base font-bold text-white">Tambah Bahan Baku Baru</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewMaterial} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Nama Bahan</label>
                  <input
                    type="text"
                    required
                    value={newMatName}
                    onChange={(e) => setNewMatName(e.target.value)}
                    placeholder="Contoh: Sirup Hazelnut Monin"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">SKU / Kode Bahan</label>
                  <input
                    type="text"
                    value={newMatSku}
                    onChange={(e) => setNewMatSku(e.target.value)}
                    placeholder="SYRUP-HZ-01"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Kategori</label>
                  <select
                    value={newMatCategory}
                    onChange={(e) => setNewMatCategory(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    {categories.filter((c) => c !== 'Semua').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Satuan</label>
                  <select
                    value={newMatUnit}
                    onChange={(e) => setNewMatUnit(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="g">Gram (g)</option>
                    <option value="ml">Mililiter (ml)</option>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="sheet">Lembar (sheet)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Stok Awal</label>
                  <input
                    type="number"
                    min="0"
                    value={newMatStock}
                    onChange={(e) => setNewMatStock(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Batas Minimum</label>
                  <input
                    type="number"
                    min="0"
                    value={newMatMinStock}
                    onChange={(e) => setNewMatMinStock(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">HPP per Unit (Rp)</label>
                  <input
                    type="number"
                    min="1"
                    value={newMatCost}
                    onChange={(e) => setNewMatCost(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Supplier / Pemasok</label>
                <input
                  type="text"
                  value={newMatSupplier}
                  onChange={(e) => setNewMatSupplier(e.target.value)}
                  placeholder="Nama distributor atau pemasok"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-white bg-neutral-800 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm"
                >
                  Simpan Bahan Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
