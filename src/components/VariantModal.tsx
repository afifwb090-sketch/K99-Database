import React, { useState } from 'react';
import { X, Check, Flame, Snowflake, Plus } from 'lucide-react';
import { MenuItem, CartItem } from '../types';
import { formatIDR } from '../utils/formatters';
import { useApp } from '../context/AppContext';

interface VariantModalProps {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (customization: Partial<CartItem>) => void;
}

export const VariantModal: React.FC<VariantModalProps> = ({
  item,
  onClose,
  onAddToCart,
}) => {
  const { rawMaterials, calculateRecipeCOGS } = useApp();

  const [temperature, setTemperature] = useState<'Ice' | 'Hot'>(
    item.allowsTemperatureChoice ? 'Ice' : 'Ice'
  );
  const [size, setSize] = useState<'Regular' | 'Large'>('Regular');
  const [sugarLevel, setSugarLevel] = useState<'Normal' | 'Less Sugar' | 'No Sugar'>('Normal');
  const [milkType, setMilkType] = useState<'Fresh Milk' | 'Oat Milk (+6k)' | 'Almond Milk (+6k)'>(
    'Fresh Milk'
  );
  const [extraShot, setExtraShot] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  // Calculate live dynamic price
  let totalPrice = item.price;
  if (size === 'Large') totalPrice += 4000;
  if (milkType !== 'Fresh Milk') totalPrice += 6000;
  if (extraShot) totalPrice += 5000;

  // Calculate live estimated COGS (HPP)
  const baseHPP = calculateRecipeCOGS(item.recipe);
  let liveHPP = baseHPP;
  if (size === 'Large') liveHPP *= 1.25;
  if (milkType.includes('Oat Milk')) liveHPP += 2400;
  if (extraShot) liveHPP += 18 * (rawMaterials.find((m) => m.id === 'mat-1')?.costPerUnit || 180);

  const handleConfirm = () => {
    onAddToCart({
      temperature: item.allowsTemperatureChoice ? temperature : undefined,
      size: item.allowsSizeChoice ? size : undefined,
      sugarLevel: item.allowsSugarLevel ? sugarLevel : undefined,
      milkType: item.allowsMilkOptions ? milkType : undefined,
      extraShot,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/50">
          <div>
            <h3 className="text-lg font-bold text-white leading-snug">{item.name}</h3>
            <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
              <span>{item.category}</span>
              <span>·</span>
              <span className="text-amber-400 font-semibold tabular-nums">{formatIDR(item.price)}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="px-6 py-4 overflow-y-auto space-y-5 text-sm">
          {/* Temperature */}
          {item.allowsTemperatureChoice && (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                Suhu Penyajian
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTemperature('Ice')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-medium transition-colors ${
                    temperature === 'Ice'
                      ? 'bg-amber-600/20 border-amber-500 text-white'
                      : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Snowflake className="w-4 h-4 text-cyan-400" />
                  <span>Dingin / Iced</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTemperature('Hot')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-medium transition-colors ${
                    temperature === 'Hot'
                      ? 'bg-amber-600/20 border-amber-500 text-white'
                      : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span>Panas / Hot</span>
                </button>
              </div>
            </div>
          )}

          {/* Size Choice */}
          {item.allowsSizeChoice && (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                Ukuran Cup (Size)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSize('Regular')}
                  className={`flex items-center justify-between py-2.5 px-4 rounded-lg border text-xs font-medium transition-colors ${
                    size === 'Regular'
                      ? 'bg-amber-600/20 border-amber-500 text-white'
                      : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <span>Regular (16oz / 8oz)</span>
                  <span className="text-neutral-400 text-[11px]">Standar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSize('Large')}
                  className={`flex items-center justify-between py-2.5 px-4 rounded-lg border text-xs font-medium transition-colors ${
                    size === 'Large'
                      ? 'bg-amber-600/20 border-amber-500 text-white'
                      : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <span>Large (20oz)</span>
                  <span className="text-amber-400 font-semibold tabular-nums">+Rp 4.000</span>
                </button>
              </div>
            </div>
          )}

          {/* Sugar Level */}
          {item.allowsSugarLevel && (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                Tingkat Gula (Sugar Level)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Normal', 'Less Sugar', 'No Sugar'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSugarLevel(s)}
                    className={`py-2 px-2 rounded-lg border text-xs font-medium transition-colors text-center ${
                      sugarLevel === s
                        ? 'bg-amber-600/20 border-amber-500 text-white'
                        : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Milk Options */}
          {item.allowsMilkOptions && (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                Pilihan Susu (Dairy / Plant-Based)
              </label>
              <div className="space-y-1.5">
                {(['Fresh Milk', 'Oat Milk (+6k)', 'Almond Milk (+6k)'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMilkType(m)}
                    className={`w-full flex items-center justify-between py-2 px-3.5 rounded-lg border text-xs font-medium transition-colors ${
                      milkType === m
                        ? 'bg-amber-600/20 border-amber-500 text-white'
                        : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <span>{m === 'Fresh Milk' ? 'Fresh Milk UHT Greenfields (Standar)' : m}</span>
                    {m !== 'Fresh Milk' && (
                      <span className="text-amber-400 font-semibold tabular-nums">+Rp 6.000</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Extra Addons */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Tambahan (Add-on)
            </label>
            <button
              type="button"
              onClick={() => setExtraShot(!extraShot)}
              className={`w-full flex items-center justify-between py-2 px-3.5 rounded-lg border text-xs font-medium transition-colors ${
                extraShot
                  ? 'bg-amber-600/20 border-amber-500 text-white'
                  : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center ${
                    extraShot ? 'bg-amber-500 text-black' : 'border border-neutral-600'
                  }`}
                >
                  {extraShot && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>Extra Espresso Shot (+18g House Blend)</span>
              </div>
              <span className="text-amber-400 font-semibold tabular-nums">+Rp 5.000</span>
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Catatan Khusus (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Pisah es, jangan terlalu manis..."
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Live BOM calculation summary box */}
          <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-lg flex items-center justify-between text-xs">
            <span className="text-neutral-400">Estimasi HPP Bahan Baku:</span>
            <div className="text-right">
              <span className="text-neutral-300 font-mono tabular-nums">{formatIDR(Math.round(liveHPP))}</span>
              <span className="text-[11px] text-emerald-400 ml-2">
                (Margin ~{Math.round(((totalPrice - liveHPP) / totalPrice) * 100)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 block">Total Harga</span>
            <span className="text-lg font-bold text-amber-400 font-mono tabular-nums">
              {formatIDR(totalPrice)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-800 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Masukkan Pesanan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
