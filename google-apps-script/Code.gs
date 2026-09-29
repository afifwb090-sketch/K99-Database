/**
 * =========================================================================
 * K99 COFFEE POS & ERP - GOOGLE APPS SCRIPT BACKEND API
 * =========================================================================
 * Script ini berfungsi sebagai REST API / Webhook Backend untuk K99 Coffee POS
 * yang di-deploy di Cloudflare Pages.
 * 
 * PANDUAN PEMASANGAN (Hanya 3 Menit):
 * 1. Buat Google Sheet baru di Google Drive Anda (beri nama "K99 Coffee Database").
 * 2. Klik menu "Ekstensi" (Extensions) -> "Apps Script".
 * 3. Hapus semua kode yang ada di editor, lalu PASTE SELURUH KODE DI FILE INI.
 * 4. Klik "Simpan" (Ctrl+S / Ikon Disket).
 * 5. Klik tombol biru "Terapkan" (Deploy) di pojok kanan atas -> "Penerapan Baru" (New Deployment).
 * 6. Pilih jenis: "Aplikasi Web" (Web App).
 *    - Deskripsi: "K99 Coffee Backend API"
 *    - Jalankan sebagai (Execute as): "Saya" (Me)
 *    - Siapa yang memiliki akses (Who has access): "Siapa saja" (Anyone) -> PENTING!
 * 7. Klik "Terapkan" (Deploy). Berikan izin akses Google Sheet jika diminta.
 * 8. Salin "URL Aplikasi Web" (contoh: https://script.google.com/macros/s/.../exec).
 * 9. Tempelkan URL tersebut ke Pengaturan Google Sheets di aplikasi K99 Coffee POS.
 * =========================================================================
 */

// Inisialisasi Nama-Nama Sheet Database
const SHEET_TRANSAKSI = 'Transaksi';
const SHEET_BAHAN_BAKU = 'Bahan_Baku';
const SHEET_BEBAN = 'Beban_Operasional';
const SHEET_LOG_BAHAN = 'Log_Bahan_Keluar';
const SHEET_SHIFT = 'Rekap_Shift';
const SHEET_PELANGGAN = 'Pelanggan';
const SHEET_MENU = 'Menu_Produk';

/**
 * Handle GET Request (Ping test & Fetch data)
 */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'ping';
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Test Ping
  if (action === 'ping') {
    return createJsonResponse({
      status: 'success',
      message: 'K99 Coffee Apps Script Backend Siap & Terhubung!',
      spreadsheetName: ss.getName(),
      timestamp: new Date().toISOString()
    });
  }

  // Get All Data
  if (action === 'get_all_data') {
    initAllSheets(ss);
    const data = {
      transactions: getSheetDataAsJson(ss.getSheetByName(SHEET_TRANSAKSI)),
      rawMaterials: getSheetDataAsJson(ss.getSheetByName(SHEET_BAHAN_BAKU)),
      expenses: getSheetDataAsJson(ss.getSheetByName(SHEET_BEBAN)),
      customers: getSheetDataAsJson(ss.getSheetByName(SHEET_PELANGGAN)),
      menuItems: getSheetDataAsJson(ss.getSheetByName(SHEET_MENU))
    };
    return createJsonResponse({ status: 'success', data: data });
  }

  // Get Inventory Only
  if (action === 'get_inventory') {
    const sheet = ss.getSheetByName(SHEET_BAHAN_BAKU);
    return createJsonResponse({
      status: 'success',
      data: sheet ? getSheetDataAsJson(sheet) : []
    });
  }

  return createJsonResponse({ status: 'error', message: 'Action tidak dikenal' });
}

