import React, { useState } from 'react';
import { X, PlusCircle, DollarSign, Calendar, Tag, CreditCard } from 'lucide-react';
import { ExpenseCategory } from '../types';
import { useApp } from '../context/AppContext';
import { formatIDR } from '../utils/formatters';

interface ExpenseModalProps {
  onClose: () => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ onClose }) => {
  const { addExpense } = useApp();

  const [category, setCategory] = useState<ExpenseCategory>('Es Batu & Galon');
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Kas Tunai' | 'Rekening Bank'>('Kas Tunai');
  const [receiptNumber, setReceiptNumber] = useState<string>('');

  const categories: ExpenseCategory[] = [
    'Es Batu & Galon',
    'Listrik, Air & Gas',
    'Gaji Karyawan',
    'Sewa Tempat',
    'Internet & POS',
    'Perawatan Alat',
    'Pembelian Bahan Baku',
    'Operasional Lainnya',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description.trim()) return;

    addExpense({
      category,
      description: description.trim(),
      amount,
      date,
      paymentMethod,
      receiptNumber: receiptNumber.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div>
            <h3 className="text-base font-bold text-white">Catat Beban / Pengeluaran Toko</h3>
            <span className="text-xs text-neutral-400">
              Otomatis terhubung ke Laporan Laba Rugi & Arus Kas
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-neutral-300 font-semibold mb-1">Kategori Beban</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
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
            <label className="block text-neutral-300 font-semibold mb-1">Nominal Biaya (Rp)</label>
            <input
              type="number"
              required
              min="1"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Contoh: 75000"
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-semibold mb-1">Keterangan Pengeluaran</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Beli 5 kantong Es Tube Kristal"
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-semibold mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-semibold mb-1">Metode Bayar</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Kas Tunai">Kas Tunai (Laci)</option>
                <option value="Rekening Bank">Rekening Bank</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-neutral-300 font-semibold mb-1">
              No. Nota / Faktur (Optional)
            </label>
            <input
              type="text"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder="Contoh: NOTA-1288"
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-400 hover:text-white bg-neutral-800 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm"
            >
              Simpan Pengeluaran
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
