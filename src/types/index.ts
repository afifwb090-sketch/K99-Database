export type MaterialUnit = 'g' | 'ml' | 'pcs' | 'sheet' | 'pack';

export type MaterialCategory =
  | 'Biji Kopi'
  | 'Susu & Dairy'
  | 'Pemanis & Sirup'
  | 'Bubuk Minuman'
  | 'Kemasan'
  | 'Bahan Makanan';

export interface RawMaterial {
  id: string;
  name: string;
  sku: string;
  category: MaterialCategory;
  currentStock: number;
  unit: MaterialUnit;
  minStockThreshold: number;
  costPerUnit: number; // in IDR
  lastPurchaseDate: string;
  supplier: string;
}

export interface RecipeItem {
  rawMaterialId: string;
  quantity: number;
  unit: MaterialUnit;
}

export type MenuCategory =
  | 'Signature Coffee'
  | 'Espresso Based'
  | 'Milk & Latte'
  | 'Manual Brew'
  | 'Non-Coffee'
  | 'Pastry & Snacks'
  | 'Beans';

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  description: string;
  image?: string;
  recipe: RecipeItem[];
  isAvailable: boolean;
  allowsTemperatureChoice?: boolean;
  allowsSizeChoice?: boolean;
  allowsSugarLevel?: boolean;
  allowsMilkOptions?: boolean;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  basePrice: number;
  quantity: number;
  temperature?: 'Ice' | 'Hot';
  size?: 'Regular' | 'Large';
  sugarLevel?: 'Normal' | 'Less Sugar' | 'No Sugar';
  milkType?: 'Fresh Milk' | 'Oat Milk (+6k)' | 'Almond Milk (+6k)';
  extraShot?: boolean;
  notes?: string;
  itemTotal: number;
  calculatedCost: number; // HPP per item configuration
}

export type PaymentMethod =
  | 'Tunai'
  | 'QRIS'
  | 'Transfer Bank'
  | 'EDC/Debit'
  | 'ShopeePay Settlement'
  | 'GrabPay Settlement'
  | 'GoPay Settlement';

export type SalesChannel = 'OFFLINE' | 'ONLINE';
export type OnlinePlatform = 'ShopeeFood' | 'GrabFood' | 'GoFood';

export interface DeductedMaterialRecord {
  rawMaterialId: string;
  rawMaterialName: string;
  quantity: number;
  unit: MaterialUnit;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  points: number;
  totalSpent: number;
  totalOrders: number;
  joinedDate: string;
  lastVisitDate: string;
}

export interface Transaction {
  id: string;
  timestamp: string;
  date: string; // YYYY-MM-DD
  channel: SalesChannel;
  onlinePlatform?: OnlinePlatform;
  onlineOrderNumber?: string;
  onlineNetIncome?: number; // Pendapatan bersih manual dari platform online yang tersambung ke laporan keuangan
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  pointsEarned?: number;
  pointsRedeemed?: number;
  items: CartItem[];
  orderType: 'Dine In' | 'Take Away' | 'Online Delivery';
  cashierName: string;
  subtotal: number;
  discountAmount: number;
  discountPercentage: number;
  taxAmount: number;
  totalAmount: number; // For offline: total tagihan. For online: menu price total
  totalCOGS: number; // Total HPP Bahan Baku
  grossProfit: number;
  paymentMethod: PaymentMethod;
  cashGiven?: number;
  changeAmount?: number;
  status: 'COMPLETED' | 'CANCELLED';
  deductedMaterials: DeductedMaterialRecord[];
}

export type StockMovementType =
  | 'SALE_DEDUCTION'
  | 'PURCHASE_RESTOCK'
  | 'WASTE_SPOIL'
  | 'MANUAL_ADJUSTMENT';

export interface StockMovement {
  id: string;
  rawMaterialId: string;
  rawMaterialName: string;
  type: StockMovementType;
  quantityChange: number; // positive or negative
  stockAfter: number;
  unit: MaterialUnit;
  referenceId?: string;
  date: string;
  timestamp: string;
  notes?: string;
}

export type ExpenseCategory =
  | 'Sewa Tempat'
  | 'Listrik, Air & Gas'
  | 'Gaji Karyawan'
  | 'Es Batu & Galon'
  | 'Internet & POS'
  | 'Perawatan Alat'
  | 'Pembelian Bahan Baku'
  | 'Operasional Lainnya';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  timestamp: string;
  paymentMethod: 'Kas Tunai' | 'Rekening Bank';
  receiptNumber?: string;
}

export interface Shift {
  id: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  date: string;
  initialCash: number;
  cashSales: number;
  nonCashSales: number;
  actualCashEnding?: number;
  cashDifference?: number;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  wifiInfo: string;
  taxRatePercent: number;
  enableTax: boolean;
  receiptFooter: string;
  pointsPerAmount: number; // e.g., 1 point per 10,000 IDR
  redemptionRate: number; // e.g., 1 point = 1,000 IDR discount
}
