import React from 'react';
import { Printer, Check, X, Award, Globe, Store } from 'lucide-react';
import { Transaction } from '../types';
import { useApp } from '../context/AppContext';
import { formatIDR, formatDateTime } from '../utils/formatters';

interface ReceiptModalProps {
  transaction: Transaction;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose }) => {
  const { storeSettings } = useApp();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800 bg-neutral-900/60 no-print">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <Check className="w-4 h-4" />
            <span>
              {transaction.channel === 'ONLINE'
                ? `Pesanan Online (${transaction.onlinePlatform}) Berhasil Disimpan`
                : 'Transaksi Kasir Offline Berhasil'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Thermal Receipt Card */}
        <div className="p-4 overflow-y-auto flex justify-center bg-neutral-950/60">
          <div
            id="printable-receipt"
            className="w-full max-w-[340px] bg-white text-neutral-900 p-5 rounded-lg shadow-sm font-mono text-xs leading-relaxed border border-neutral-200"
          >
            {/* Header info */}
            <div className="text-center pb-3 border-b border-dashed border-neutral-300">
              <h2 className="text-base font-bold tracking-tight text-neutral-900 uppercase">
                {storeSettings.storeName}
              </h2>
              <p className="text-[11px] text-neutral-600">{storeSettings.tagline}</p>
              <p className="text-[10px] text-neutral-500 mt-1">{storeSettings.address}</p>
              <p className="text-[10px] text-neutral-500">Telp/WA: {storeSettings.phone}</p>
            </div>

            {/* Transaction metadata */}
            <div className="py-2.5 border-b border-dashed border-neutral-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">No:</span>
                <span className="font-semibold text-neutral-800">{transaction.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Waktu:</span>
                <span>{formatDateTime(transaction.timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Saluran Penjualan:</span>
                <span className="font-semibold">
                  {transaction.channel === 'ONLINE'
                    ? `Online (${transaction.onlinePlatform})`
                    : 'Offline Kedai'}
                </span>
              </div>
              {transaction.onlineOrderNumber && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">No. Order Online:</span>
                  <span className="font-semibold text-neutral-800">{transaction.onlineOrderNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-500">Kasir:</span>
                <span>{transaction.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Pelanggan:</span>
                <span>
                  {transaction.customerName} ({transaction.orderType})
                </span>
              </div>
            </div>

            {/* Line Items */}
            <div className="py-3 border-b border-dashed border-neutral-300 space-y-2 text-[11px]">
              {transaction.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-medium">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span className="tabular-nums">{formatIDR(item.itemTotal)}</span>
                  </div>
                  {(item.temperature || item.size || item.milkType || item.extraShot || item.notes) && (
                    <div className="text-[10px] text-neutral-500 pl-3">
                      {[
                        item.temperature,
                        item.size !== 'Regular' ? item.size : null,
                        item.sugarLevel !== 'Normal' ? item.sugarLevel : null,
                        item.milkType !== 'Fresh Milk' ? item.milkType : null,
                        item.extraShot ? 'Extra Shot' : null,
                        item.notes ? `"${item.notes}"` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-2.5 border-b border-dashed border-neutral-300 space-y-1 text-[11px]">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal Menu</span>
                <span className="tabular-nums">{formatIDR(transaction.subtotal)}</span>
              </div>

              {transaction.discountAmount > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>Total Potongan / Diskon</span>
                  <span className="tabular-nums">-{formatIDR(transaction.discountAmount)}</span>
                </div>
              )}

              {transaction.taxAmount > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>Pajak Resto (PB1 10%)</span>
                  <span className="tabular-nums">{formatIDR(transaction.taxAmount)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-sm text-neutral-900 pt-1 border-t border-dotted border-neutral-300">
                <span>TOTAL</span>
                <span className="tabular-nums">{formatIDR(transaction.totalAmount)}</span>
              </div>

              {transaction.channel === 'ONLINE' && transaction.onlineNetIncome && (
                <div className="flex justify-between text-emerald-800 font-bold pt-0.5">
                  <span>Penghasilan Bersih (Net):</span>
                  <span className="tabular-nums">{formatIDR(transaction.onlineNetIncome)}</span>
                </div>
              )}

              <div className="flex justify-between text-neutral-600 pt-1">
                <span>Metode Bayar:</span>
                <span className="font-semibold">{transaction.paymentMethod}</span>
              </div>

              {transaction.paymentMethod === 'Tunai' && (
                <>
                  <div className="flex justify-between text-neutral-600">
                    <span>Tunai Diterima:</span>
                    <span className="tabular-nums">{formatIDR(transaction.cashGiven || 0)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Kembalian:</span>
                    <span className="tabular-nums">{formatIDR(transaction.changeAmount || 0)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Loyalty point info for member */}
            {(transaction.pointsEarned || transaction.pointsRedeemed) && (
              <div className="py-2 text-[10px] text-amber-800 bg-amber-50/80 rounded px-2 my-2 border border-amber-200">
                {transaction.pointsRedeemed && (
                  <div>• Poin loyalitas ditukar: -{transaction.pointsRedeemed} Poin</div>
                )}
                {transaction.pointsEarned && (
                  <div className="font-semibold">• Poin didapat dari transaksi ini: +{transaction.pointsEarned} Poin</div>
                )}
              </div>
            )}

            {/* ERP Stock deduction acknowledgement */}
            <div className="py-2 text-[9px] text-neutral-500 border-b border-dashed border-neutral-300 text-center">
              ✓ Stok bahan baku ({transaction.deductedMaterials?.length || 0} item) otomatis terpotong sistem ERP
            </div>

            {/* Footer notes */}
            <div className="text-center pt-3 space-y-1 text-[10px] text-neutral-600">
              <p className="font-medium text-neutral-800">{storeSettings.receiptFooter}</p>
              <p className="text-[9px] text-neutral-500">WiFi: {storeSettings.wifiInfo}</p>
              <p className="text-[8px] text-neutral-400 pt-1">K99 Coffee POS ERP System</p>
            </div>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-900 flex items-center justify-between no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            Transaksi Baru
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Struk</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
