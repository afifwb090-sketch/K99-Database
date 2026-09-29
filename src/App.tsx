/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AppProvider } from './context/AppContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { PosView } from './components/PosView';
import { InventoryView } from './components/InventoryView';
import { RecipeBomView } from './components/RecipeBomView';
import { FinancialReportsView } from './components/FinancialReportsView';
import { TransactionsView } from './components/TransactionsView';
import { ShiftView } from './components/ShiftView';
import { SettingsView } from './components/SettingsView';
import { ExpenseModal } from './components/ExpenseModal';
import { CustomerManagementView } from './components/CustomerManagementView';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { DownloadResourcesModal } from './components/DownloadResourcesModal';

function AppContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState<boolean>(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);

  // Keyboard Shortcuts for POS Cashier Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (e.key === 'Escape') {
        setIsExpenseModalOpen(false);
        setIsSheetsModalOpen(false);
        setIsDownloadModalOpen(false);
        return;
      }

      // POS shortcuts with Alt + Number or F-Keys (when not in input)
      if (!isInput) {
        if (e.key === 'F1' || (e.altKey && e.key === '1')) {
          e.preventDefault();
          setActiveTab('pos');
        } else if (e.key === 'F2' || (e.altKey && e.key === '2')) {
          e.preventDefault();
          setActiveTab('inventory');
        } else if (e.key === 'F3' || (e.altKey && e.key === '3')) {
          e.preventDefault();
          setActiveTab('reports');
        } else if (e.key === 'F4' || (e.altKey && e.key === '4')) {
          e.preventDefault();
          setIsExpenseModalOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* 3-Zone Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
      />

      {/* Main Viewport Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'pos' && <PosView />}
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'recipes' && <RecipeBomView />}
        {activeTab === 'customers' && <CustomerManagementView />}
        {activeTab === 'reports' && (
          <FinancialReportsView onOpenExpenseModal={() => setIsExpenseModalOpen(true)} />
        )}
        {activeTab === 'transactions' && <TransactionsView />}
        {activeTab === 'shift' && <ShiftView />}
        {activeTab === 'settings' && (
          <SettingsView
            onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
            onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
          />
        )}
      </main>

      {/* Operational Expense Modal accessible everywhere */}
      {isExpenseModalOpen && (
        <ExpenseModal onClose={() => setIsExpenseModalOpen(false)} />
      )}

      {/* Google Sheets Backend & Cloudflare Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
      />

      {/* Resource & Source Code Download Modal */}
      <DownloadResourcesModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />

      {/* Offline Status Toast */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
