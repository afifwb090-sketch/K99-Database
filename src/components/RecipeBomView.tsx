import React, { useState } from 'react';
import {
  Coffee,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  Sparkles,
  X,
  Check,
} from 'lucide-react';
import { MenuItem, RecipeItem, RawMaterial } from '../types';
import { useApp } from '../context/AppContext';
import { formatIDR, formatNumber } from '../utils/formatters';

export const RecipeBomView: React.FC = () => {
  const { menuItems, rawMaterials, updateMenuRecipe, calculateRecipeCOGS } = useApp();

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [currentRecipe, setCurrentRecipe] = useState<RecipeItem[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [selectedQty, setSelectedQty] = useState<number>(10);

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setCurrentRecipe([...item.recipe]);
    if (rawMaterials.length > 0) {
      setSelectedMaterialId(rawMaterials[0].id);
    }
  };

  const handleAddIngredient = () => {
    if (!selectedMaterialId || selectedQty <= 0) return;
    const mat = rawMaterials.find((m) => m.id === selectedMaterialId);
    if (!mat) return;

    // Check if material already exists in recipe
    const existingIndex = currentRecipe.findIndex((r) => r.rawMaterialId === selectedMaterialId);
    if (existingIndex >= 0) {
      const updated = [...currentRecipe];
      updated[existingIndex].quantity += selectedQty;
      setCurrentRecipe(updated);
    } else {
      setCurrentRecipe((prev) => [
        ...prev,
        {
          rawMaterialId: selectedMaterialId,
          quantity: selectedQty,
          unit: mat.unit,
        },
      ]);
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setCurrentRecipe((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveRecipe = () => {
    if (!editingItem) return;
    updateMenuRecipe(editingItem.id, currentRecipe);
    setEditingItem(null);
  };

  // Helper to calculate max yield possible from current inventory stock
  const calculateMaxYield = (recipe: RecipeItem[]): number => {
    if (recipe.length === 0) return 0;
    let minYield = Infinity;

    recipe.forEach((rec) => {
      const mat = rawMaterials.find((m) => m.id === rec.rawMaterialId);
      if (!mat || rec.quantity <= 0) {
        minYield = 0;
        return;
      }
      const possibleCups = Math.floor(mat.currentStock / rec.quantity);
      if (possibleCups < minYield) minYield = possibleCups;
    });

    return minYield === Infinity ? 0 : minYield;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header explanation banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-500 font-bold text-base">
            <Layers className="w-5 h-5" />
            <span>Katalog Resep & Bill of Materials (BOM)</span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Menghubungkan setiap minuman & makanan di kasir dengan bahan baku di gudang. Ketika kasir menjual 1 cup,
            sistem ERP otomatis mengurangi stok bahan sesuai takaran resep dan menghitung Harga Pokok Penjualan (HPP) riil.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-right">
            <span className="text-[11px] text-neutral-400 block">Total Menu Terhubung</span>
            <span className="text-base font-bold text-white font-mono tabular-nums">
              {menuItems.length} Produk
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Menu Recipes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {menuItems.map((item) => {
          const hpp = calculateRecipeCOGS(item.recipe);
          const grossProfit = item.price - hpp;
          const marginPct = item.price > 0 ? (grossProfit / item.price) * 100 : 0;
          const maxYield = calculateMaxYield(item.recipe);

          return (
            <div
              key={item.id}
              className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between hover:border-neutral-700 transition-colors"
            >
              {/* Card Header */}
              <div className="p-4 border-b border-neutral-800/80 bg-neutral-900/60">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                      {item.category}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">{item.name}</h4>
                  </div>
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit Resep</span>
                  </button>
                </div>

                {/* Key Financial stats */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-neutral-800/60 text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Harga Jual</span>
                    <span className="font-bold text-white font-mono tabular-nums">{formatIDR(item.price)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">HPP Bahan</span>
                    <span className="font-bold text-amber-400 font-mono tabular-nums">{formatIDR(hpp)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Margin Laba</span>
                    <span className="font-bold text-emerald-400 font-mono tabular-nums">
                      {Math.round(marginPct)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Recipe Ingredients Breakdown */}
              <div className="p-4 flex-1 space-y-2">
                <span className="text-[11px] font-semibold text-neutral-400 block uppercase tracking-wider">
                  Komposisi Takaran Resep:
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {item.recipe.length === 0 ? (
                    <div className="text-xs text-neutral-500 italic py-2">
                      Belum ada komposisi bahan. Klik Edit Resep untuk mengatur.
                    </div>
                  ) : (
                    item.recipe.map((rec, idx) => {
                      const mat = rawMaterials.find((m) => m.id === rec.rawMaterialId);
                      const costContribution = mat ? rec.quantity * mat.costPerUnit : 0;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded bg-neutral-950/60 border border-neutral-800/50"
                        >
                          <span className="text-neutral-300 font-medium truncate max-w-[150px]">
                            {mat?.name || 'Bahan tidak ditemukan'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-400 font-mono tabular-nums">
                              {rec.quantity} {rec.unit}
                            </span>
                            <span className="text-[11px] text-neutral-500 font-mono tabular-nums">
                              ({formatIDR(costContribution)})
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Card Footer: Stock Yield Availability */}
              <div className="p-3 bg-neutral-950/80 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                <span className="text-neutral-400">Kapasitas Sedia:</span>
                <span
                  className={`font-semibold font-mono tabular-nums ${
                    maxYield <= 5 ? 'text-red-400' : maxYield <= 20 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {maxYield > 0 ? `Bisa buat ${maxYield} porsi lagi` : 'Bahan Baku Habis!'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Recipe BOM Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
              <div>
                <h3 className="text-base font-bold text-white">Atur Resep & Komposisi Bahan</h3>
                <span className="text-xs text-neutral-400">{editingItem.name}</span>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Form to add new ingredient */}
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-3">
                <span className="font-semibold text-neutral-300 block">Tambah Bahan ke Resep:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-neutral-400 mb-1">Pilih Bahan Baku</label>
                    <select
                      value={selectedMaterialId}
                      onChange={(e) => setSelectedMaterialId(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      {rawMaterials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.unit}) - {formatIDR(m.costPerUnit)}/{m.unit}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Takaran per Cup</label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        min="1"
                        value={selectedQty}
                        onChange={(e) => setSelectedQty(Number(e.target.value))}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddIngredient}
                        className="px-3 py-1.5 font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors whitespace-nowrap"
                      >
                        + Tambah
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Ingredients in Recipe */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-neutral-300 uppercase tracking-wider">
                    Daftar Komposisi Resep ({currentRecipe.length} bahan):
                  </span>
                  <span className="text-amber-400 font-bold font-mono">
                    Total HPP: {formatIDR(calculateRecipeCOGS(currentRecipe))}
                  </span>
                </div>

                <div className="border border-neutral-800 rounded-lg divide-y divide-neutral-800 bg-neutral-950/40">
                  {currentRecipe.length === 0 ? (
                    <div className="p-4 text-center text-neutral-500">
                      Resep belum memiliki bahan. Silakan tambahkan di atas.
                    </div>
                  ) : (
                    currentRecipe.map((rec, index) => {
                      const mat = rawMaterials.find((m) => m.id === rec.rawMaterialId);
                      const cost = mat ? rec.quantity * mat.costPerUnit : 0;
                      return (
                        <div key={index} className="p-2.5 flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-white block">
                              {mat?.name || 'Bahan tidak dikenal'}
                            </span>
                            <span className="text-[11px] text-neutral-400 font-mono">
                              {rec.quantity} {rec.unit} · Kontribusi HPP: {formatIDR(cost)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredient(index)}
                            className="p-1.5 text-neutral-400 hover:text-red-400 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/80 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-neutral-400 hover:text-white bg-neutral-800 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveRecipe}
                className="flex items-center gap-1.5 px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Resep Menu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