/**
 * Handle POST Request (Menerima transaksi kasir, beban, shift, dsb)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  // Kunci eksekusi selama maksimal 15 detik agar row tidak tumpang tindih
  lock.tryLock(15000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    initAllSheets(ss);

    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }

    const action = payload.action || 'create_transaction';

    // 1. Simpan Transaksi Kasir Baru
    if (action === 'create_transaction' && payload.data) {
      const tx = payload.data;
      const sheetTx = ss.getSheetByName(SHEET_TRANSAKSI);

      // Ringkasan item belanja
      const itemsSummary = (tx.items || []).map(function(i) {
        let opt = '';
        if (i.temperature) opt += '[' + i.temperature + '] ';
        if (i.size) opt += '[' + i.size + '] ';
        return i.quantity + 'x ' + i.name + ' ' + opt;
      }).join('; ');

      sheetTx.appendRow([
        tx.timestamp || new Date().toISOString(),
        tx.id,
        tx.channel || 'OFFLINE',
        tx.onlinePlatform || '-',
        tx.orderType || 'Dine In',
        tx.customerName || 'Walk-in Customer',
        tx.customerPhone || '-',
        tx.paymentMethod || 'QRIS',
        tx.subtotal || 0,
        tx.discountAmount || 0,
        tx.taxAmount || 0,
        tx.totalAmount || 0,
        tx.totalCOGS || 0,
        tx.grossProfit || 0,
        tx.cashierName || 'Kasir K99',
        itemsSummary,
        JSON.stringify(tx.items || [])
      ]);

      // Catat pemotongan bahan baku ke log
      if (tx.deductedMaterials && tx.deductedMaterials.length > 0) {
        const sheetLog = ss.getSheetByName(SHEET_LOG_BAHAN);
        tx.deductedMaterials.forEach(function(mat) {
          sheetLog.appendRow([
            tx.timestamp || new Date().toISOString(),
            tx.id,
            mat.rawMaterialId,
            mat.rawMaterialName,
            mat.quantity,
            mat.unit
          ]);

          // Update stok di Sheet Bahan_Baku
          kurangiStokBahan(ss, mat.rawMaterialId, mat.quantity);
        });
      }

      // Catat/Update Poin Pelanggan jika ada
      if (tx.customerId || tx.customerPhone) {
        catatPoinPelanggan(ss, tx);
      }

      return createJsonResponse({
        status: 'success',
        message: 'Transaksi ' + tx.id + ' berhasil dicatat di Google Sheets',
        orderId: tx.id
      });
    }

    // 2. Simpan Beban Operasional Baru
    if (action === 'create_expense' && payload.data) {
      const exp = payload.data;
      const sheetBeban = ss.getSheetByName(SHEET_BEBAN);

      sheetBeban.appendRow([
        exp.timestamp || new Date().toISOString(),
        exp.id,
        exp.date,
        exp.category,
        exp.description,
        exp.amount,
        exp.paymentMethod,
        exp.receiptNumber || '-'
      ]);

      return createJsonResponse({
        status: 'success',
        message: 'Beban operasional berhasil dicatat'
      });
    }

    // 3. Simpan Rekap Shift Kasir
    if (action === 'record_shift' && payload.data) {
      const shift = payload.data;
      const sheetShift = ss.getSheetByName(SHEET_SHIFT);

      sheetShift.appendRow([
        shift.id,
        shift.date,
        shift.cashierName,
        shift.startTime,
        shift.endTime || '-',
        shift.initialCash,
        shift.cashSales,
        shift.nonCashSales,
        shift.actualCashEnding || 0,
        shift.cashDifference || 0,
        shift.status,
        shift.notes || '-'
      ]);

      return createJsonResponse({
        status: 'success',
        message: 'Rekap shift berhasil disimpan'
      });
    }

    // 4. Sinkronisasi Keseluruhan Master Data (Bulk Sync)
    if (action === 'sync_all' && payload.data) {
      const allData = payload.data;

      // Update Bahan Baku Master
      if (allData.rawMaterials && allData.rawMaterials.length > 0) {
        const sheetBahan = ss.getSheetByName(SHEET_BAHAN_BAKU);
        sheetBahan.clearContents();
        sheetBahan.appendRow([
          'ID Bahan', 'Nama Bahan', 'SKU', 'Kategori', 'Stok Terkini', 'Satuan', 'Stok Minimum', 'Harga Beli/Satuan', 'Supplier', 'Terakhir Diperbarui'
        ]);
        formatHeaderRow(sheetBahan, '#1e3a5f');

        const rows = allData.rawMaterials.map(function(m) {
          return [m.id, m.name, m.sku, m.category, m.currentStock, m.unit, m.minStockThreshold, m.costPerUnit, m.supplier, new Date().toISOString()];
        });
        if (rows.length > 0) {
          sheetBahan.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
        }
      }

      // Update Menu Master
      if (allData.menuItems && allData.menuItems.length > 0) {
        const sheetMenu = ss.getSheetByName(SHEET_MENU);
        sheetMenu.clearContents();
        sheetMenu.appendRow([
          'ID Menu', 'Nama Menu', 'Kategori', 'Harga Jual', 'Deskripsi', 'Status Tersedia'
        ]);
        formatHeaderRow(sheetMenu, '#854d0e');

        const menuRows = allData.menuItems.map(function(item) {
          return [item.id, item.name, item.category, item.price, item.description, item.isAvailable ? 'Aktif' : 'Non-Aktif'];
        });
        if (menuRows.length > 0) {
          sheetMenu.getRange(2, 1, menuRows.length, menuRows[0].length).setValues(menuRows);
        }
      }

      return createJsonResponse({
        status: 'success',
        message: 'Seluruh master data berhasil disinkronkan ke Google Sheets'
      });
    }

    return createJsonResponse({ status: 'error', message: 'Aksi POST tidak valid' });

  } catch (error) {
    return createJsonResponse({
      status: 'error',
      message: error.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Helper: Kurangi stok bahan baku pada sheet Bahan_Baku
 */
