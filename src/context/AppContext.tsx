import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  RawMaterial,
  MenuItem,
  CartItem,
  Transaction,
  StockMovement,
  Expense,
  Shift,
  StoreSettings,
  PaymentMethod,
  RecipeItem,
  Customer,
  SalesChannel,
  OnlinePlatform,
} from '../types';
import {
  initialRawMaterials,
  initialMenuItems,
  initialTransactions,
  initialExpenses,
  initialStockMovements,
  initialShift,
  initialStoreSettings,
  initialCustomers,
} from '../data/initialData';
import { generateId } from '../utils/formatters';
import { googleSheetsService } from '../services/googleSheetsService';

interface FinancialMetrics {
  grossSales: number;
  discounts: number;
  netRevenue: number;
  cogsTotal: number;
  grossProfit: number;
  grossMarginPct: number;
  operatingExpenses: number;
  netProfit: number;
  netMarginPct: number;
  cashInflow: number;
  cashOutflow: number;
  netCashFlow: number;
  transactionCount: number;
  averageOrderValue: number;
  paymentBreakdown: Record<string, number>;
  channelBreakdown: {
    offlineTotal: number;
    onlineTotal: number;
    onlinePlatforms: Record<OnlinePlatform, number>;
  };
}

interface AppContextType {
  rawMaterials: RawMaterial[];
  menuItems: MenuItem[];
  cart: CartItem[];
  transactions: Transaction[];
  stockMovements: StockMovement[];
  expenses: Expense[];
  currentShift: Shift;
  storeSettings: StoreSettings;
  customers: Customer[];

