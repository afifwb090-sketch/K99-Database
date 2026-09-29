import { Transaction, Expense, RawMaterial, MenuItem, Shift } from '../types';

export interface GoogleSheetsConfig {
  webAppUrl: string;
  autoSyncOnCheckout: boolean;
  autoSyncOnExpense: boolean;
  lastSyncTime: string | null;
  lastStatus: 'idle' | 'connected' | 'error' | 'syncing';
  lastErrorMessage: string | null;
}

const STORAGE_KEY_CONFIG = 'k99_sheets_config_v1';
const STORAGE_KEY_QUEUE = 'k99_sheets_queue_v1';

export interface QueuedSyncItem {
  id: string;
  action: 'create_transaction' | 'create_expense' | 'record_shift';
  data: unknown;
  queuedAt: string;
  retries: number;
}

export class GoogleSheetsService {
  private static instance: GoogleSheetsService;

  private constructor() {
    // Automatically attempt to drain queue when window comes back online
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.processQueue();
      });
    }
  }

  public static getInstance(): GoogleSheetsService {
    if (!GoogleSheetsService.instance) {
      GoogleSheetsService.instance = new GoogleSheetsService();
    }
    return GoogleSheetsService.instance;
  }

  public getConfig(): GoogleSheetsConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load Google Sheets config:', e);
    }

    return {
      webAppUrl: '',
      autoSyncOnCheckout: true,
      autoSyncOnExpense: true,
      lastSyncTime: null,
      lastStatus: 'idle',
      lastErrorMessage: null,
    };
  }

  public saveConfig(updates: Partial<GoogleSheetsConfig>): GoogleSheetsConfig {
    const current = this.getConfig();
    const merged = { ...current, ...updates };
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(merged));
    } catch (e) {
      console.error('Failed to save Google Sheets config:', e);
    }
    return merged;
  }

  /**
   * Menguji koneksi ke Google Apps Script Web App
   */
  public async testConnection(url: string): Promise<{ success: boolean; message: string }> {
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      return { success: false, message: 'URL Google Apps Script tidak boleh kosong.' };
    }

    if (!cleanUrl.startsWith('https://script.google.com/macros/s/')) {
      return {
        success: false,
        message: 'URL harus berawalan "https://script.google.com/macros/s/..." dan berakhiran "/exec".',
      };
    }

    try {
      // Test via POST with action ping (text/plain avoids CORS preflight)
      const res = await fetch(cleanUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action: 'ping' }),
        redirect: 'follow',
      });

      if (!res.ok) {
        return {
          success: false,
          message: `Server merespon dengan status ${res.status}: ${res.statusText}`,
        };
      }

      const text = await res.text();
      let json: { status?: string; message?: string } = {};
      try {
        json = JSON.parse(text);
      } catch {
        // Fallback: If returned HTML or text, Google Apps Script executed
        return {
          success: true,
          message: 'Terhubung ke Google Apps Script (Response OK).',
        };
      }

      if (json.status === 'success' || json.message) {
        this.saveConfig({
          webAppUrl: cleanUrl,
          lastStatus: 'connected',
          lastErrorMessage: null,
          lastSyncTime: new Date().toISOString(),
        });
        return {
          success: true,
          message: json.message || 'Berhasil terhubung ke Google Sheets!',
        };
      }

      return {
        success: false,
        message: json.message || 'Koneksi gagal mendapatkan balasan sukses.',
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.saveConfig({
        lastStatus: 'error',
        lastErrorMessage: errMsg,
      });
      return {
        success: false,
        message: `Gagal terhubung: ${errMsg}. Pastikan "Who has access" diatur ke "Anyone" saat deploy.`,
      };
    }
  }

  /**
   * Mengirim transaksi baru ke Google Sheets
   */
  public async syncTransaction(tx: Transaction): Promise<boolean> {
    const config = this.getConfig();
    if (!config.webAppUrl || !config.autoSyncOnCheckout) {
      return false;
    }

    if (!navigator.onLine) {
      this.enqueueItem('create_transaction', tx);
      return false;
    }

    try {
      const res = await fetch(config.webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'create_transaction',
          data: tx,
        }),
        redirect: 'follow',
      });

      if (res.ok) {
        this.saveConfig({
          lastStatus: 'connected',
          lastSyncTime: new Date().toISOString(),
          lastErrorMessage: null,
        });
        return true;
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err: unknown) {
      console.warn('Gagal sync transaksi ke Google Sheets, dimasukkan ke antrean offline:', err);
      this.enqueueItem('create_transaction', tx);
      return false;
    }
  }

  /**
   * Mengirim beban operasional baru ke Google Sheets
   */
  public async syncExpense(expense: Expense): Promise<boolean> {
    const config = this.getConfig();
    if (!config.webAppUrl || !config.autoSyncOnExpense) {
      return false;
    }

    if (!navigator.onLine) {
      this.enqueueItem('create_expense', expense);
      return false;
    }

    try {
      const res = await fetch(config.webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'create_expense',
          data: expense,
        }),
        redirect: 'follow',
      });

      if (res.ok) {
        this.saveConfig({
          lastStatus: 'connected',
          lastSyncTime: new Date().toISOString(),
          lastErrorMessage: null,
        });
        return true;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.warn('Gagal sync beban ke Google Sheets, dimasukkan ke antrean:', err);
      this.enqueueItem('create_expense', expense);
      return false;
    }
  }

  /**
   * Mengirim rekap shift kasir ke Google Sheets
   */
  public async syncShift(shift: Shift): Promise<boolean> {
    const config = this.getConfig();
    if (!config.webAppUrl) return false;

    if (!navigator.onLine) {
      this.enqueueItem('record_shift', shift);
      return false;
    }

    try {
      const res = await fetch(config.webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'record_shift',
          data: shift,
        }),
        redirect: 'follow',
      });

      return res.ok;
    } catch (err) {
      console.warn('Gagal sync shift ke Google Sheets:', err);
      this.enqueueItem('record_shift', shift);
      return false;
    }
  }

  /**
   * Sinkronisasi Massal (Bulk Sync) Bahan Baku & Menu ke Google Sheets
   */
  public async syncAllMasterData(data: {
    rawMaterials: RawMaterial[];
    menuItems: MenuItem[];
  }): Promise<{ success: boolean; message: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) {
      return { success: false, message: 'URL Google Apps Script belum diisi.' };
    }

    try {
      this.saveConfig({ lastStatus: 'syncing' });

      const res = await fetch(config.webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'sync_all',
          data,
        }),
        redirect: 'follow',
      });

      if (!res.ok) {
        throw new Error(`Status ${res.status}`);
      }

      this.saveConfig({
        lastStatus: 'connected',
        lastSyncTime: new Date().toISOString(),
        lastErrorMessage: null,
      });

      return {
        success: true,
        message: 'Seluruh master data berhasil disinkronkan ke Google Sheets!',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.saveConfig({
        lastStatus: 'error',
        lastErrorMessage: msg,
      });
      return {
        success: false,
        message: `Gagal sinkronisasi massal: ${msg}`,
      };
    }
  }

  // --- ANTRIAN OFFLINE (OFFLINE SYNC QUEUE) ---

  public getQueue(): QueuedSyncItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_QUEUE);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveQueue(items: QueuedSyncItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save sync queue:', e);
    }
  }

  private enqueueItem(action: QueuedSyncItem['action'], data: unknown): void {
    const queue = this.getQueue();
    queue.push({
      id: 'Q-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      action,
      data,
      queuedAt: new Date().toISOString(),
      retries: 0,
    });
    this.saveQueue(queue);
  }

  public async processQueue(): Promise<number> {
    const config = this.getConfig();
    if (!config.webAppUrl || !navigator.onLine) return 0;

    const queue = this.getQueue();
    if (queue.length === 0) return 0;

    const remaining: QueuedSyncItem[] = [];
    let syncedCount = 0;

    for (const item of queue) {
      try {
        const res = await fetch(config.webAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: item.action,
            data: item.data,
          }),
          redirect: 'follow',
        });

        if (res.ok) {
          syncedCount++;
        } else {
          item.retries++;
          if (item.retries < 5) remaining.push(item);
        }
      } catch {
        item.retries++;
        if (item.retries < 5) remaining.push(item);
      }
    }

    this.saveQueue(remaining);

    if (syncedCount > 0) {
      this.saveConfig({
        lastSyncTime: new Date().toISOString(),
        lastStatus: 'connected',
      });
    }

    return syncedCount;
  }
}

export const googleSheetsService = GoogleSheetsService.getInstance();
