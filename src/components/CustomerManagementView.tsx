import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Award,
  Phone,
  Mail,
  Calendar,
  ShoppingBag,
  History,
  Edit2,
  Trash2,
  X,
  Check,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Customer, Transaction } from '../types';
import { useApp } from '../context/AppContext';
import { formatIDR, formatDate, formatDateTime } from '../utils/formatters';

export const CustomerManagementView: React.FC = () => {
  const { customers, transactions, addCustomer, updateCustomer, deleteCustomer, adjustCustomerPoints, storeSettings } =
    useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState<Customer | null>(null);

  // Add / Edit modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  // Points adjustment modal
  const [adjustPointsCustomer, setAdjustPointsCustomer] = useState<Customer | null>(null);
  const [pointsDelta, setPointsDelta] = useState<number>(10);
  const [pointsReason, setPointsReason] = useState<string>('Bonus apresiasi loyalitas');

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q))
      );
    });
  }, [customers, searchQuery]);

  // Overall KPIs
  const totalPoints = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.points, 0);
  }, [customers]);

  const totalSpentAll = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.totalSpent, 0);
  }, [customers]);

  // Customer order history
  const customerOrders = useMemo(() => {
    if (!selectedCustomerForDetail) return [];
    return transactions.filter((t) => t.customerId === selectedCustomerForDetail.id);
  }, [transactions, selectedCustomerForDetail]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormName(customer.name);
    setFormPhone(customer.phone);
    setFormEmail(customer.email || '');
    setFormNotes(customer.notes || '');
    setIsAddModalOpen(true);
  };

  const handleSubmitCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;

    if (editingCustomer) {
      updateCustomer({
        ...editingCustomer,
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });
    } else {
      addCustomer({
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });
    }

    setIsAddModalOpen(false);
  };

  const handleConfirmPointsAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustPointsCustomer || pointsDelta === 0) return;
    adjustCustomerPoints(adjustPointsCustomer.id, pointsDelta, pointsReason);
    setAdjustPointsCustomer(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Manajemen Pelanggan & Poin Loyalitas</h2>
          <span className="text-xs text-neutral-400">
            Rekam database pelanggan, riwayat pesanan kopi mereka, dan reward sistem loyalitas otomatis.
          </span>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm transition-colors w-fit"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Tambah Pelanggan</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 block font-medium">Total Member Terdaftar</span>
            <span className="text-lg font-bold text-white font-mono tabular-nums block mt-1">
              {customers.length} Orang
            </span>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">Database aktif kedai kopi</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-500">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 block font-medium">Total Poin Loyalitas Beredar</span>
            <span className="text-lg font-bold text-amber-400 font-mono tabular-nums block mt-1">
              {totalPoints} Poin
            </span>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">
              Nilai reward: {formatIDR(totalPoints * storeSettings.redemptionRate)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 block font-medium">Akumulasi Belanja Member</span>
            <span className="text-lg font-bold text-emerald-400 font-mono tabular-nums block mt-1">
              {formatIDR(totalSpentAll)}
            </span>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">Total omzet dari pelanggan terdaftar</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 block font-medium">Aturan Sistem Poin</span>
            <span className="text-xs font-bold text-white block mt-1">
              1 Poin / Rp 10.000 Belanja
            </span>
            <span className="text-[11px] text-amber-400 mt-0.5 block">
              1 Poin = Diskon Rp 1.000 di Kasir
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-blue-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pelanggan berdasarkan nama, nomor HP / WA..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
          />
        </div>
        <span className="text-xs text-neutral-400 hidden sm:inline">
          Menampilkan {filteredCustomers.length} pelanggan
        </span>
      </div>

      {/* Customer Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 text-neutral-400 uppercase tracking-wider font-semibold border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Nama Pelanggan</th>
                <th className="py-3 px-4">Kontak (WhatsApp / HP)</th>
                <th className="py-3 px-4 text-right">Poin Loyalitas</th>
                <th className="py-3 px-4 text-right">Total Transaksi</th>
                <th className="py-3 px-4 text-right">Total Belanja</th>
                <th className="py-3 px-4">Kunjungan Terakhir</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500 font-sans">
                    Tidak ada pelanggan yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-neutral-800/30 transition-colors">
                    {/* Name */}
                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-white">{cust.name}</div>
                      {cust.notes && (
                        <div className="text-[11px] text-neutral-400 italic line-clamp-1">
                          "{cust.notes}"
                        </div>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4 font-sans text-neutral-300">
                      <div className="flex items-center gap-1.5 font-mono text-neutral-200">
                        <Phone className="w-3 h-3 text-neutral-400" />
                        <span>{cust.phone}</span>
                      </div>
                      {cust.email && (
                        <div className="text-[11px] text-neutral-500 mt-0.5">{cust.email}</div>
                      )}
                    </td>

                    {/* Points */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-bold text-amber-400 text-sm tabular-nums">
                        {cust.points}
                      </span>
                      <span className="text-[11px] text-neutral-400 font-sans ml-1">Poin</span>
                      <div className="text-[10px] text-emerald-400 font-sans">
                        = {formatIDR(cust.points * storeSettings.redemptionRate)} diskon
                      </div>
                    </td>

                    {/* Total Orders */}
                    <td className="py-3 px-4 text-right text-neutral-300 font-bold tabular-nums">
                      {cust.totalOrders}x Kunjungan
                    </td>

                    {/* Total Spent */}
                    <td className="py-3 px-4 text-right font-bold text-white tabular-nums">
                      {formatIDR(cust.totalSpent)}
                    </td>

                    {/* Last Visit */}
                    <td className="py-3 px-4 font-sans text-neutral-400">
                      {formatDate(cust.lastVisitDate)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center font-sans">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedCustomerForDetail(cust)}
                          className="px-2 py-1 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-md transition-colors"
                          title="Lihat Riwayat Pesanan Lengkap"
                        >
                          Riwayat
                        </button>
                        <button
                          onClick={() => {
                            setAdjustPointsCustomer(cust);
                            setPointsDelta(10);
                          }}
                          className="p-1 text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-md transition-colors"
                          title="Atur Poin Loyalitas"
                        >
                          <Award className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(cust)}
                          className="p-1 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-md border border-neutral-700 transition-colors"
                          title="Edit Info"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus pelanggan "${cust.name}"?`)) {
                              deleteCustomer(cust.id);
                            }
                          }}
                          className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail & Order History Modal */}
      {selectedCustomerForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{selectedCustomerForDetail.name}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                    {selectedCustomerForDetail.points} Poin
                  </span>
                </h3>
                <span className="text-xs text-neutral-400">
                  WA: {selectedCustomerForDetail.phone} · Bergabung sejak: {formatDate(selectedCustomerForDetail.joinedDate)}
                </span>
              </div>
              <button
                onClick={() => setSelectedCustomerForDetail(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <h4 className="font-bold text-neutral-300 uppercase tracking-wider">
                Riwayat Pesanan Pelanggan ({customerOrders.length} transaksi):
              </h4>

              {customerOrders.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 bg-neutral-950 rounded-lg border border-neutral-800">
                  Belum ada riwayat transaksi yang tercatat untuk pelanggan ini.
                </div>
              ) : (
                <div className="border border-neutral-800 rounded-lg divide-y divide-neutral-800 bg-neutral-950/60">
                  {customerOrders.map((ord) => (
                    <div key={ord.id} className="p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-white">{ord.id}</span>
                        <span className="text-amber-400 font-bold tabular-nums">
                          {formatIDR(ord.totalAmount)}
                        </span>
                      </div>
                      <div className="text-neutral-300 font-sans">
                        {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 font-sans pt-0.5">
                        <span>{formatDateTime(ord.timestamp)} ({ord.orderType})</span>
                        <div className="flex items-center gap-2">
                          {ord.pointsEarned && (
                            <span className="text-emerald-400 font-medium">+{ord.pointsEarned} Poin</span>
                          )}
                          {ord.pointsRedeemed && (
                            <span className="text-amber-400 font-medium">-{ord.pointsRedeemed} Poin ditukar</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/80 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCustomerForDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingCustomer ? 'Edit Informasi Pelanggan' : 'Tambah Pelanggan Baru'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCustomer} className="space-y-3.5">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Nama Lengkap Pelanggan</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Dimas Ardiansyah"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Nomor WhatsApp / HP</label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Contoh: 0812-3456-7890"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="dimas@example.com"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Catatan Preferensi Kopi (Optional)</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Suka oat milk, less sugar, pelanggan tetap sore..."
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
                  {editingCustomer ? 'Simpan Perubahan' : 'Daftarkan Pelanggan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Points Modal */}
      {adjustPointsCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white">Sesuaikan Poin Loyalitas</h3>
            <p className="text-neutral-400">
              Pelanggan: <strong className="text-white">{adjustPointsCustomer.name}</strong> (Saldo saat ini:{' '}
              <span className="font-mono text-amber-400 font-bold">{adjustPointsCustomer.points} Poin</span>)
            </p>

            <form onSubmit={handleConfirmPointsAdjust} className="space-y-3.5">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  Jumlah Poin (Gunakan tanda - untuk mengurangi)
                </label>
                <input
                  type="number"
                  required
                  value={pointsDelta}
                  onChange={(e) => setPointsDelta(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Alasan Penyesuaian</label>
                <input
                  type="text"
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  placeholder="Contoh: Reward ulang tahun / koreksi"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustPointsCustomer(null)}
                  className="px-4 py-2 text-neutral-400 hover:text-white bg-neutral-800 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm"
                >
                  Perbarui Poin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
