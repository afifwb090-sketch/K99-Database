import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Coffee,
  ShoppingBag,
  Percent,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Store,
  Globe,
  Award,
  UserCheck,
  CheckCircle2,
  DollarSign,
  Tag,
} from 'lucide-react';
import { MenuItem, CartItem, Transaction, SalesChannel, OnlinePlatform, Customer } from '../types';
import { useApp } from '../context/AppContext';
import { formatIDR } from '../utils/formatters';
import { VariantModal } from './VariantModal';
import { CheckoutModal } from './CheckoutModal';
import { ReceiptModal } from './ReceiptModal';

export const PosView: React.FC = () => {
  const {
    menuItems,
    rawMaterials,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    storeSettings,
    customers,
    addCustomer,
    checkoutTransaction,
  } = useApp();

  // Mode Selection: Offline vs Online
  const [salesChannel, setSalesChannel] = useState<SalesChannel>('OFFLINE');
  const [onlinePlatform, setOnlinePlatform] = useState<OnlinePlatform>('ShopeeFood');
  const [onlineOrderNumber, setOnlineOrderNumber] = useState<string>('');
  const [onlineNetIncome, setOnlineNetIncome] = useState<number>(0);

  // Search & Categories
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItemForVariant, setSelectedItemForVariant] = useState<MenuItem | null>(null);

  // Offline Customer & Loyalty State (NO TABLE NUMBER)
  const [orderType, setOrderType] = useState<'Dine In' | 'Take Away'>('Dine In');
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState<boolean>(false);
  const [guestCustomerName, setGuestCustomerName] = useState<string>('');
  const [guestCustomerPhone, setGuestCustomerPhone] = useState<string>('');
  const [isQuickRegisterOpen, setIsQuickRegisterOpen] = useState<boolean>(false);

  // Loyalty Points Redemption
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);

  // Dedicated Kolom Diskon Offline
  const [discountMode, setDiscountMode] = useState<'nominal' | 'percent'>('nominal');
  const [discountInputValue, setDiscountInputValue] = useState<string>('');

  // Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);

  const categories = [
    'Semua',
    'Signature Coffee',
    'Espresso Based',
    'Milk & Latte',
    'Manual Brew',
    'Non-Coffee',
    'Pastry & Snacks',
    'Beans',
  ];

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat = selectedCategory === 'Semua' || item.category === selectedCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch && item.isAvailable;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Customer search suggestions
  const customerSuggestions = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 5);
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [customers, customerSearch]);

  // Check material availability for a menu item based on its recipe BOM
  const getItemStockStatus = (item: MenuItem): { isOutOfStock: boolean; isLowStock: boolean; reason?: string } => {
    for (const rec of item.recipe) {
      const mat = rawMaterials.find((m) => m.id === rec.rawMaterialId);
      if (!mat) continue;
      if (mat.currentStock < rec.quantity) {
        return { isOutOfStock: true, isLowStock: false, reason: `${mat.name} Habis` };
      }
      if (mat.currentStock <= mat.minStockThreshold) {
        return { isOutOfStock: false, isLowStock: true, reason: `${mat.name} Menipis` };
      }
    }
    return { isOutOfStock: false, isLowStock: false };
  };

  const handleItemClick = (item: MenuItem) => {
    const stock = getItemStockStatus(item);
    if (stock.isOutOfStock) return;

    if (item.allowsTemperatureChoice || item.allowsSizeChoice || item.allowsSugarLevel || item.allowsMilkOptions) {
      setSelectedItemForVariant(item);
    } else {
      addToCart(item);
    }
  };

  // Cart calculations
  const subtotal = cart.reduce((sum, item) => sum + item.itemTotal, 0);

  // When subtotal changes in Online mode, if net income is 0, give smart suggestion of 80%
  React.useEffect(() => {
    if (salesChannel === 'ONLINE' && subtotal > 0 && onlineNetIncome === 0) {
      setOnlineNetIncome(Math.round(subtotal * 0.8));
    }
  }, [subtotal, salesChannel]);

  // Offline Discount Calculation from Kolom Diskon
  const parsedDiscountInput = Number(discountInputValue) || 0;
  const generalDiscountAmount =
    discountMode === 'percent'
      ? Math.round((subtotal * Math.min(100, parsedDiscountInput)) / 100)
      : Math.min(subtotal, parsedDiscountInput);

  const loyaltyDiscountAmount = pointsToRedeem * (storeSettings.redemptionRate || 1000);
  const totalDiscount = generalDiscountAmount + loyaltyDiscountAmount;

  const taxableSubtotal = Math.max(0, subtotal - totalDiscount);
  const taxAmount =
    salesChannel === 'OFFLINE' && storeSettings.enableTax
      ? Math.round((taxableSubtotal * storeSettings.taxRatePercent) / 100)
      : 0;
  const grandTotal = taxableSubtotal + taxAmount;

  // Potential points earned for selected customer
  const potentialPoints = Math.floor(grandTotal / (storeSettings.pointsPerAmount || 10000));

  // Quick Register New Customer
  const handleQuickRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestCustomerName.trim() || !guestCustomerPhone.trim()) return;

    const newCust = addCustomer({
      name: guestCustomerName.trim(),
      phone: guestCustomerPhone.trim(),
    });

    setSelectedCustomer(newCust);
    setIsQuickRegisterOpen(false);
    setGuestCustomerName('');
    setGuestCustomerPhone('');
  };

  // Direct checkout for online orders with manual net income input
  const handleOnlineDirectCheckout = () => {
    if (cart.length === 0) return;

    const finalNetIncome = onlineNetIncome > 0 ? onlineNetIncome : subtotal;

    const tx = checkoutTransaction({
      channel: 'ONLINE',
      onlinePlatform,
      onlineOrderNumber: onlineOrderNumber.trim() || undefined,
      onlineNetIncome: finalNetIncome,
      customerName: `Driver ${onlinePlatform}`,
      orderType: 'Online Delivery',
      paymentMethod:
        onlinePlatform === 'ShopeeFood'
          ? 'ShopeePay Settlement'
          : onlinePlatform === 'GrabFood'
          ? 'GrabPay Settlement'
          : 'GoPay Settlement',
      discountAmount: 0,
      discountPercentage: 0,
    });

    if (tx) {
      setCompletedTransaction(tx);
      setOnlineOrderNumber('');
      setOnlineNetIncome(0);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Top Channel Mode Switcher */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSalesChannel('OFFLINE');
              setPointsToRedeem(0);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              salesChannel === 'OFFLINE'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Kasir POS Offline (Kedai)</span>
          </button>

          <button
            onClick={() => {
              setSalesChannel('ONLINE');
              setSelectedCustomer(null);
              setPointsToRedeem(0);
              setDiscountInputValue('');
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              salesChannel === 'ONLINE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Penjualan Online (Shopee / Grab / GoFood)</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400 pr-2">
          {salesChannel === 'OFFLINE' ? (
            <span className="flex items-center gap-1.5 text-neutral-300">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Sistem Poin Loyalitas Member Aktif</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Input Manual Pendapatan Bersih (Tersambung ke Laporan Keuangan)</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Menu selection (Left) + Cart & Order Info (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT ZONE: Menu Selection Grid */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Search & Category Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kopi, latte, manual brew, pastry..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-neutral-300"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Category Segmented Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      isSelected
                        ? salesChannel === 'ONLINE'
                          ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                          : 'bg-amber-600 text-white shadow-sm font-semibold'
                        : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-neutral-800'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredItems.map((item) => {
              const stockStatus = getItemStockStatus(item);

              return (
                <div
                  key={item.id}
                  onClick={() => !stockStatus.isOutOfStock && handleItemClick(item)}
                  className={`group relative bg-neutral-900 border rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-200 select-none text-left ${
                    stockStatus.isOutOfStock
                      ? 'opacity-50 border-red-950/60 cursor-not-allowed'
                      : 'border-neutral-800 hover:border-amber-500/50 hover:shadow-lg hover:shadow-black/50 cursor-pointer active:scale-[0.99]'
                  }`}
                >
                  {/* Image / Thumbnail Container */}
                  <div className="relative aspect-4/3 w-full bg-neutral-950 overflow-hidden flex items-center justify-center">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-950 flex flex-col items-center justify-center text-neutral-600 group-hover:text-amber-500/80 transition-colors">
                        <Coffee className="w-8 h-8 stroke-[1.5]" />
                        <span className="text-[10px] text-neutral-500 mt-1 uppercase font-mono tracking-wider">
                          {item.category}
                        </span>
                      </div>
                    )}

                    {stockStatus.isOutOfStock && (
                      <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-2 text-center">
                        <span className="text-[11px] font-bold text-red-400 bg-red-950/80 border border-red-800/80 px-2 py-0.5 rounded">
                          Habis: {stockStatus.reason}
                        </span>
                      </div>
                    )}

                    {!stockStatus.isOutOfStock && stockStatus.isLowStock && (
                      <div className="absolute top-2 right-2">
                        <span className="text-[9px] font-semibold text-amber-300 bg-amber-950/90 border border-amber-600/60 px-1.5 py-0.5 rounded shadow-sm">
                          Stok Menipis
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                        {item.category}
                      </div>
                      <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1 mt-0.5">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1 leading-snug">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-neutral-800/60 flex items-center justify-between">
                      <span className="text-xs font-bold font-mono tabular-nums text-amber-400">
                        {formatIDR(item.price)}
                      </span>
                      <button
                        type="button"
                        disabled={stockStatus.isOutOfStock}
                        className="w-6 h-6 rounded-md bg-neutral-800 group-hover:bg-amber-600 text-neutral-300 group-hover:text-white flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT ZONE: Active Order Cart Ticket */}
        <div className="lg:col-span-5 xl:col-span-4 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl sticky top-20">
          {/* Cart Header */}
          <div className="p-4 border-b border-neutral-800 bg-neutral-900/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag
                className={`w-4 h-4 ${salesChannel === 'ONLINE' ? 'text-emerald-500' : 'text-amber-500'}`}
              />
              <h3 className="text-sm font-bold text-white">
                {salesChannel === 'ONLINE' ? `Pesanan Online (${onlinePlatform})` : 'Pesanan Kasir Offline'}
              </h3>
              <span className="text-xs text-neutral-400 tabular-nums">({cart.length} item)</span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-neutral-400 hover:text-red-400 transition-colors"
              >
                Kosongkan
              </button>
            )}
          </div>

          {/* MODE SPECIFIC CONTROLS */}
          {salesChannel === 'OFFLINE' ? (
            /* OFFLINE MODE: Dine in / Take away (NO TABLE NUMBER) & Customer Loyalty */
            <div className="p-3 border-b border-neutral-800/80 bg-neutral-950/40 space-y-2.5">
              <div className="grid grid-cols-2 gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
                {(['Dine In', 'Take Away'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setOrderType(type)}
                    className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      orderType === type ? 'bg-amber-600 text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Customer Selector / Loyalty */}
              <div className="relative">
                {selectedCustomer ? (
                  <div className="p-2.5 bg-neutral-900 border border-amber-500/40 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-bold text-white">{selectedCustomer.name}</span>
                      </div>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {selectedCustomer.phone} · Saldo:{' '}
                        <strong className="text-amber-400 font-bold">{selectedCustomer.points} Poin</strong>
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCustomer(null);
                        setPointsToRedeem(0);
                      }}
                      className="text-[11px] text-neutral-400 hover:text-red-400 transition-colors"
                    >
                      Ganti
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-1.5">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                        <input
                          type="text"
                          value={customerSearch}
                          onFocus={() => setIsCustomerDropdownOpen(true)}
                          onChange={(e) => {
                            setCustomerSearch(e.target.value);
                            setIsCustomerDropdownOpen(true);
                          }}
                          placeholder="Cari Member / No HP Pelanggan..."
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsQuickRegisterOpen(!isQuickRegisterOpen)}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-amber-400 rounded-lg border border-neutral-700 whitespace-nowrap"
                        title="Daftarkan Member Baru"
                      >
                        + Member
                      </button>
                    </div>

                    {isCustomerDropdownOpen && customerSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 z-30 mt-1 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl divide-y divide-neutral-800 max-h-48 overflow-y-auto">
                        {customerSuggestions.map((cust) => (
                          <div
                            key={cust.id}
                            onClick={() => {
                              setSelectedCustomer(cust);
                              setIsCustomerDropdownOpen(false);
                              setCustomerSearch('');
                            }}
                            className="p-2 hover:bg-neutral-800 cursor-pointer flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-semibold text-white">{cust.name}</div>
                              <div className="text-[10px] text-neutral-400 font-mono">{cust.phone}</div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-amber-400 font-mono">{cust.points} Poin</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Register Inline Form */}
                {isQuickRegisterOpen && !selectedCustomer && (
                  <form
                    onSubmit={handleQuickRegister}
                    className="mt-2 p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg space-y-2 text-xs"
                  >
                    <span className="font-semibold text-neutral-300 block">Daftar Member Baru Cepat:</span>
                    <input
                      type="text"
                      required
                      value={guestCustomerName}
                      onChange={(e) => setGuestCustomerName(e.target.value)}
                      placeholder="Nama Lengkap Pelanggan"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-white text-xs"
                    />
                    <input
                      type="text"
                      required
                      value={guestCustomerPhone}
                      onChange={(e) => setGuestCustomerPhone(e.target.value)}
                      placeholder="Nomor WhatsApp / HP"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-white text-xs font-mono"
                    />
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsQuickRegisterOpen(false)}
                        className="px-2 py-0.5 text-neutral-400 hover:text-white"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-500 font-bold text-white rounded"
                      >
                        Simpan Member
                      </button>
                    </div>
                  </form>
                )}

                {/* Loyalty Point Redemption */}
                {selectedCustomer && selectedCustomer.points > 0 && (
                  <div className="mt-2 p-2.5 bg-amber-950/30 border border-amber-600/30 rounded-lg flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 font-semibold text-amber-300">
                        <Award className="w-3.5 h-3.5" />
                        <span>Tukarkan Poin Loyalitas</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 block">
                        Tersedia: {selectedCustomer.points} Poin (Maks. potong{' '}
                        {formatIDR(selectedCustomer.points * storeSettings.redemptionRate)})
                      </span>
                    </div>

                    <select
                      value={pointsToRedeem}
                      onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                      className="bg-neutral-900 border border-amber-500/50 rounded px-2 py-1 text-amber-300 font-mono font-bold text-xs"
                    >
                      <option value={0}>Tidak tukar</option>
                      {Array.from(
                        { length: Math.min(selectedCustomer.points, 10) },
                        (_, i) => (i + 1) * 5
                      )
                        .filter(
                          (p) => p <= selectedCustomer.points && p * storeSettings.redemptionRate <= subtotal
                        )
                        .map((pts) => (
                          <option key={pts} value={pts}>
                            {pts} Poin (-{formatIDR(pts * storeSettings.redemptionRate)})
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ONLINE MODE: Platform Selector & Manual Net Income Input (NO SCREENSHOT) */
            <div className="p-3 border-b border-neutral-800/80 bg-neutral-950/40 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Pilih Platform Online Ojol:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['ShopeeFood', 'GrabFood', 'GoFood'] as const).map((plat) => (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => setOnlinePlatform(plat)}
                      className={`py-2 px-2 rounded-lg border text-xs font-bold transition-all text-center ${
                        onlinePlatform === plat
                          ? plat === 'ShopeeFood'
                            ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                            : plat === 'GrabFood'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                            : 'bg-red-500/20 border-red-500 text-red-400'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {plat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Price Net Income Input */}
              <div className="p-3 bg-neutral-900 border border-emerald-500/40 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Input Harga Pendapatan Bersih (Net)</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800 font-mono">
                    Laporan Keuangan
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={onlineNetIncome || ''}
                    onChange={(e) => setOnlineNetIncome(Number(e.target.value))}
                    placeholder={subtotal > 0 ? String(Math.round(subtotal * 0.8)) : '0'}
                    className="w-full bg-neutral-950 border border-emerald-500/60 rounded-lg pl-9 pr-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-400 shadow-inner"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span>Estimasi dari Subtotal:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setOnlineNetIncome(Math.round(subtotal * 0.8))}
                      className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px]"
                    >
                      Potong 20% ({formatIDR(Math.round(subtotal * 0.8))})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOnlineNetIncome(subtotal)}
                      className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px]"
                    >
                      100%
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-neutral-400 leading-snug">
                  *Nominal ini akan otomatis dicatat sebagai penerimaan kas bersih pada Laporan Laba Rugi & Arus Kas.
                </p>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">No. Pesanan Online / Order ID (Opt)</label>
                <input
                  type="text"
                  value={onlineOrderNumber}
                  onChange={(e) => setOnlineOrderNumber(e.target.value)}
                  placeholder="Contoh: GF-92810 / SPF-8812"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                />
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div className="max-h-[280px] overflow-y-auto p-3 space-y-2.5">
            {cart.length === 0 ? (
              <div className="py-10 text-center text-neutral-500 space-y-2">
                <ShoppingBag className="w-8 h-8 text-neutral-600 mx-auto stroke-[1.5]" />
                <p className="text-xs">Keranjang pesanan masih kosong</p>
                <p className="text-[11px] text-neutral-600">
                  {salesChannel === 'ONLINE'
                    ? 'Pilih menu yang dipesan via ojol untuk memotong bahan baku'
                    : 'Klik menu di sebelah kiri untuk menambah'}
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-neutral-950 border border-neutral-800/80 rounded-lg p-2.5 space-y-1.5 text-xs"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-semibold text-white leading-tight">{item.name}</span>
                    <span className="font-mono font-bold text-amber-400 tabular-nums">
                      {formatIDR(item.itemTotal)}
                    </span>
                  </div>

                  {/* Modifiers List */}
                  {(item.temperature || item.size || item.milkType || item.extraShot || item.notes) && (
                    <div className="text-[10px] text-neutral-400 space-x-1">
                      {item.temperature && <span>{item.temperature}</span>}
                      {item.size && item.size !== 'Regular' && <span>· {item.size}</span>}
                      {item.sugarLevel && item.sugarLevel !== 'Normal' && <span>· {item.sugarLevel}</span>}
                      {item.milkType && item.milkType !== 'Fresh Milk' && <span>· {item.milkType}</span>}
                      {item.extraShot && <span className="text-amber-400">· +Shot</span>}
                      {item.notes && <span className="italic block text-neutral-500">"{item.notes}"</span>}
                    </div>
                  )}

                  {/* Quantity & Remove controls */}
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-neutral-500 hover:text-red-400 p-1 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQuantity(item.id, -1)}
                        className="w-5 h-5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-mono font-bold text-white tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.id, 1)}
                        className="w-5 h-5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer: Kolom Diskon Offline & Summary */}
          {cart.length > 0 && (
            <div className="p-3 border-t border-neutral-800 bg-neutral-950/60 space-y-2.5 text-xs">
              {/* DEDICATED KOLOM DISKON UNTUK POS OFFLINE */}
              {salesChannel === 'OFFLINE' && (
                <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-500" />
                      <span>Kolom Diskon Offline:</span>
                    </label>

                    {/* Mode Switcher: Rp vs % */}
                    <div className="flex items-center p-0.5 bg-neutral-950 border border-neutral-800 rounded">
                      <button
                        type="button"
                        onClick={() => setDiscountMode('nominal')}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                          discountMode === 'nominal'
                            ? 'bg-amber-600 text-white'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Rp (Nominal)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountMode('percent')}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                          discountMode === 'percent'
                            ? 'bg-amber-600 text-white'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        % (Persen)
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">
                        {discountMode === 'nominal' ? 'Rp' : '%'}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={discountInputValue}
                        onChange={(e) => setDiscountInputValue(e.target.value)}
                        placeholder={discountMode === 'nominal' ? 'Contoh: 10000' : 'Contoh: 15'}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-lg pl-8 pr-3 py-1.5 text-white font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {discountInputValue && (
                      <button
                        type="button"
                        onClick={() => setDiscountInputValue('')}
                        className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded text-xs"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {discountMode === 'nominal' ? (
                      <>
                        {[5000, 10000, 15000, 20000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setDiscountInputValue(String(amt))}
                            className="px-2 py-0.5 text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700 font-mono"
                          >
                            {formatIDR(amt)}
                          </button>
                        ))}
                      </>
                    ) : (
                      <>
                        {[5, 10, 15, 20, 25].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setDiscountInputValue(String(pct))}
                            className="px-2 py-0.5 text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700 font-mono"
                          >
                            {pct}%
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Subtotal & Breakdown */}
              <div className="space-y-1 text-neutral-400 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal Menu</span>
                  <span className="font-mono tabular-nums text-neutral-200">{formatIDR(subtotal)}</span>
                </div>

                {generalDiscountAmount > 0 && (
                  <div className="flex justify-between text-amber-400 font-medium">
                    <span>
                      Diskon Offline ({discountMode === 'percent' ? `${parsedDiscountInput}%` : formatIDR(parsedDiscountInput)})
                    </span>
                    <span className="font-mono tabular-nums">-{formatIDR(generalDiscountAmount)}</span>
                  </div>
                )}

                {loyaltyDiscountAmount > 0 && (
                  <div className="flex justify-between text-amber-400 font-medium">
                    <span>Diskon Poin Loyalitas ({pointsToRedeem} Poin)</span>
                    <span className="font-mono tabular-nums">-{formatIDR(loyaltyDiscountAmount)}</span>
                  </div>
                )}

                {salesChannel === 'OFFLINE' && storeSettings.enableTax && (
                  <div className="flex justify-between">
                    <span>PB1 Resto ({storeSettings.taxRatePercent}%)</span>
                    <span className="font-mono tabular-nums text-neutral-200">{formatIDR(taxAmount)}</span>
                  </div>
                )}

                {salesChannel === 'ONLINE' && (
                  <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-neutral-800">
                    <span>Pendapatan Bersih (Masuk Laporan):</span>
                    <span className="font-mono tabular-nums">
                      {formatIDR(onlineNetIncome > 0 ? onlineNetIncome : subtotal)}
                    </span>
                  </div>
                )}
              </div>

              {/* Grand Total & Action button */}
              <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-500 block uppercase font-semibold">
                    {salesChannel === 'ONLINE' ? 'Total Harga Menu' : 'Total Tagihan'}
                  </span>
                  <span className="text-base font-bold font-mono tabular-nums text-white">
                    {formatIDR(grandTotal)}
                  </span>
                  {salesChannel === 'OFFLINE' && selectedCustomer && potentialPoints > 0 && (
                    <span className="text-[10px] text-emerald-400 block font-sans">
                      +{potentialPoints} Poin akan didapat
                    </span>
                  )}
                </div>

                {salesChannel === 'OFFLINE' ? (
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-md shadow-amber-900/40 transition-colors"
                  >
                    <span>Bayar Offline</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleOnlineDirectCheckout}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md shadow-emerald-900/40 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Simpan Pesanan Online</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Variant Modal */}
      {selectedItemForVariant && (
        <VariantModal
          item={selectedItemForVariant}
          onClose={() => setSelectedItemForVariant(null)}
          onAddToCart={(customization) => addToCart(selectedItemForVariant, customization)}
        />
      )}

      {/* Checkout Modal (Offline only, NO TABLE NUMBER) */}
      {isCheckoutOpen && (
        <CheckoutModal
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={(tx) => {
            setIsCheckoutOpen(false);
            setCompletedTransaction(tx);
          }}
          initialOrderType={orderType}
          initialCustomerName={selectedCustomer ? selectedCustomer.name : 'Pelanggan Walk-in'}
          initialCustomerPhone={selectedCustomer ? selectedCustomer.phone : undefined}
          customerId={selectedCustomer ? selectedCustomer.id : undefined}
          pointsToRedeem={pointsToRedeem}
          discountPercentage={discountMode === 'percent' ? parsedDiscountInput : 0}
          discountAmount={discountMode === 'nominal' ? parsedDiscountInput : 0}
        />
      )}

      {/* Receipt Modal */}
      {completedTransaction && (
        <ReceiptModal
          transaction={completedTransaction}
          onClose={() => setCompletedTransaction(null)}
        />
      )}
    </div>
  );
};
