import React, { useState } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Banknote,
  Building,
  CheckCircle2,
  PackageMinus,
  Sparkles,
  Award,
} from 'lucide-react';
import { PaymentMethod, Transaction } from '../types';
import { useApp } from '../context/AppContext';
import { formatIDR } from '../utils/formatters';

interface CheckoutModalProps {
  onClose: () => void;
  onSuccess: (transaction: Transaction) => void;
  initialOrderType: 'Dine In' | 'Take Away';
  initialCustomerName: string;
  initialCustomerPhone?: string;
  customerId?: string;
  pointsToRedeem: number;
  discountPercentage: number;
  discountAmount: number;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  onClose,
  onSuccess,
  initialOrderType,
  initialCustomerName,
  initialCustomerPhone,
  customerId,
  pointsToRedeem,
  discountPercentage: propDiscountPct,
  discountAmount: propDiscountAmt,
}) => {
  const { cart, menuItems, rawMaterials, storeSettings, checkoutTransaction } = useApp();

  const [orderType, setOrderType] = useState<'Dine In' | 'Take Away'>(initialOrderType);
  const [customerName, setCustomerName] = useState<string>(initialCustomerName || '');
  const [customerPhone, setCustomerPhone] = useState<string>(initialCustomerPhone || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('QRIS');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [discountPct, setDiscountPct] = useState<number>(propDiscountPct || 0);
  const [discountAmt, setDiscountAmt] = useState<number>(propDiscountAmt || 0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.itemTotal, 0);
  const generalDiscount = discountPct > 0 ? (subtotal * discountPct) / 100 : discountAmt;
  const loyaltyDiscount = pointsToRedeem * (storeSettings.redemptionRate || 1000);
  const totalDiscount = generalDiscount + loyaltyDiscount;

  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const taxAmount = storeSettings.enableTax ? Math.round((taxableAmount * storeSettings.taxRatePercent) / 100) : 0;
  const totalAmount = taxableAmount + taxAmount;
  const changeAmount = cashGiven >= totalAmount ? cashGiven - totalAmount : 0;

  // Potential points earned for customer
  const potentialPoints = Math.floor(totalAmount / (storeSettings.pointsPerAmount || 10000));

  // Calculate live preview of raw materials that will be deducted!
  const previewDeductions = React.useMemo(() => {
    const map: Record<string, { name: string; qty: number; unit: string }> = {};

    cart.forEach((cartItem) => {
      const menu = menuItems.find((m) => m.id === cartItem.menuItemId);
      if (menu) {
        menu.recipe.forEach((rec) => {
          let q = rec.quantity * cartItem.quantity;
          if (cartItem.size === 'Large') q *= 1.25;
          const mat = rawMaterials.find((m) => m.id === rec.rawMaterialId);
          if (mat) {
            if (!map[mat.id]) {
              map[mat.id] = { name: mat.name, qty: 0, unit: mat.unit };
            }
            map[mat.id].qty += q;
          }
        });

        if (cartItem.extraShot) {
          const mat1 = rawMaterials.find((m) => m.id === 'mat-1');
          if (mat1) {
            if (!map['mat-1']) {
              map['mat-1'] = { name: mat1.name, qty: 0, unit: mat1.unit };
            }
            map['mat-1'].qty += 18 * cartItem.quantity;
          }
        }
      }
    });

    return Object.values(map);
  }, [cart, menuItems, rawMaterials]);

  const handleQuickCash = (amount: number) => {
    setCashGiven(amount);
  };

  const handleCompletePayment = () => {
    if (paymentMethod === 'Tunai' && cashGiven < totalAmount) {
      setPaymentError(`Uang tunai yang diterima (${formatIDR(cashGiven)}) kurang dari total tagihan (${formatIDR(totalAmount)})!`);
      return;
    }
    setPaymentError(null);

    setIsProcessing(true);

    setTimeout(() => {
      const tx = checkoutTransaction({
        channel: 'OFFLINE',
        orderType,
        customerId,
        customerName: customerName.trim() || 'Pelanggan Walk-in',
        customerPhone: customerPhone.trim() || undefined,
        pointsToRedeem,
        paymentMethod,
        cashGiven: paymentMethod === 'Tunai' ? cashGiven : undefined,
        discountAmount: generalDiscount,
        discountPercentage: discountPct,
      });

      setIsProcessing(false);
      if (tx) {
        onSuccess(tx);
      }
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">Konfirmasi Pembayaran Kasir Offline</h3>
            <span className="text-xs text-neutral-400">
              {cart.length} item pesanan · {orderType}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="px-6 py-4 overflow-y-auto space-y-5 text-xs">
          {/* Order Details: Customer Name & Phone (NO TABLE NUMBER FIELD AS REQUESTED) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                Tipe Pesanan
              </label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as any)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Dine In">Dine In (Minum di Tempat)</option>
                <option value="Take Away">Take Away (Bungkus)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                Nama Pelanggan
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Sarah / Budi..."
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                No. WhatsApp / HP (Opt)
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="0812-xxxx-xxxx"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Loyalty reward summary if applicable */}
          {(customerId || pointsToRedeem > 0) && (
            <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-neutral-200 font-semibold">
                  Member Terhubung: <strong className="text-white">{customerName}</strong>
                </span>
              </div>
              <div className="text-right">
                {pointsToRedeem > 0 && (
                  <span className="text-amber-400 block font-semibold font-mono">
                    Tukar -{pointsToRedeem} Poin (-{formatIDR(loyaltyDiscount)})
                  </span>
                )}
                {potentialPoints > 0 && (
                  <span className="text-[11px] text-emerald-400 block">
                    +{potentialPoints} Poin akan didapat dari transaksi ini
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('QRIS')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border font-medium transition-colors ${
                  paymentMethod === 'QRIS'
                    ? 'bg-amber-600/20 border-amber-500 text-white'
                    : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <QrCode className="w-5 h-5 mb-1.5 text-emerald-400" />
                <span>QRIS Instant</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('Tunai');
                  if (cashGiven === 0) setCashGiven(totalAmount);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border font-medium transition-colors ${
                  paymentMethod === 'Tunai'
                    ? 'bg-amber-600/20 border-amber-500 text-white'
                    : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Banknote className="w-5 h-5 mb-1.5 text-amber-400" />
                <span>Tunai (Cash)</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('Transfer Bank')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border font-medium transition-colors ${
                  paymentMethod === 'Transfer Bank'
                    ? 'bg-amber-600/20 border-amber-500 text-white'
                    : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Building className="w-5 h-5 mb-1.5 text-blue-400" />
                <span>Transfer Bank</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('EDC/Debit')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border font-medium transition-colors ${
                  paymentMethod === 'EDC/Debit'
                    ? 'bg-amber-600/20 border-amber-500 text-white'
                    : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <CreditCard className="w-5 h-5 mb-1.5 text-purple-400" />
                <span>EDC / Kartu</span>
              </button>
            </div>
          </div>

          {/* Payment Specific Display */}
          {paymentMethod === 'Tunai' && (
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-300">Uang Diterima dari Pelanggan:</span>
                <input
                  type="number"
                  value={cashGiven || ''}
                  onChange={(e) => setCashGiven(Number(e.target.value))}
                  placeholder="0"
                  className="w-44 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-right font-mono font-bold text-white focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              {/* Quick Cash Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickCash(totalAmount)}
                  className="px-2.5 py-1 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 font-medium"
                >
                  Uang Pas ({formatIDR(totalAmount)})
                </button>
                {[50000, 100000, 150000, 200000, 500000].map((amt) => {
                  if (amt >= totalAmount) {
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleQuickCash(amt)}
                        className="px-2.5 py-1 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 tabular-nums"
                      >
                        {formatIDR(amt)}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                <span className="text-neutral-400 font-medium">Uang Kembalian:</span>
                <span
                  className={`text-base font-bold font-mono tabular-nums ${
                    changeAmount >= 0 && cashGiven >= totalAmount ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {cashGiven >= totalAmount ? formatIDR(changeAmount) : 'Kurang ' + formatIDR(totalAmount - cashGiven)}
                </span>
              </div>
            </div>
          )}

          {paymentMethod === 'QRIS' && (
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg flex flex-col sm:flex-row items-center gap-4">
              <div className="p-3 bg-white rounded-lg shadow-inner flex items-center justify-center">
                <svg className="w-24 h-24 text-neutral-900" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M0 0h30v30H0zm5 5v20h20V5zm4 4h12v12H9zM70 0h30v30H70zm5 5v20h20V5zm4 4h12v12H79zM0 70h30v30H0zm5 5v20h20V75zm4 4h12v12H9zM40 10h10v10H40zm10 10h10v10H50zm-10 20h20v10H40zm30 10h10v10H70zm10 10h10v20H80zm-40 0h10v20H40zm20 10h10v10H60zm-10 10h10v10H50zm20 10h10v10H70z" />
                </svg>
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 font-bold text-white">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>QRIS Nasional K99 Coffee</span>
                </div>
                <p className="text-neutral-400">
                  Scan via GoPay, BCA, OVO, Dana, ShopeePay, atau Livin Mandiri.
                </p>
                <div className="font-mono font-bold text-amber-400 pt-1">
                  Nominal: {formatIDR(totalAmount)}
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] text-emerald-400 pt-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verifikasi Otomatis Terhubung</span>
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'Transfer Bank' && (
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-neutral-300">
                <span>Bank:</span>
                <span className="font-semibold text-white">BCA (Bank Central Asia)</span>
              </div>
              <div className="flex items-center justify-between text-neutral-300">
                <span>No. Rekening:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">827-099-2026</span>
              </div>
              <div className="flex items-center justify-between text-neutral-300">
                <span>Atas Nama:</span>
                <span className="font-semibold text-white">K99 Coffee Roastery</span>
              </div>
            </div>
          )}

          {/* Automated ERP Raw Material Deduction Preview Banner */}
          <div className="p-3 bg-neutral-950/80 border border-amber-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <PackageMinus className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-semibold text-amber-300">
                Pencatatan Otomatis Inventaris Bahan Baku (ERP Real-time):
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] text-neutral-400">
              {previewDeductions.slice(0, 6).map((item, idx) => (
                <div key={idx} className="truncate">
                  • {item.name.split(' ')[0]}: <span className="text-neutral-200 font-mono">-{item.qty} {item.unit}</span>
                </div>
              ))}
              {previewDeductions.length > 6 && (
                <div className="text-neutral-500 italic">
                  +{previewDeductions.length - 6} bahan lainnya...
                </div>
              )}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="p-3 bg-neutral-950 rounded-lg space-y-1.5">
            <div className="flex justify-between text-neutral-400">
              <span>Subtotal ({cart.length} item)</span>
              <span className="font-mono tabular-nums text-neutral-200">{formatIDR(subtotal)}</span>
            </div>

            {loyaltyDiscount > 0 && (
              <div className="flex justify-between text-amber-400 font-medium">
                <span>Potongan Poin Loyalitas ({pointsToRedeem} Poin)</span>
                <span className="font-mono tabular-nums">-{formatIDR(loyaltyDiscount)}</span>
              </div>
            )}

            {generalDiscount > 0 && (
              <div className="flex justify-between text-amber-400 font-medium">
                <span>Diskon Promo {discountPct > 0 ? `(${discountPct}%)` : ''}</span>
                <span className="font-mono tabular-nums">-{formatIDR(generalDiscount)}</span>
              </div>
            )}

            {storeSettings.enableTax && (
              <div className="flex justify-between text-neutral-400">
                <span>PB1 Restoran ({storeSettings.taxRatePercent}%)</span>
                <span className="font-mono tabular-nums text-neutral-200">{formatIDR(taxAmount)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-neutral-800 flex justify-between items-center text-sm font-bold text-white">
              <span>Total Tagihan:</span>
              <span className="text-base text-amber-400 font-mono tabular-nums">
                {formatIDR(totalAmount)}
              </span>
            </div>

            {paymentError && (
              <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-500/40 text-red-200 text-xs font-semibold animate-pulse">
                {paymentError}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/90 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-800 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleCompletePayment}
            disabled={isProcessing}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {isProcessing ? (
              <span>Memproses Transaksi...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Selesaikan & Cetak Struk ({formatIDR(totalAmount)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
