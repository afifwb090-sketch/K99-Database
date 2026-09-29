import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Printer,
  Calendar,
  PieChart,
  PlusCircle,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  BarChart3,
  LineChart as LineChartIcon,
  Sparkles,
  Layers,
  Award,
  Coffee,
  ShoppingCart,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { formatIDR, formatNumber, formatDate, downloadCSV } from '../utils/formatters';

interface FinancialReportsViewProps {
  onOpenExpenseModal: () => void;
}

export const FinancialReportsView: React.FC<FinancialReportsViewProps> = ({
  onOpenExpenseModal,
}) => {
  const { transactions, expenses, menuItems, rawMaterials, getFinancialMetrics, deleteExpense } =
    useApp();

  const [period, setPeriod] = useState<'today' | 'yesterday' | '7days' | 'month' | 'all'>('month');
  const [activeReportTab, setActiveReportTab] = useState<'charts' | 'pnl' | 'cashflow' | 'bestsellers' | 'expenses'>('charts');
  const [chartViewMode, setChartViewMode] = useState<'all' | 'daily' | 'monthly' | 'channels'>('all');
  const [dailyRange, setDailyRange] = useState<'7days' | '14days' | '30days' | 'all'>('all');

  // Compute dates based on period
  const { startDate, endDate, periodLabel } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (period === 'today') {
      return { startDate: todayStr, endDate: todayStr, periodLabel: `Hari Ini (${formatDate(todayStr)})` };
    }

    if (period === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      return { startDate: yStr, endDate: yStr, periodLabel: `Kemarin (${formatDate(yStr)})` };
    }

    if (period === '7days') {
      const past7 = new Date(now);
      past7.setDate(past7.getDate() - 7);
      const past7Str = past7.toISOString().split('T')[0];
      return { startDate: past7Str, endDate: todayStr, periodLabel: '7 Hari Terakhir' };
    }

    if (period === 'month') {
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      return { startDate: monthStart, endDate: todayStr, periodLabel: 'Bulan Ini' };
    }

    return { startDate: undefined, endDate: undefined, periodLabel: 'Semua Waktu' };
  }, [period]);

  // Financial Metrics
  const metrics = useMemo(() => {
    return getFinancialMetrics(startDate, endDate);
  }, [getFinancialMetrics, startDate, endDate]);

  // Filtered transactions & expenses
  const filteredTxs = useMemo(() => {
    return transactions.filter((t) => {
      if (t.status !== 'COMPLETED') return false;
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      return true;
    });
  }, [transactions, startDate, endDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date > endDate) return false;
      return true;
    });
  }, [expenses, startDate, endDate]);

  // Expenses grouped by category
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return map;
  }, [filteredExpenses]);

  // Best selling products breakdown
  const bestSellers = useMemo(() => {
    const map: Record<string, { name: string; quantity: number; revenue: number; cogs: number }> = {};

    filteredTxs.forEach((tx) => {
      tx.items.forEach((item) => {
        if (!map[item.menuItemId]) {
          map[item.menuItemId] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
            cogs: 0,
          };
        }
        map[item.menuItemId].quantity += item.quantity;
        map[item.menuItemId].revenue += item.itemTotal;
        map[item.menuItemId].cogs += item.calculatedCost * item.quantity;
      });
    });

    return Object.values(map).sort((a, b) => b.quantity - a.quantity);
  }, [filteredTxs]);

  // Top 5 products for chart
  const topProductsChartData = useMemo(() => {
    return bestSellers.slice(0, 5).map((item) => ({
      name: item.name.length > 20 ? item.name.slice(0, 18) + '..' : item.name,
      fullName: item.name,
      cups: item.quantity,
      revenue: item.revenue,
      cogs: item.cogs,
      grossProfit: item.revenue - item.cogs,
    }));
  }, [bestSellers]);

  // DATA TRANSFORMATION FOR RECHARTS: Daily Sales Trend
  const dailyTrendData = useMemo(() => {
    const map: Record<
      string,
      {
        date: string;
        displayDate: string;
        grossSales: number;
        netRevenue: number;
        cogs: number;
        grossProfit: number;
        expenses: number;
        netProfit: number;
        offlineSales: number;
        onlineSales: number;
        ShopeeFood: number;
        GrabFood: number;
        GoFood: number;
        ordersCount: number;
        cupsCount: number;
      }
    > = {};

    // Group transactions
    transactions
      .filter((t) => t.status === 'COMPLETED')
      .forEach((tx) => {
        const d = tx.date;
        if (!map[d]) {
          const dt = new Date(d);
          const displayDate = `${dt.getDate()} ${new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(dt)}`;
          map[d] = {
            date: d,
            displayDate,
            grossSales: 0,
            netRevenue: 0,
            cogs: 0,
            grossProfit: 0,
            expenses: 0,
            netProfit: 0,
            offlineSales: 0,
            onlineSales: 0,
            ShopeeFood: 0,
            GrabFood: 0,
            GoFood: 0,
            ordersCount: 0,
            cupsCount: 0,
          };
        }

        const netRev = tx.channel === 'ONLINE' && tx.onlineNetIncome ? tx.onlineNetIncome : tx.totalAmount - tx.taxAmount;
        map[d].grossSales += tx.subtotal;
        map[d].netRevenue += netRev;
        map[d].cogs += tx.totalCOGS;
        map[d].ordersCount += 1;
        
        const txCups = tx.items.reduce((acc, it) => acc + it.quantity, 0);
        map[d].cupsCount += txCups;

        if (tx.channel === 'OFFLINE') {
          map[d].offlineSales += netRev;
        } else if (tx.channel === 'ONLINE') {
          map[d].onlineSales += netRev;
          if (tx.onlinePlatform === 'ShopeeFood') map[d].ShopeeFood += netRev;
          if (tx.onlinePlatform === 'GrabFood') map[d].GrabFood += netRev;
          if (tx.onlinePlatform === 'GoFood') map[d].GoFood += netRev;
        }
      });

    // Group expenses into dates
    expenses.forEach((exp) => {
      if (map[exp.date]) {
        map[exp.date].expenses += exp.amount;
      }
    });

    // Calculate gross profit and net profit per day
    return Object.values(map)
      .map((item) => {
        const grossProfit = item.netRevenue - item.cogs;
        const netProfit = grossProfit - item.expenses;
        return {
          ...item,
          grossProfit,
          netProfit,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions, expenses]);

  // Filtered daily trend data based on user selected daily range
  const filteredDailyTrendData = useMemo(() => {
    if (dailyRange === 'all' || dailyTrendData.length === 0) return dailyTrendData;
    const daysLimit = dailyRange === '7days' ? 7 : dailyRange === '14days' ? 14 : 30;
    return dailyTrendData.slice(-daysLimit);
  }, [dailyTrendData, dailyRange]);

  // DATA TRANSFORMATION FOR RECHARTS: Monthly Sales Trend with MoM Growth
  const monthlyTrendData = useMemo(() => {
    const map: Record<
      string,
      {
        month: string;
        displayMonth: string;
        grossSales: number;
        netRevenue: number;
        cogs: number;
        grossProfit: number;
        expenses: number;
        netProfit: number;
        offlineSales: number;
        onlineSales: number;
        ordersCount: number;
        cupsCount: number;
      }
    > = {};

    transactions
      .filter((t) => t.status === 'COMPLETED')
      .forEach((tx) => {
        const m = tx.date.slice(0, 7); // YYYY-MM
        if (!map[m]) {
          const [year, monthNum] = m.split('-');
          const dt = new Date(Number(year), Number(monthNum) - 1, 1);
          const displayMonth = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(dt);
          map[m] = {
            month: m,
            displayMonth,
            grossSales: 0,
            netRevenue: 0,
            cogs: 0,
            grossProfit: 0,
            expenses: 0,
            netProfit: 0,
            offlineSales: 0,
            onlineSales: 0,
            ordersCount: 0,
            cupsCount: 0,
          };
        }

        const netRev = tx.channel === 'ONLINE' && tx.onlineNetIncome ? tx.onlineNetIncome : tx.totalAmount - tx.taxAmount;
        map[m].grossSales += tx.subtotal;
        map[m].netRevenue += netRev;
        map[m].cogs += tx.totalCOGS;
        map[m].ordersCount += 1;
        map[m].cupsCount += tx.items.reduce((acc, it) => acc + it.quantity, 0);

        if (tx.channel === 'OFFLINE') {
          map[m].offlineSales += netRev;
        } else {
          map[m].onlineSales += netRev;
        }
      });

    expenses.forEach((exp) => {
      const m = exp.date.slice(0, 7);
      if (map[m]) {
        map[m].expenses += exp.amount;
      }
    });

    const sortedMonths = Object.values(map)
      .map((item) => {
        const grossProfit = item.netRevenue - item.cogs;
        const netProfit = grossProfit - item.expenses;
        const netMarginPct = item.netRevenue > 0 ? (netProfit / item.netRevenue) * 100 : 0;
        return {
          ...item,
          grossProfit,
          netProfit,
          netMarginPct,
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calculate Month-over-Month (MoM) growth
    return sortedMonths.map((item, idx) => {
      let momGrowth = 0;
      if (idx > 0) {
        const prevNet = sortedMonths[idx - 1].netRevenue;
        if (prevNet > 0) {
          momGrowth = Math.round(((item.netRevenue - prevNet) / prevNet) * 100);
        }
      }
      return {
        ...item,
        momGrowth,
      };
    });
  }, [transactions, expenses]);

  // Peak sales day calculation from filtered daily data
  const peakDay = useMemo(() => {
    if (filteredDailyTrendData.length === 0) return null;
    return filteredDailyTrendData.reduce((prev, current) => (prev.netRevenue > current.netRevenue ? prev : current));
  }, [filteredDailyTrendData]);

  // Lowest sales day calculation
  const lowestDay = useMemo(() => {
    if (filteredDailyTrendData.length === 0) return null;
    return filteredDailyTrendData.reduce((prev, current) => (prev.netRevenue < current.netRevenue ? prev : current));
  }, [filteredDailyTrendData]);

  // Average daily net revenue
  const averageDailyNet = useMemo(() => {
    if (filteredDailyTrendData.length === 0) return 0;
    const total = filteredDailyTrendData.reduce((sum, d) => sum + d.netRevenue, 0);
    return Math.round(total / filteredDailyTrendData.length);
  }, [filteredDailyTrendData]);

  // Total cups in filtered daily range
  const totalDailyCups = useMemo(() => {
    return filteredDailyTrendData.reduce((sum, d) => sum + d.cupsCount, 0);
  }, [filteredDailyTrendData]);

  // Best performing month
  const peakMonth = useMemo(() => {
    if (monthlyTrendData.length === 0) return null;
    return monthlyTrendData.reduce((prev, current) => (prev.netRevenue > current.netRevenue ? prev : current));
  }, [monthlyTrendData]);

  // Average monthly net revenue
  const averageMonthlyNet = useMemo(() => {
    if (monthlyTrendData.length === 0) return 0;
    const total = monthlyTrendData.reduce((sum, m) => sum + m.netRevenue, 0);
    return Math.round(total / monthlyTrendData.length);
  }, [monthlyTrendData]);

  // Export P&L report to CSV
  const handleExportCSV = () => {
    const csvLines = [
      `LAPORAN LABA RUGI K99 COFFEE POS`,
      `Periode: ${periodLabel}`,
      `Tanggal Unduh: ${new Date().toLocaleString('id-ID')}`,
      ``,
      `Komponen,Nominal (IDR)`,
      `Total Penjualan Kotor (Gross Sales),${metrics.grossSales}`,
      `Penjualan Offline (Kedai),${metrics.channelBreakdown.offlineTotal}`,
      `Penjualan Online (Ojol),${metrics.channelBreakdown.onlineTotal}`,
      `- ShopeeFood,${metrics.channelBreakdown.onlinePlatforms.ShopeeFood}`,
      `- GrabFood,${metrics.channelBreakdown.onlinePlatforms.GrabFood}`,
      `- GoFood,${metrics.channelBreakdown.onlinePlatforms.GoFood}`,
      `Potongan Diskon & Poin,${metrics.discounts}`,
      `Pendapatan Bersih Realisasi (Net Revenue),${metrics.netRevenue}`,
      `Harga Pokok Penjualan (Total HPP Bahan),${metrics.cogsTotal}`,
      `Laba Kotor (Gross Profit),${metrics.grossProfit}`,
      `Margin Laba Kotor (%),${metrics.grossMarginPct.toFixed(1)}%`,
      ``,
      `BEBAN OPERASIONAL:`,
      ...Object.entries(expenseByCategory).map(([cat, amt]) => `"${cat}",${amt}`),
      `Total Beban Operasional,${metrics.operatingExpenses}`,
      ``,
      `LABA BERSIH (NET PROFIT),${metrics.netProfit}`,
      `Margin Laba Bersih (%),${metrics.netMarginPct.toFixed(1)}%`,
    ];

    downloadCSV(`k99_laporan_keuangan_${period}_${new Date().toISOString().split('T')[0]}.csv`, csvLines.join('\n'));
  };

  const handlePrint = () => {
    window.print();
  };

  // Recharts Custom Tooltip Component with clean dark styling
  const CustomRechartsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-neutral-900 border border-neutral-700/80 rounded-xl p-3.5 shadow-2xl text-xs space-y-2 font-mono z-50 min-w-44">
          <div className="font-sans font-bold text-white border-b border-neutral-800 pb-1.5 flex items-center justify-between">
            <span>{label}</span>
          </div>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => {
              const nameLower = entry.name?.toLowerCase() || '';
              const isCupOrOrder = nameLower.includes('cup') || nameLower.includes('pesanan') || nameLower.includes('order');
              const displayVal = isCupOrOrder
                ? `${formatNumber(entry.value)} ${nameLower.includes('cup') ? 'Cup' : 'Transaksi'}`
                : formatIDR(entry.value);

              return (
                <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="font-sans text-neutral-300">{entry.name}:</span>
                  </span>
                  <span className="font-bold tabular-nums text-white">
                    {displayVal}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Y-Axis tick IDR formatter
  const formatYAxisTick = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}jt`;
    if (val >= 1000) return `${Math.round(val / 1000)}rb`;
    return String(val);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Bar with Period Filter & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Laporan Keuangan & Analisis Visual</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Recharts Engine
            </span>
          </h2>
          <span className="text-xs text-neutral-400">
            Pantau tren omzet harian & bulanan, HPP bahan baku, perbandingan offline vs ojol, serta laba bersih.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg text-xs">
            {(
              [
                { id: 'today', label: 'Hari Ini' },
                { id: 'yesterday', label: 'Kemarin' },
                { id: '7days', label: '7 Hari' },
                { id: 'month', label: 'Bulan Ini' },
                { id: 'all', label: 'Semua' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
                  period === p.id
                    ? 'bg-amber-600 text-white font-semibold shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenExpenseModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>+ Catat Beban</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors"
            title="Ekspor CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors"
            title="Cetak Laporan"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* 5-Column Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Net Revenue */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <span className="text-xs text-neutral-400 block font-medium">Pendapatan Bersih</span>
          <span className="text-lg font-bold text-white font-mono tabular-nums block mt-1">
            {formatIDR(metrics.netRevenue)}
          </span>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            {metrics.transactionCount} transaksi ({periodLabel})
          </span>
        </div>

        {/* Total COGS / HPP */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <span className="text-xs text-neutral-400 block font-medium">Total HPP Bahan Baku</span>
          <span className="text-lg font-bold text-amber-400 font-mono tabular-nums block mt-1">
            {formatIDR(metrics.cogsTotal)}
          </span>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            Terpotong otomatis via resep
          </span>
        </div>

        {/* Gross Profit */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <span className="text-xs text-neutral-400 block font-medium">Laba Kotor (Gross)</span>
          <span className="text-lg font-bold text-emerald-400 font-mono tabular-nums block mt-1">
            {formatIDR(metrics.grossProfit)}
          </span>
          <span className="text-[11px] text-emerald-500 mt-1 block">
            Margin: {metrics.grossMarginPct.toFixed(1)}%
          </span>
        </div>

        {/* Operating Expenses */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <span className="text-xs text-neutral-400 block font-medium">Beban Operasional</span>
          <span className="text-lg font-bold text-red-400 font-mono tabular-nums block mt-1">
            {formatIDR(metrics.operatingExpenses)}
          </span>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            {filteredExpenses.length} catatan pengeluaran
          </span>
        </div>

        {/* Net Profit */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <span className="text-xs text-neutral-400 block font-medium">Laba Bersih (Net Profit)</span>
          <span
            className={`text-lg font-bold font-mono tabular-nums block mt-1 ${
              metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {formatIDR(metrics.netProfit)}
          </span>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Net Margin: {metrics.netMarginPct.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Tabs navigation for different financial perspectives */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-3 border-b border-neutral-800 bg-neutral-900/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveReportTab('charts')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeReportTab === 'charts'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Grafik Visualisasi Tren (Recharts)</span>
          </button>
          <button
            onClick={() => setActiveReportTab('pnl')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeReportTab === 'pnl'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Laporan Laba Rugi (P&L)
          </button>
          <button
            onClick={() => setActiveReportTab('cashflow')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeReportTab === 'cashflow'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Laporan Arus Kas (Cash Flow)
          </button>
          <button
            onClick={() => setActiveReportTab('bestsellers')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeReportTab === 'bestsellers'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Ranking Produk Terlaris
          </button>
          <button
            onClick={() => setActiveReportTab('expenses')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeReportTab === 'expenses'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Buku Beban Pengeluaran ({filteredExpenses.length})
          </button>
        </div>

        {/* TAB 0: RECHARTS VISUALIZATION DASHBOARD */}
        {activeReportTab === 'charts' && (
          <div className="p-6 space-y-8">
            {/* Chart Sub-navigation & Insights Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
              <div className="flex flex-wrap items-center gap-1.5 bg-neutral-950 p-1 rounded-lg border border-neutral-800/80">
                <button
                  type="button"
                  onClick={() => setChartViewMode('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                    chartViewMode === 'all'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Semua Grafik (Harian & Bulanan)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode('daily')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                    chartViewMode === 'daily'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <LineChartIcon className="w-3.5 h-3.5" />
                  <span>Tren Harian</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode('monthly')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                    chartViewMode === 'monthly'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Tren Bulanan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode('channels')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                    chartViewMode === 'channels'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Saluran & Menu Terlaris</span>
                </button>
              </div>

              {/* Quick Insight pill labels */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                {peakDay && (
                  <div className="flex items-center gap-1.5 bg-neutral-950/80 px-2.5 py-1 rounded-md border border-neutral-800 text-neutral-400">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Puncak Harian:</span>
                    <strong className="text-white font-mono">{peakDay.displayDate}</strong>
                    <span className="text-emerald-400 font-mono">({formatIDR(peakDay.netRevenue)})</span>
                  </div>
                )}
                {monthlyTrendData.length > 1 && (
                  <div className="flex items-center gap-1.5 bg-neutral-950/80 px-2.5 py-1 rounded-md border border-neutral-800 text-neutral-400">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>MoM Terakhir:</span>
                    <strong
                      className={`font-mono ${
                        monthlyTrendData[monthlyTrendData.length - 1].momGrowth >= 0
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }`}
                    >
                      {monthlyTrendData[monthlyTrendData.length - 1].momGrowth >= 0 ? '+' : ''}
                      {monthlyTrendData[monthlyTrendData.length - 1].momGrowth}%
                    </strong>
                  </div>
                )}
                {totalDailyCups > 0 && (
                  <div className="flex items-center gap-1.5 bg-neutral-950/80 px-2.5 py-1 rounded-md border border-neutral-800 text-neutral-400">
                    <Coffee className="w-3.5 h-3.5 text-amber-400" />
                    <span>Total Cup:</span>
                    <strong className="text-white font-mono">{totalDailyCups} Cup</strong>
                  </div>
                )}
              </div>
            </div>

            {/* KOMPONEN 1: GRAFIK TREN PENJUALAN HARIAN */}
            {(chartViewMode === 'all' || chartViewMode === 'daily') && (
              <div className="bg-neutral-950/60 border border-neutral-800/90 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg">
                        <LineChartIcon className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-white text-base">Grafik Tren Penjualan Harian (Daily Sales Trend)</h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        AreaChart Recharts
                      </span>
                    </div>
                    <p className="text-neutral-400 text-xs mt-1">
                      Pergerakan fluktuasi harian antara Pendapatan Bersih (Net Revenue), Laba Kotor, dan HPP Bahan Baku.
                    </p>
                  </div>

                  {/* Range filter buttons for daily chart */}
                  <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800 text-xs w-fit">
                    {(
                      [
                        { id: '7days', label: '7 Hari' },
                        { id: '14days', label: '14 Hari' },
                        { id: '30days', label: '30 Hari' },
                        { id: 'all', label: 'Semua' },
                      ] as const
                    ).map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setDailyRange(r.id)}
                        className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                          dailyRange === r.id
                            ? 'bg-amber-600 text-white font-semibold shadow-xs'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Daily KPIs summary pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3">
                    <span className="text-[11px] text-neutral-400 block">Rata-rata Omzet / Hari</span>
                    <span className="text-sm font-bold text-white font-mono tabular-nums mt-0.5 block">
                      {formatIDR(averageDailyNet)}
                    </span>
                  </div>
                  <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3">
                    <span className="text-[11px] text-neutral-400 block">Hari Penjualan Tertinggi</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
                        {peakDay ? formatIDR(peakDay.netRevenue) : '-'}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-medium">{peakDay?.displayDate}</span>
                    </div>
                  </div>
                  <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3">
                    <span className="text-[11px] text-neutral-400 block">Hari Terendah</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-sm font-bold text-amber-400 font-mono tabular-nums">
                        {lowestDay ? formatIDR(lowestDay.netRevenue) : '-'}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-medium">{lowestDay?.displayDate}</span>
                    </div>
                  </div>
                  <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3">
                    <span className="text-[11px] text-neutral-400 block">Total Cup & Transaksi</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-sm font-bold text-white font-mono tabular-nums">
                        {totalDailyCups} Cup
                      </span>
                      <span className="text-[10px] text-neutral-400 font-medium">
                        {filteredDailyTrendData.reduce((sum, d) => sum + d.ordersCount, 0)} Order
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recharts AreaChart Container */}
                <div className="h-80 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={filteredDailyTrendData}
                      margin={{ top: 12, right: 12, left: 0, bottom: 4 }}
                    >
                      <defs>
                        <linearGradient id="colorNetRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#d97706" stopOpacity={0.65} />
                          <stop offset="95%" stopColor="#d97706" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="colorGrossProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.55} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="colorCogs" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                      <XAxis
                        dataKey="displayDate"
                        stroke="#737373"
                        tickLine={false}
                        fontSize={11}
                        dy={8}
                      />
                      <YAxis
                        stroke="#737373"
                        tickLine={false}
                        fontSize={11}
                        tickFormatter={formatYAxisTick}
                        dx={-4}
                      />
                      <Tooltip content={<CustomRechartsTooltip />} />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: '11px', color: '#a3a3a3' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="netRevenue"
                        name="Pendapatan Bersih"
                        stroke="#d97706"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorNetRevenue)"
                      />
                      <Area
                        type="monotone"
                        dataKey="grossProfit"
                        name="Laba Kotor"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorGrossProfit)"
                      />
                      <Area
                        type="monotone"
                        dataKey="cogs"
                        name="HPP Bahan Baku"
                        stroke="#ef4444"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        fillOpacity={1}
                        fill="url(#colorCogs)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Compact Daily Data Summary Row */}
                <div className="overflow-x-auto pt-2 border-t border-neutral-800/80">
                  <div className="flex items-center gap-2 min-w-max text-xs font-mono">
                    <span className="text-neutral-500 font-sans text-[11px] font-semibold uppercase tracking-wider mr-2">
                      Ringkasan Data Harian ({filteredDailyTrendData.length} Hari):
                    </span>
                    {filteredDailyTrendData.slice(-6).map((day) => (
                      <div
                        key={day.date}
                        className="px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center gap-2"
                      >
                        <span className="font-sans text-neutral-300 font-medium">{day.displayDate}:</span>
                        <span className="text-amber-400 font-bold">{formatIDR(day.netRevenue)}</span>
                        <span className="text-[10px] text-neutral-500">({day.cupsCount} cup)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* KOMPONEN 2: GRAFIK TREN PENJUALAN BULANAN */}
            {(chartViewMode === 'all' || chartViewMode === 'monthly') && (
              <div className="bg-neutral-950/60 border border-neutral-800/90 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                        <BarChart3 className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-white text-base">Grafik Tren Penjualan & Laba Bulanan (Monthly Performance)</h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        BarChart Recharts
                      </span>
                    </div>
                    <p className="text-neutral-400 text-xs mt-1">
                      Komparasi bulanan antara Penjualan Kotor, Pendapatan Bersih, HPP Bahan, Beban Operasional, dan Laba Bersih.
                    </p>
                  </div>

                  {/* Monthly high-level stats */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800 flex items-center gap-1.5 text-neutral-400">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>Bulan Terbaik:</span>
                      <strong className="text-white font-mono">{peakMonth?.displayMonth}</strong>
                    </div>
                  </div>
                </div>

                {/* Recharts BarChart Container */}
                <div className="h-80 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyTrendData}
                      margin={{ top: 12, right: 12, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                      <XAxis
                        dataKey="displayMonth"
                        stroke="#737373"
                        tickLine={false}
                        fontSize={11}
                        dy={8}
                      />
                      <YAxis
                        stroke="#737373"
                        tickLine={false}
                        fontSize={11}
                        tickFormatter={formatYAxisTick}
                        dx={-4}
                      />
                      <Tooltip content={<CustomRechartsTooltip />} />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: '11px', color: '#a3a3a3' }}
                      />
                      <Bar
                        dataKey="grossSales"
                        name="Omzet Kotor"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={36}
                      />
                      <Bar
                        dataKey="netRevenue"
                        name="Pendapatan Bersih"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={36}
                      />
                      <Bar
                        dataKey="cogs"
                        name="HPP Bahan Baku"
                        fill="#fb923c"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={36}
                      />
                      <Bar
                        dataKey="expenses"
                        name="Beban Operasional"
                        fill="#f87171"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={36}
                      />
                      <Bar
                        dataKey="netProfit"
                        name="Laba Bersih"
                        fill="#06b6d4"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={36}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Monthly Performance Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
                  {monthlyTrendData.map((m, idx) => (
                    <div
                      key={m.month}
                      className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3.5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                        <span className="font-bold text-white text-xs">{m.displayMonth}</span>
                        {idx > 0 && (
                          <span
                            className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                              m.momGrowth >= 0
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {m.momGrowth >= 0 ? '+' : ''}
                            {m.momGrowth}% MoM
                          </span>
                        )}
                        {idx === 0 && (
                          <span className="text-[10px] text-neutral-500 font-mono">Bulan Awal</span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-neutral-500 font-sans block">Pendapatan Bersih</span>
                          <span className="font-bold text-emerald-400">{formatIDR(m.netRevenue)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 font-sans block">Laba Bersih</span>
                          <span
                            className={`font-bold ${
                              m.netProfit >= 0 ? 'text-cyan-400' : 'text-red-400'
                            }`}
                          >
                            {formatIDR(m.netProfit)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 font-sans block">HPP Bahan</span>
                          <span className="text-neutral-300">{formatIDR(m.cogs)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 font-sans block">Margin Bersih</span>
                          <span className="text-amber-400 font-semibold">{m.netMarginPct.toFixed(1)}%</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-neutral-400 flex items-center justify-between pt-1 border-t border-neutral-800/60">
                        <span>Total Pesanan:</span>
                        <span className="font-mono text-white font-semibold">
                          {m.ordersCount} Transaksi ({m.cupsCount} Cup)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* KOMPONEN 3 & 4: SALURAN PENJUALAN & TOP 5 MENU TERLARIS (2 Kolom) */}
            {(chartViewMode === 'all' || chartViewMode === 'channels') && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* CHART 3: CHANNELS DISTRIBUTION (Stacked BarChart) */}
                <div className="bg-neutral-950/60 border border-neutral-800/90 rounded-2xl p-5 space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-lg">
                        <Layers className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-white text-base">Distribusi Saluran Penjualan</h3>
                    </div>
                    <p className="text-neutral-400 text-xs mt-1">
                      Porsi kontribusi pendapatan: Kasir Offline Kedai vs ShopeeFood, GrabFood, dan GoFood.
                    </p>
                  </div>

                  <div className="h-72 w-full pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={filteredDailyTrendData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                        <XAxis
                          dataKey="displayDate"
                          stroke="#737373"
                          tickLine={false}
                          fontSize={11}
                          dy={8}
                        />
                        <YAxis
                          stroke="#737373"
                          tickLine={false}
                          fontSize={11}
                          tickFormatter={formatYAxisTick}
                          dx={-4}
                        />
                        <Tooltip content={<CustomRechartsTooltip />} />
                        <Legend
                          verticalAlign="top"
                          height={36}
                          iconType="circle"
                          wrapperStyle={{ fontSize: '11px', color: '#a3a3a3' }}
                        />
                        <Bar
                          dataKey="offlineSales"
                          name="Offline Kedai"
                          stackId="a"
                          fill="#d97706"
                          maxBarSize={36}
                        />
                        <Bar
                          dataKey="ShopeeFood"
                          name="ShopeeFood"
                          stackId="a"
                          fill="#f97316"
                          maxBarSize={36}
                        />
                        <Bar
                          dataKey="GrabFood"
                          name="GrabFood"
                          stackId="a"
                          fill="#10b981"
                          maxBarSize={36}
                        />
                        <Bar
                          dataKey="GoFood"
                          name="GoFood"
                          stackId="a"
                          fill="#ef4444"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={36}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Channel share breakdown summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-neutral-800 text-xs">
                    <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-800">
                      <span className="text-[10px] text-amber-400 font-semibold block">Offline Kedai</span>
                      <span className="font-mono text-white font-bold tabular-nums">
                        {formatIDR(metrics.channelBreakdown.offlineTotal)}
                      </span>
                    </div>
                    <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-800">
                      <span className="text-[10px] text-orange-400 font-semibold block">ShopeeFood</span>
                      <span className="font-mono text-white font-bold tabular-nums">
                        {formatIDR(metrics.channelBreakdown.onlinePlatforms.ShopeeFood)}
                      </span>
                    </div>
                    <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-800">
                      <span className="text-[10px] text-emerald-400 font-semibold block">GrabFood</span>
                      <span className="font-mono text-white font-bold tabular-nums">
                        {formatIDR(metrics.channelBreakdown.onlinePlatforms.GrabFood)}
                      </span>
                    </div>
                    <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-800">
                      <span className="text-[10px] text-red-400 font-semibold block">GoFood</span>
                      <span className="font-mono text-white font-bold tabular-nums">
                        {formatIDR(metrics.channelBreakdown.onlinePlatforms.GoFood)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CHART 4: TOP 5 MENU TERLARIS (Horizontal BarChart) */}
                <div className="bg-neutral-950/60 border border-neutral-800/90 rounded-2xl p-5 space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg">
                        <Coffee className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-white text-base">Top 5 Menu Paling Laris (Volume Cup)</h3>
                    </div>
                    <p className="text-neutral-400 text-xs mt-1">
                      Peringkat minuman dan makanan dengan penjualan tertinggi serta kontribusi omzet.
                    </p>
                  </div>

                  <div className="h-72 w-full pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={topProductsChartData}
                        margin={{ top: 10, right: 24, left: 10, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                        <XAxis
                          type="number"
                          stroke="#737373"
                          tickLine={false}
                          fontSize={11}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="#a3a3a3"
                          tickLine={false}
                          fontSize={11}
                          width={110}
                        />
                        <Tooltip content={<CustomRechartsTooltip />} />
                        <Legend
                          verticalAlign="top"
                          height={36}
                          iconType="circle"
                          wrapperStyle={{ fontSize: '11px', color: '#a3a3a3' }}
                        />
                        <Bar
                          dataKey="cups"
                          name="Total Cup Terjual"
                          fill="#d97706"
                          radius={[0, 4, 4, 0]}
                          maxBarSize={24}
                        >
                          {topProductsChartData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                index === 0
                                  ? '#f59e0b'
                                  : index === 1
                                  ? '#d97706'
                                  : index === 2
                                  ? '#b45309'
                                  : '#78350f'
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Best seller ranking mini list */}
                  <div className="space-y-1.5 pt-2 border-t border-neutral-800 text-xs">
                    {topProductsChartData.slice(0, 3).map((item, idx) => (
                      <div
                        key={item.fullName}
                        className="flex items-center justify-between text-neutral-300 py-0.5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-400 font-mono">#{idx + 1}</span>
                          <span className="truncate max-w-[200px]">{item.fullName}</span>
                        </div>
                        <div className="flex items-center gap-2.5 font-mono">
                          <span className="text-white font-bold">{item.cups} Cup</span>
                          <span className="text-emerald-400 font-semibold">{formatIDR(item.revenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: P&L Statement */}
        {activeReportTab === 'pnl' && (
          <div className="p-6 space-y-6">
            <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950/40 divide-y divide-neutral-800 text-xs">
              {/* SECTION 1: REVENUE */}
              <div className="p-4 space-y-2.5 bg-neutral-900/30">
                <span className="font-bold text-neutral-300 uppercase tracking-wider block">
                  1. PENDAPATAN OPERASIONAL KEDAI KOPI (BERDASARKAN SALURAN)
                </span>
                
                {/* Channel breakdowns */}
                <div className="pl-4 space-y-1.5 border-l-2 border-neutral-800 ml-2">
                  <div className="flex justify-between text-neutral-300 font-medium">
                    <span>• Penjualan Offline (Kasir Kedai)</span>
                    <span className="font-mono tabular-nums text-white">
                      {formatIDR(metrics.channelBreakdown.offlineTotal)}
                    </span>
                  </div>

                  <div className="flex justify-between text-neutral-300 font-medium">
                    <span>• Penjualan Online Platform (Ojol)</span>
                    <span className="font-mono tabular-nums text-emerald-400">
                      {formatIDR(metrics.channelBreakdown.onlineTotal)}
                    </span>
                  </div>

                  {/* Sub-breakdown of online platforms */}
                  <div className="pl-4 space-y-1 text-neutral-400 text-[11px]">
                    <div className="flex justify-between">
                      <span>- ShopeeFood</span>
                      <span className="font-mono tabular-nums">
                        {formatIDR(metrics.channelBreakdown.onlinePlatforms.ShopeeFood)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>- GrabFood</span>
                      <span className="font-mono tabular-nums">
                        {formatIDR(metrics.channelBreakdown.onlinePlatforms.GrabFood)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>- GoFood</span>
                      <span className="font-mono tabular-nums">
                        {formatIDR(metrics.channelBreakdown.onlinePlatforms.GoFood)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pl-4 text-neutral-400 pt-1">
                  <span>Total Penjualan Kotor (Gross Sales)</span>
                  <span className="font-mono tabular-nums text-neutral-200">
                    {formatIDR(metrics.grossSales)}
                  </span>
                </div>
                {metrics.discounts > 0 && (
                  <div className="flex justify-between pl-4 text-amber-400">
                    <span>Potongan Diskon & Poin Loyalitas</span>
                    <span className="font-mono tabular-nums">-{formatIDR(metrics.discounts)}</span>
                  </div>
                )}
                <div className="flex justify-between pl-4 font-semibold text-white pt-1.5 border-t border-neutral-800/80">
                  <span>PENDAPATAN BERSIH REALISASI (NET REVENUE)</span>
                  <span className="font-mono tabular-nums text-sm text-emerald-400">
                    {formatIDR(metrics.netRevenue)}
                  </span>
                </div>
              </div>

              {/* SECTION 2: COGS */}
              <div className="p-4 space-y-2 bg-neutral-900/30">
                <span className="font-bold text-neutral-300 uppercase tracking-wider block">
                  2. HARGA POKOK PENJUALAN (HPP BAHAN BAKU)
                </span>
                <div className="flex justify-between pl-4 text-neutral-400">
                  <span>
                    Biji Kopi, Susu UHT/Oat, Gula Aren, Bubuk Rasa, Kemasan Cup & Sedotan (BOM)
                  </span>
                  <span className="font-mono tabular-nums text-amber-400">
                    ({formatIDR(metrics.cogsTotal)})
                  </span>
                </div>
                <div className="flex justify-between pl-4 font-semibold text-emerald-400 pt-1 border-t border-neutral-800/80">
                  <span>LABA KOTOR (GROSS PROFIT)</span>
                  <span className="font-mono tabular-nums">
                    {formatIDR(metrics.grossProfit)} ({metrics.grossMarginPct.toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* SECTION 3: OPERATING EXPENSES */}
              <div className="p-4 space-y-2.5 bg-neutral-900/30">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-300 uppercase tracking-wider block">
                    3. BEBAN OPERASIONAL KEDAI KOPI
                  </span>
                  <button
                    onClick={onOpenExpenseModal}
                    className="text-[11px] text-amber-400 hover:underline font-semibold"
                  >
                    + Tambah Pengeluaran
                  </button>
                </div>

                {Object.keys(expenseByCategory).length === 0 ? (
                  <div className="pl-4 text-neutral-500 italic">
                    Belum ada beban operasional tercatat pada periode ini.
                  </div>
                ) : (
                  Object.entries(expenseByCategory).map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between pl-4 text-neutral-400">
                      <span>• {cat}</span>
                      <span className="font-mono tabular-nums text-neutral-300">
                        {formatIDR(amt)}
                      </span>
                    </div>
                  ))
                )}

                <div className="flex justify-between pl-4 font-semibold text-red-400 pt-1 border-t border-neutral-800/80">
                  <span>TOTAL BEBAN OPERASIONAL</span>
                  <span className="font-mono tabular-nums">({formatIDR(metrics.operatingExpenses)})</span>
                </div>
              </div>

              {/* SECTION 4: NET PROFIT */}
              <div className="p-4 bg-neutral-900/70 flex justify-between items-center text-sm font-bold">
                <span className="text-white">LABA BERSIH OPERASIONAL (NET PROFIT)</span>
                <span
                  className={`text-base font-mono tabular-nums ${
                    metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {formatIDR(metrics.netProfit)}
                  <span className="text-xs font-normal text-neutral-400 ml-2">
                    (Margin: {metrics.netMarginPct.toFixed(1)}%)
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Cash Flow Statement */}
        {activeReportTab === 'cashflow' && (
          <div className="p-6 space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cash Inflow */}
              <div className="bg-neutral-950/60 border border-neutral-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Arus Kas Masuk (Penerimaan Penjualan)</span>
                </div>

                <div className="space-y-2 divide-y divide-neutral-800/60">
                  {Object.entries(metrics.paymentBreakdown).map(([method, amount]) => (
                    <div key={method} className="flex justify-between pt-2 text-neutral-300">
                      <span>{method}</span>
                      <span className="font-mono font-bold tabular-nums">{formatIDR(amount)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-neutral-800 flex justify-between font-bold text-white">
                  <span>Total Kas Masuk:</span>
                  <span className="font-mono text-emerald-400 tabular-nums">
                    {formatIDR(metrics.cashInflow)}
                  </span>
                </div>
              </div>

              {/* Cash Outflow */}
              <div className="bg-neutral-950/60 border border-neutral-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-wider">
                  <ArrowDownRight className="w-4 h-4" />
                  <span>Arus Kas Keluar (Beban & Pembelian Bahan)</span>
                </div>

                <div className="space-y-2 divide-y divide-neutral-800/60">
                  {Object.entries(expenseByCategory).map(([cat, amount]) => (
                    <div key={cat} className="flex justify-between pt-2 text-neutral-300">
                      <span>{cat}</span>
                      <span className="font-mono font-bold tabular-nums">{formatIDR(amount)}</span>
                    </div>
                  ))}
                  {Object.keys(expenseByCategory).length === 0 && (
                    <div className="pt-2 text-neutral-500 italic">Tidak ada kas keluar di periode ini.</div>
                  )}
                </div>

                <div className="pt-2 border-t border-neutral-800 flex justify-between font-bold text-white">
                  <span>Total Kas Keluar:</span>
                  <span className="font-mono text-red-400 tabular-nums">
                    {formatIDR(metrics.cashOutflow)}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Cash Flow summary */}
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-between font-bold text-sm">
              <span className="text-white">Arus Kas Bersih Periode Ini (Net Cash Flow):</span>
              <span
                className={`font-mono text-base tabular-nums ${
                  metrics.netCashFlow >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {formatIDR(metrics.netCashFlow)}
              </span>
            </div>
          </div>
        )}

        {/* TAB 3: Best Sellers Ranking */}
        {activeReportTab === 'bestsellers' && (
          <div className="p-6 space-y-4 text-xs">
            <span className="text-neutral-400 block">
              Daftar menu kopi dan makanan yang paling laris dipesan beserta kontribusi keuntungannya.
            </span>

            <div className="overflow-x-auto border border-neutral-800 rounded-lg">
              <table className="w-full text-left">
                <thead className="bg-neutral-950/80 text-neutral-400 uppercase tracking-wider font-semibold border-b border-neutral-800">
                  <tr>
                    <th className="py-3 px-4">Peringkat</th>
                    <th className="py-3 px-4">Nama Produk</th>
                    <th className="py-3 px-4 text-right">Terjual</th>
                    <th className="py-3 px-4 text-right">Total Omzet</th>
                    <th className="py-3 px-4 text-right">Total HPP</th>
                    <th className="py-3 px-4 text-right">Laba Kotor</th>
                    <th className="py-3 px-4 text-right">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-mono">
                  {bestSellers.map((item, idx) => {
                    const gross = item.revenue - item.cogs;
                    const margin = item.revenue > 0 ? (gross / item.revenue) * 100 : 0;
                    return (
                      <tr key={idx} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-neutral-400">#{idx + 1}</td>
                        <td className="py-3 px-4 font-sans font-semibold text-white">{item.name}</td>
                        <td className="py-3 px-4 text-right font-bold text-amber-400 tabular-nums">
                          {item.quantity} Cup
                        </td>
                        <td className="py-3 px-4 text-right text-neutral-200 tabular-nums">
                          {formatIDR(item.revenue)}
                        </td>
                        <td className="py-3 px-4 text-right text-neutral-400 tabular-nums">
                          {formatIDR(item.cogs)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400 tabular-nums">
                          {formatIDR(gross)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-neutral-300 tabular-nums">
                          {Math.round(margin)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Expenses Ledger */}
        {activeReportTab === 'expenses' && (
          <div className="p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">
                Mencatat semua pengeluaran operasional toko seperti sewa, listrik, es batu, dan belanja bahan.
              </span>
              <button
                onClick={onOpenExpenseModal}
                className="px-3 py-1.5 font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors"
              >
                + Catat Pengeluaran
              </button>
            </div>

            <div className="overflow-x-auto border border-neutral-800 rounded-lg">
              <table className="w-full text-left">
                <thead className="bg-neutral-950/80 text-neutral-400 uppercase tracking-wider font-semibold border-b border-neutral-800">
                  <tr>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Keterangan</th>
                    <th className="py-3 px-4">Metode Bayar</th>
                    <th className="py-3 px-4 text-right">Nominal</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-mono">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="py-2.5 px-4 text-neutral-400">{formatDate(exp.date)}</td>
                      <td className="py-2.5 px-4 font-sans font-semibold text-white">{exp.category}</td>
                      <td className="py-2.5 px-4 font-sans text-neutral-300">{exp.description}</td>
                      <td className="py-2.5 px-4 font-sans text-neutral-400">{exp.paymentMethod}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-red-400 tabular-nums">
                        {formatIDR(exp.amount)}
                      </td>
                      <td className="py-2.5 px-4 text-center font-sans">
                        <button
                          onClick={() => {
                            if (confirm(`Hapus catatan pengeluaran "${exp.description}"?`)) {
                              deleteExpense(exp.id);
                            }
                          }}
                          className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