  // Cart Actions
  addToCart: (item: MenuItem, customization?: Partial<CartItem>) => void;
  updateCartQuantity: (cartItemId: string, delta: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;

  // Checkout & Transactions
  checkoutTransaction: (params: {
    channel: SalesChannel;
    onlinePlatform?: OnlinePlatform;
    onlineOrderNumber?: string;
    onlineNetIncome?: number;
    customerId?: string;
    customerName: string;
    customerPhone?: string;
    pointsToRedeem?: number;
    orderType: 'Dine In' | 'Take Away' | 'Online Delivery';
    paymentMethod: PaymentMethod;
    cashGiven?: number;
    discountAmount: number;
    discountPercentage: number;
  }) => Transaction | null;
  voidTransaction: (transactionId: string, returnStock: boolean) => void;

  // Customer Management
  addCustomer: (customer: Omit<Customer, 'id' | 'points' | 'totalSpent' | 'totalOrders' | 'joinedDate' | 'lastVisitDate'>) => Customer;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  adjustCustomerPoints: (customerId: string, deltaPoints: number, notes?: string) => void;

  // Inventory & BOM
  restockMaterial: (params: {
    materialId: string;
    quantityToAdd: number;
    totalCost: number;
    supplier: string;
    notes?: string;
    autoRecordExpense?: boolean;
    paymentMethod?: 'Kas Tunai' | 'Rekening Bank';
  }) => void;
  adjustMaterialStock: (
    materialId: string,
    newStock: number,
    type: 'WASTE_SPOIL' | 'MANUAL_ADJUSTMENT',
    notes?: string
  ) => void;
  addRawMaterial: (material: Omit<RawMaterial, 'id'>) => void;
  updateRawMaterial: (material: RawMaterial) => void;
  deleteRawMaterial: (id: string) => void;

  // Menu Management
  addMenuItem: (menuItem: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (menuItem: MenuItem) => void;
  deleteMenuItem: (id: string) => void;
  updateMenuRecipe: (menuId: string, recipe: RecipeItem[]) => void;

  // Expenses & Cash
  addExpense: (expense: Omit<Expense, 'id' | 'timestamp'>) => void;
  deleteExpense: (id: string) => void;

  // Shift Management
  openShift: (cashierName: string, initialCash: number) => void;
  closeShift: (actualCashEnding: number, notes?: string) => void;

  // Settings & Storage
  updateSettings: (settings: StoreSettings) => void;
  resetToInitialData: () => void;

  // Computed & Helpers
  lowStockItems: RawMaterial[];
  calculateRecipeCOGS: (recipe: RecipeItem[]) => number;
  getFinancialMetrics: (startDate?: string, endDate?: string) => FinancialMetrics;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'k99_coffee_pos_data_v2';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_materials`);
    return saved ? JSON.parse(saved) : initialRawMaterials;
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_menu`);
    return saved ? JSON.parse(saved) : initialMenuItems;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_cart`);
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_transactions`);
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_stock_movements`);
    return saved ? JSON.parse(saved) : initialStockMovements;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_expenses`);
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [currentShift, setCurrentShift] = useState<Shift>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_shift`);
    return saved ? JSON.parse(saved) : initialShift;
  });

  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
    return saved ? JSON.parse(saved) : initialStoreSettings;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_customers`);
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_materials`, JSON.stringify(rawMaterials));
  }, [rawMaterials]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_menu`, JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_cart`, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_transactions`, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_stock_movements`, JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_expenses`, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_shift`, JSON.stringify(currentShift));
  }, [currentShift]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(storeSettings));
  }, [storeSettings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_customers`, JSON.stringify(customers));
  }, [customers]);

  // Helper: Calculate Recipe COGS
  const calculateRecipeCOGS = (recipe: RecipeItem[]): number => {
    return recipe.reduce((acc, item) => {
      const mat = rawMaterials.find((m) => m.id === item.rawMaterialId);
      if (!mat) return acc;
      return acc + item.quantity * mat.costPerUnit;
    }, 0);
  };

  // Low stock detector
  const lowStockItems = useMemo(() => {
    return rawMaterials.filter((m) => m.currentStock <= m.minStockThreshold);
  }, [rawMaterials]);

  // Cart operations
  const addToCart = (item: MenuItem, customization?: Partial<CartItem>) => {
    let price = item.price;
    if (customization?.size === 'Large') price += 4000;
    if (customization?.milkType?.includes('+6k')) price += 6000;
    if (customization?.extraShot) price += 5000;

    let itemHPP = calculateRecipeCOGS(item.recipe);
    if (customization?.extraShot) itemHPP += 18 * (rawMaterials.find((m) => m.id === 'mat-1')?.costPerUnit || 180);
    if (customization?.size === 'Large') itemHPP *= 1.25;

    const cartId = generateId('CART');
    const newCartItem: CartItem = {
      id: cartId,
      menuItemId: item.id,
      name: item.name,
      basePrice: price,
      quantity: 1,
      temperature: customization?.temperature || (item.allowsTemperatureChoice ? 'Ice' : undefined),
      size: customization?.size || (item.allowsSizeChoice ? 'Regular' : undefined),
      sugarLevel: customization?.sugarLevel || (item.allowsSugarLevel ? 'Normal' : undefined),
      milkType: customization?.milkType || (item.allowsMilkOptions ? 'Fresh Milk' : undefined),
      extraShot: customization?.extraShot || false,
      notes: customization?.notes || '',
      itemTotal: price,
      calculatedCost: Math.round(itemHPP),
    };

    setCart((prev) => [...prev, newCartItem]);
  };

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === cartItemId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            return {
              ...item,
              quantity: nextQty,
              itemTotal: item.basePrice * nextQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const clearCart = () => setCart([]);

  // Customer Management
  const addCustomer = (data: Omit<Customer, 'id' | 'points' | 'totalSpent' | 'totalOrders' | 'joinedDate' | 'lastVisitDate'>): Customer => {
    const today = new Date().toISOString().split('T')[0];
    const newCust: Customer = {
      ...data,
      id: generateId('CUST'),
      points: 0,
      totalSpent: 0,
      totalOrders: 0,
      joinedDate: today,
      lastVisitDate: today,
    };
    setCustomers((prev) => [newCust, ...prev]);
    return newCust;
  };

  const updateCustomer = (customer: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === customer.id ? customer : c)));
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  const adjustCustomerPoints = (customerId: string, deltaPoints: number, notes?: string) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          return {
            ...c,
            points: Math.max(0, c.points + deltaPoints),
          };
        }
        return c;
      })
    );
  };

  // Checkout with automated inventory deduction & loyalty system & online sales support!
  const checkoutTransaction = ({
    channel,
    onlinePlatform,
    onlineOrderNumber,
    onlineNetIncome,
    customerId,
    customerName,
    customerPhone,
    pointsToRedeem = 0,
    orderType,
    paymentMethod,
    cashGiven,
    discountAmount,
    discountPercentage,
  }: {
    channel: SalesChannel;
    onlinePlatform?: OnlinePlatform;
    onlineOrderNumber?: string;
    onlineNetIncome?: number;
    customerId?: string;
    customerName: string;
    customerPhone?: string;
    pointsToRedeem?: number;
    orderType: 'Dine In' | 'Take Away' | 'Online Delivery';
    paymentMethod: PaymentMethod;
    cashGiven?: number;
    discountAmount: number;
    discountPercentage: number;
  }): Transaction | null => {
    if (cart.length === 0) return null;

    const now = new Date();
    const timestamp = now.toISOString();
    const date = timestamp.split('T')[0];
    const txId = generateId('K99');

    const subtotal = cart.reduce((acc, item) => acc + item.itemTotal, 0);

    // Calculate loyalty redemption discount
    const loyaltyDiscount = pointsToRedeem * (storeSettings.redemptionRate || 1000);
    const combinedDiscount =
      (discountPercentage > 0 ? (subtotal * discountPercentage) / 100 : discountAmount) + loyaltyDiscount;

    const taxableAmount = Math.max(0, subtotal - combinedDiscount);
    // For online platforms, tax is handled platform-side
    const taxAmount =
      channel === 'ONLINE'
        ? 0
        : storeSettings.enableTax
        ? Math.round((taxableAmount * storeSettings.taxRatePercent) / 100)
        : 0;

    const totalAmount = taxableAmount + taxAmount;
    const changeAmount = cashGiven && cashGiven > totalAmount ? cashGiven - totalAmount : 0;

    // Deduce raw materials based on recipes of each item in cart
    const deductionMap: Record<string, number> = {};

    cart.forEach((cartItem) => {
      const menu = menuItems.find((m) => m.id === cartItem.menuItemId);
      if (menu) {
        menu.recipe.forEach((rec) => {
          let qty = rec.quantity * cartItem.quantity;
          if (cartItem.size === 'Large') qty *= 1.25;
          deductionMap[rec.rawMaterialId] = (deductionMap[rec.rawMaterialId] || 0) + qty;
        });

        if (cartItem.extraShot) {
          deductionMap['mat-1'] = (deductionMap['mat-1'] || 0) + 18 * cartItem.quantity;
        }

        if (cartItem.milkType?.includes('Oat Milk')) {
          const freshMilkQty = deductionMap['mat-3'] || 0;
          if (freshMilkQty > 0) {
            deductionMap['mat-3'] = Math.max(0, freshMilkQty - 120 * cartItem.quantity);
            deductionMap['mat-4'] = (deductionMap['mat-4'] || 0) + 120 * cartItem.quantity;
          }
        }
      }
    });

    const deductedMaterialsRecords: {
      rawMaterialId: string;
      rawMaterialName: string;
      quantity: number;
      unit: any;
    }[] = [];

    let totalCOGS = 0;
    const newStockMovements: StockMovement[] = [];

    setRawMaterials((prevMaterials) => {
      return prevMaterials.map((mat) => {
        const qtyDeducted = deductionMap[mat.id];
        if (qtyDeducted && qtyDeducted > 0) {
          const roundedQty = Math.round(qtyDeducted * 10) / 10;
          const newStock = Math.max(0, Math.round((mat.currentStock - roundedQty) * 10) / 10);
          const cogs = roundedQty * mat.costPerUnit;
          totalCOGS += cogs;

          deductedMaterialsRecords.push({
            rawMaterialId: mat.id,
            rawMaterialName: mat.name,
            quantity: roundedQty,
            unit: mat.unit,
          });

          newStockMovements.push({
            id: generateId('SM'),
            rawMaterialId: mat.id,
            rawMaterialName: mat.name,
            type: 'SALE_DEDUCTION',
            quantityChange: -roundedQty,
            stockAfter: newStock,
            unit: mat.unit,
            referenceId: txId,
            date,
            timestamp,
            notes: `Terpakai pesanan ${channel} ${onlinePlatform ? `[${onlinePlatform}]` : ''} ${txId}`,
          });

          return {
            ...mat,
            currentStock: newStock,
          };
        }
        return mat;
      });
    });

    if (newStockMovements.length > 0) {
      setStockMovements((prev) => [...newStockMovements, ...prev]);
    }

    // Points calculation (Offline customer loyalty)
    const pointsEarned =
      channel === 'OFFLINE'
        ? Math.floor(totalAmount / (storeSettings.pointsPerAmount || 10000))
        : 0;

    // Update customer records if customer is linked
    if (customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === customerId) {
            const currentPoints = c.points - pointsToRedeem + pointsEarned;
            return {
              ...c,
              points: Math.max(0, currentPoints),
              totalSpent: c.totalSpent + totalAmount,
              totalOrders: c.totalOrders + 1,
              lastVisitDate: date,
            };
          }
          return c;
        })
      );
    }

    // If online, use net income for calculating actual gross profit
    const effectiveRevenue = channel === 'ONLINE' && onlineNetIncome ? onlineNetIncome : totalAmount - taxAmount;
    const calculatedGrossProfit = effectiveRevenue - totalCOGS;

    const newTransaction: Transaction = {
      id: txId,
      timestamp,
      date,
      channel,
      onlinePlatform,
      onlineOrderNumber,
      onlineNetIncome,
      customerId,
      customerName: customerName.trim() || (channel === 'ONLINE' ? `Pelanggan ${onlinePlatform}` : 'Pelanggan Walk-in'),
      customerPhone,
      pointsEarned: pointsEarned > 0 ? pointsEarned : undefined,
      pointsRedeemed: pointsToRedeem > 0 ? pointsToRedeem : undefined,
      items: [...cart],
      orderType,
      cashierName: currentShift.cashierName,
      subtotal,
      discountAmount: combinedDiscount,
      discountPercentage,
      taxAmount,
      totalAmount,
      totalCOGS: Math.round(totalCOGS),
      grossProfit: Math.round(calculatedGrossProfit),
      paymentMethod,
      cashGiven: paymentMethod === 'Tunai' ? cashGiven : undefined,
      changeAmount: paymentMethod === 'Tunai' ? changeAmount : undefined,
      status: 'COMPLETED',
      deductedMaterials: deductedMaterialsRecords,
    };

    setTransactions((prev) => [newTransaction, ...prev]);

    // Background sync to Google Sheets backend if configured
    googleSheetsService.syncTransaction(newTransaction).catch((err) => {
      console.warn('Google Sheets sync notice:', err);
    });

    // Update shift metrics
    setCurrentShift((prev) => ({
      ...prev,
      cashSales: paymentMethod === 'Tunai' ? prev.cashSales + totalAmount : prev.cashSales,
      nonCashSales: paymentMethod !== 'Tunai' ? prev.nonCashSales + (onlineNetIncome || totalAmount) : prev.nonCashSales,
    }));

    clearCart();

    return newTransaction;
  };

  // Void transaction
  const voidTransaction = (transactionId: string, returnStock: boolean) => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx || tx.status === 'CANCELLED') return;

    setTransactions((prev) =>
      prev.map((t) => (t.id === transactionId ? { ...t, status: 'CANCELLED' } : t))
    );

    // Rollback customer points if needed
    if (tx.customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === tx.customerId) {
            const restoredPoints = c.points - (tx.pointsEarned || 0) + (tx.pointsRedeemed || 0);
            return {
              ...c,
              points: Math.max(0, restoredPoints),
              totalSpent: Math.max(0, c.totalSpent - tx.totalAmount),
              totalOrders: Math.max(0, c.totalOrders - 1),
            };
          }
          return c;
        })
      );
    }

    if (returnStock && tx.deductedMaterials.length > 0) {
      const now = new Date();
      const returnMovements: StockMovement[] = [];

      setRawMaterials((prev) =>
        prev.map((mat) => {
          const found = tx.deductedMaterials.find((d) => d.rawMaterialId === mat.id);
          if (found) {
            const restoredStock = mat.currentStock + found.quantity;
            returnMovements.push({
              id: generateId('SM'),
              rawMaterialId: mat.id,
              rawMaterialName: mat.name,
              type: 'MANUAL_ADJUSTMENT',
              quantityChange: found.quantity,
              stockAfter: restoredStock,
              unit: mat.unit,
              referenceId: `VOID-${tx.id}`,
              date: now.toISOString().split('T')[0],
              timestamp: now.toISOString(),
              notes: `Pengembalian stok pembatalan transaksi ${tx.id}`,
            });
            return { ...mat, currentStock: restoredStock };
          }
          return mat;
        })
      );

      setStockMovements((prev) => [...returnMovements, ...prev]);
    }
  };

  // Restock material
  const restockMaterial = ({
    materialId,
    quantityToAdd,
    totalCost,
    supplier,
    notes,
    autoRecordExpense = true,
    paymentMethod = 'Kas Tunai',
  }: {
    materialId: string;
    quantityToAdd: number;
    totalCost: number;
    supplier: string;
    notes?: string;
    autoRecordExpense?: boolean;
    paymentMethod?: 'Kas Tunai' | 'Rekening Bank';
  }) => {
    const now = new Date();
    const timestamp = now.toISOString();
    const date = timestamp.split('T')[0];

    const mat = rawMaterials.find((m) => m.id === materialId);
    if (!mat || quantityToAdd <= 0) return;

    const newStock = mat.currentStock + quantityToAdd;
    const previousTotalValue = mat.currentStock * mat.costPerUnit;
    const newAverageCost = Math.round((previousTotalValue + totalCost) / newStock);

    setRawMaterials((prev) =>
      prev.map((m) => {
        if (m.id === materialId) {
          return {
            ...m,
            currentStock: newStock,
            costPerUnit: newAverageCost,
            lastPurchaseDate: date,
            supplier: supplier || m.supplier,
          };
        }
        return m;
      })
    );

    const smId = generateId('SM');
    setStockMovements((prev) => [
      {
        id: smId,
        rawMaterialId: mat.id,
        rawMaterialName: mat.name,
        type: 'PURCHASE_RESTOCK',
        quantityChange: quantityToAdd,
        stockAfter: newStock,
        unit: mat.unit,
        referenceId: `RESTOCK-${mat.sku}`,
        date,
        timestamp,
        notes: notes || `Restock dari ${supplier}`,
      },
      ...prev,
    ]);

    if (autoRecordExpense && totalCost > 0) {
      addExpense({
        category: 'Pembelian Bahan Baku',
        description: `Beli ${mat.name} (${quantityToAdd} ${mat.unit}) dari ${supplier}`,
        amount: totalCost,
        date,
        paymentMethod,
        receiptNumber: `RESTOCK-${mat.sku}`,
      });
    }
  };

  // Stock Adjustment
  const adjustMaterialStock = (
    materialId: string,
    newStock: number,
    type: 'WASTE_SPOIL' | 'MANUAL_ADJUSTMENT',
    notes?: string
  ) => {
    const mat = rawMaterials.find((m) => m.id === materialId);
    if (!mat) return;

    const now = new Date();
    const timestamp = now.toISOString();
    const date = timestamp.split('T')[0];
    const diff = newStock - mat.currentStock;

    setRawMaterials((prev) =>
      prev.map((m) => (m.id === materialId ? { ...m, currentStock: Math.max(0, newStock) } : m))
    );

    setStockMovements((prev) => [
      {
        id: generateId('SM'),
        rawMaterialId: mat.id,
        rawMaterialName: mat.name,
        type,
        quantityChange: Math.round(diff * 10) / 10,
        stockAfter: Math.max(0, newStock),
        unit: mat.unit,
        referenceId: `ADJ-${mat.sku}`,
        date,
        timestamp,
        notes: notes || (type === 'WASTE_SPOIL' ? 'Bahan tumpah/spill/kadaluarsa' : 'Penyesuaian stok opname'),
      },
      ...prev,
    ]);
  };

  const addRawMaterial = (material: Omit<RawMaterial, 'id'>) => {
    const newId = generateId('MAT');
    setRawMaterials((prev) => [...prev, { ...material, id: newId }]);
  };

  const updateRawMaterial = (material: RawMaterial) => {
    setRawMaterials((prev) => prev.map((m) => (m.id === material.id ? material : m)));
  };

  const deleteRawMaterial = (id: string) => {
    setRawMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  // Menu Management
  const addMenuItem = (menuItem: Omit<MenuItem, 'id'>) => {
    const newId = generateId('MENU');
    setMenuItems((prev) => [...prev, { ...menuItem, id: newId }]);
  };

  const updateMenuItem = (menuItem: MenuItem) => {
    setMenuItems((prev) => prev.map((m) => (m.id === menuItem.id ? menuItem : m)));
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems((prev) => prev.filter((m) => m.id !== id));
  };

  const updateMenuRecipe = (menuId: string, recipe: RecipeItem[]) => {
    setMenuItems((prev) => prev.map((m) => (m.id === menuId ? { ...m, recipe } : m)));
  };

  // Expense Management
  const addExpense = (expense: Omit<Expense, 'id' | 'timestamp'>) => {
    const now = new Date();
    const newExp: Expense = {
      ...expense,
      id: generateId('EXP'),
      timestamp: now.toISOString(),
    };
    setExpenses((prev) => [newExp, ...prev]);

    // Background sync to Google Sheets backend if configured
    googleSheetsService.syncExpense(newExp).catch((err) => {
      console.warn('Google Sheets sync expense notice:', err);
    });
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Shift Management
  const openShift = (cashierName: string, initialCash: number) => {
    const now = new Date();
    const newShift: Shift = {
      id: generateId('SHIFT'),
      cashierName,
      startTime: now.toISOString(),
      date: now.toISOString().split('T')[0],
      initialCash,
      cashSales: 0,
      nonCashSales: 0,
      status: 'OPEN',
    };
    setCurrentShift(newShift);
  };

  const closeShift = (actualCashEnding: number, notes?: string) => {
    const now = new Date();
    const expectedCash = currentShift.initialCash + currentShift.cashSales;
    const diff = actualCashEnding - expectedCash;

    setCurrentShift((prev) => ({
      ...prev,
      endTime: now.toISOString(),
      actualCashEnding,
      cashDifference: diff,
      status: 'CLOSED',
      notes,
    }));
  };

  const updateSettings = (settings: StoreSettings) => {
    setStoreSettings(settings);
  };

  const resetToInitialData = () => {
    localStorage.removeItem(`${STORAGE_KEY}_materials`);
    localStorage.removeItem(`${STORAGE_KEY}_menu`);
    localStorage.removeItem(`${STORAGE_KEY}_cart`);
    localStorage.removeItem(`${STORAGE_KEY}_transactions`);
    localStorage.removeItem(`${STORAGE_KEY}_stock_movements`);
    localStorage.removeItem(`${STORAGE_KEY}_expenses`);
    localStorage.removeItem(`${STORAGE_KEY}_shift`);
    localStorage.removeItem(`${STORAGE_KEY}_settings`);
    localStorage.removeItem(`${STORAGE_KEY}_customers`);

    setRawMaterials(initialRawMaterials);
    setMenuItems(initialMenuItems);
    setCart([]);
    setTransactions(initialTransactions);
    setStockMovements(initialStockMovements);
    setExpenses(initialExpenses);
    setCurrentShift(initialShift);
    setStoreSettings(initialStoreSettings);
    setCustomers(initialCustomers);
  };

  // Financial Metrics Aggregator
  const getFinancialMetrics = (startDate?: string, endDate?: string): FinancialMetrics => {
    const completedTxs = transactions.filter((t) => {
      if (t.status !== 'COMPLETED') return false;
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      return true;
    });

    const filteredExpenses = expenses.filter((e) => {
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date > endDate) return false;
      return true;
    });

    const grossSales = completedTxs.reduce((sum, t) => sum + t.subtotal, 0);
    const discounts = completedTxs.reduce((sum, t) => sum + t.discountAmount, 0);

    // Revenue takes into account online platform net income if applicable
    const netRevenue = completedTxs.reduce((sum, t) => {
      if (t.channel === 'ONLINE' && t.onlineNetIncome) {
        return sum + t.onlineNetIncome;
      }
      return sum + (t.totalAmount - t.taxAmount);
    }, 0);

    const cogsTotal = completedTxs.reduce((sum, t) => sum + t.totalCOGS, 0);
    const grossProfit = netRevenue - cogsTotal;
    const grossMarginPct = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

    const operatingExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - operatingExpenses;
    const netMarginPct = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

    const cashInflow = completedTxs.reduce((sum, t) => {
      return sum + (t.channel === 'ONLINE' && t.onlineNetIncome ? t.onlineNetIncome : t.totalAmount);
    }, 0);

    const cashOutflow = operatingExpenses;
    const netCashFlow = cashInflow - cashOutflow;

    const paymentBreakdown: Record<string, number> = {};
    const channelBreakdown = {
      offlineTotal: 0,
      onlineTotal: 0,
      onlinePlatforms: {
        ShopeeFood: 0,
        GrabFood: 0,
        GoFood: 0,
      },
    };

    completedTxs.forEach((t) => {
      const val = t.channel === 'ONLINE' && t.onlineNetIncome ? t.onlineNetIncome : t.totalAmount;
      paymentBreakdown[t.paymentMethod] = (paymentBreakdown[t.paymentMethod] || 0) + val;

      if (t.channel === 'OFFLINE') {
        channelBreakdown.offlineTotal += val;
      } else if (t.channel === 'ONLINE' && t.onlinePlatform) {
        channelBreakdown.onlineTotal += val;
        channelBreakdown.onlinePlatforms[t.onlinePlatform] =
          (channelBreakdown.onlinePlatforms[t.onlinePlatform] || 0) + val;
      }
    });

    return {
      grossSales,
      discounts,
      netRevenue,
      cogsTotal,
      grossProfit,
      grossMarginPct,
      operatingExpenses,
      netProfit,
      netMarginPct,
      cashInflow,
      cashOutflow,
      netCashFlow,
      transactionCount: completedTxs.length,
      averageOrderValue: completedTxs.length > 0 ? Math.round(cashInflow / completedTxs.length) : 0,
      paymentBreakdown,
      channelBreakdown,
    };
  };

  return (
    <AppContext.Provider
      value={{
        rawMaterials,
        menuItems,
        cart,
        transactions,
        stockMovements,
        expenses,
        currentShift,
        storeSettings,
        customers,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        checkoutTransaction,
        voidTransaction,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        adjustCustomerPoints,
        restockMaterial,
        adjustMaterialStock,
        addRawMaterial,
        updateRawMaterial,
        deleteRawMaterial,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        updateMenuRecipe,
        addExpense,
        deleteExpense,
        openShift,
        closeShift,
        updateSettings,
        resetToInitialData,
        lowStockItems,
        calculateRecipeCOGS,
        getFinancialMetrics,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