function kurangiStokBahan(ss, rawMaterialId, qtyDeducted) {
  const sheet = ss.getSheetByName(SHEET_BAHAN_BAKU);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  // Kolom A = ID (indeks 0), Kolom E = Stok (indeks 4)
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === rawMaterialId) {
      const currentVal = Number(data[i][4]) || 0;
      const newVal = Math.max(0, currentVal - Number(qtyDeducted));
      sheet.getRange(i + 1, 5).setValue(newVal);
      break;
    }
  }
}

/**
 * Helper: Catat & Akumulasi Poin Pelanggan
 */
function catatPoinPelanggan(ss, tx) {
  const sheet = ss.getSheetByName(SHEET_PELANGGAN);
  if (!sheet) return;

  const phone = tx.customerPhone || '';
  const name = tx.customerName || 'Walk-in';
  if (!phone && (!tx.customerId || tx.customerId === 'guest')) return;

  const data = sheet.getDataRange().getValues();
  let found = false;

  for (let i = 1; i < data.length; i++) {
    // Cocokkan berdasarkan No HP atau ID
    if ((phone && data[i][2] === phone) || (tx.customerId && data[i][0] === tx.customerId)) {
      const oldSpent = Number(data[i][4]) || 0;
      const oldOrders = Number(data[i][5]) || 0;
      const newSpent = oldSpent + Number(tx.totalAmount || 0);
      const newOrders = oldOrders + 1;
      
      sheet.getRange(i + 1, 5).setValue(newSpent);
      sheet.getRange(i + 1, 6).setValue(newOrders);
      sheet.getRange(i + 1, 7).setValue(new Date().toISOString());
      found = true;
      break;
    }
  }

  // Jika pelanggan baru
  if (!found && phone) {
    sheet.appendRow([
      tx.customerId || 'CUST-' + new Date().getTime(),
      name,
      phone,
      0, // poin awal
      tx.totalAmount || 0,
      1,
      new Date().toISOString()
    ]);
  }
}

/**
 * Otomatis Membuat Tab Sheet & Format Header jika belum ada
 */
function initAllSheets(ss) {
  // 1. Transaksi
  let sTx = ss.getSheetByName(SHEET_TRANSAKSI);
  if (!sTx) {
    sTx = ss.insertSheet(SHEET_TRANSAKSI);
    sTx.appendRow([
      'Waktu Transaksi', 'ID Transaksi', 'Saluran', 'Platform Online', 'Tipe Order',
      'Nama Pelanggan', 'No HP', 'Metode Bayar', 'Subtotal (Rp)', 'Diskon (Rp)',
      'Pajak (Rp)', 'Total Tagihan (Rp)', 'Total HPP (Rp)', 'Laba Kotor (Rp)', 'Kasir',
      'Rincian Menu', 'Raw Item JSON'
    ]);
    formatHeaderRow(sTx, '#166534'); // Hijau POS
  }

  // 2. Bahan Baku
  let sBahan = ss.getSheetByName(SHEET_BAHAN_BAKU);
  if (!sBahan) {
    sBahan = ss.insertSheet(SHEET_BAHAN_BAKU);
    sBahan.appendRow([
      'ID Bahan', 'Nama Bahan', 'SKU', 'Kategori', 'Stok Terkini', 'Satuan', 'Stok Minimum', 'Harga Beli/Satuan', 'Supplier', 'Terakhir Diperbarui'
    ]);
    formatHeaderRow(sBahan, '#1e3a5f'); // Biru Navy
  }

  // 3. Beban Operasional
  let sBeban = ss.getSheetByName(SHEET_BEBAN);
  if (!sBeban) {
    sBeban = ss.insertSheet(SHEET_BEBAN);
    sBeban.appendRow([
      'Waktu Catat', 'ID Beban', 'Tanggal', 'Kategori Beban', 'Keterangan', 'Nominal (Rp)', 'Metode Bayar', 'No Bukti/Nota'
    ]);
    formatHeaderRow(sBeban, '#991b1b'); // Merah Marun
  }

  // 4. Log Bahan Keluar
  let sLog = ss.getSheetByName(SHEET_LOG_BAHAN);
  if (!sLog) {
    sLog = ss.insertSheet(SHEET_LOG_BAHAN);
    sLog.appendRow([
      'Waktu Pemakaian', 'ID Transaksi', 'ID Bahan', 'Nama Bahan', 'Qty Terpakai', 'Satuan'
    ]);
    formatHeaderRow(sLog, '#475569'); // Slate
  }

  // 5. Rekap Shift
  let sShift = ss.getSheetByName(SHEET_SHIFT);
  if (!sShift) {
    sShift = ss.insertSheet(SHEET_SHIFT);
    sShift.appendRow([
      'ID Shift', 'Tanggal', 'Nama Kasir', 'Waktu Mulai', 'Waktu Tutup', 'Modal Awal (Rp)', 'Penjualan Tunai (Rp)', 'Penjualan Non-Tunai (Rp)', 'Kas Aktual Akhir (Rp)', 'Selisih Kas (Rp)', 'Status', 'Catatan'
    ]);
    formatHeaderRow(sShift, '#581c87'); // Ungu
  }

  // 6. Pelanggan & Loyalty
  let sPel = ss.getSheetByName(SHEET_PELANGGAN);
  if (!sPel) {
    sPel = ss.insertSheet(SHEET_PELANGGAN);
    sPel.appendRow([
      'ID Pelanggan', 'Nama', 'No HP', 'Poin Loyalty', 'Total Belanja (Rp)', 'Jumlah Order', 'Kunjungan Terakhir'
    ]);
    formatHeaderRow(sPel, '#0f766e'); // Teal
  }

  // 7. Menu Produk
  let sMenu = ss.getSheetByName(SHEET_MENU);
  if (!sMenu) {
    sMenu = ss.insertSheet(SHEET_MENU);
    sMenu.appendRow([
      'ID Menu', 'Nama Menu', 'Kategori', 'Harga Jual (Rp)', 'Deskripsi', 'Status'
    ]);
    formatHeaderRow(sMenu, '#854d0e'); // Cokelat Kopi
  }
}

/**
 * Styling Header Spreadsheet
 */
function formatHeaderRow(sheet, hexColor) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return;
  const range = sheet.getRange(1, 1, 1, lastCol);
  range.setBackground(hexColor);
  range.setFontColor('#ffffff');
  range.setFontWeight('bold');
  range.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
}

/**
 * Helper: Ambil data Sheet dalam bentuk Array of Objects
 */
function getSheetDataAsJson(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    rows.push(obj);
  }
  return rows;
}

/**
 * Helper: Output JSON dengan MIME Type yang tepat
 */
function createJsonResponse(output) {
  return ContentService
    .createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}
