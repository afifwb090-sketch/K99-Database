import JSZip from 'jszip';

// Vite raw imports of project source files to package into a downloadable .zip
const srcFiles = import.meta.glob(
  [
    '../**/*.{ts,tsx,css,json,html,cjs}',
    '../../public/**/*',
    '../../package.json',
    '../../tsconfig.json',
    '../../vite.config.ts',
    '../../electron-main.cjs',
    '../../server.ts',
    '../../index.html',
    '../../metadata.json',
  ],
  {
    query: '?raw',
    import: 'default',
    eager: true,
  }
) as Record<string, string>;

export async function downloadProjectZip(onProgress?: (msg: string) => void): Promise<void> {
  if (onProgress) onProgress('Menyiapkan berkas proyek K99 Coffee POS...');

  const zip = new JSZip();

  // Root instructions
  const readmeContent = `# K99 Coffee POS - ERP Kedai Kopi & Aplikasi Desktop

Sistem POS & ERP terintegrasi untuk kedai kopi:
- Point of Sale (POS) Kasir Cepat (Dine In & Take Away)
- Manajemen Bahan Baku & Pengurangan Stok Otomatis berbasis Resep BOM (Bill of Materials)
- Laporan Keuangan, Laba Rugi Otomatis & Visualisasi Tren Penjualan Recharts
- Loyalty Program & Poin Pelanggan
- Shift Kasir & Rekapitulasi Kas Laci
- Mode Desktop Standalone (PWA) & Wrapper Electron (.exe / .dmg)

---

## 🚀 Cara Menjalankan di Komputer Lokal

### 1. Prasyarat
- Pastikan telah terinstall **Node.js (versi 18+)**
- Download di https://nodejs.org

### 2. Instalasi Dependensi
Buka terminal / Command Prompt di folder proyek ini:
\`\`\`bash
npm install --legacy-peer-deps
\`\`\`
*(Atau cukup \`npm install\` karena berkas \`.npmrc\` sudah disediakan di dalam arsip).*

### 3. Menjalankan di Browser (Development Mode)
\`\`\`bash
npm run dev
\`\`\`
Buka browser pada: \`http://localhost:3000\`

### 4. Menjalankan Sebagai Aplikasi Desktop Native (Electron)
\`\`\`bash
# Install electron (jika belum)
npm install -D electron

# Jalankan jendela desktop:
npm run desktop
\`\`\`

### 5. Membangun File Installer (.EXE / .DMG)
\`\`\`bash
npm install -D electron-builder
npx electron-builder
\`\`\`
File installer Windows (.exe) atau macOS (.dmg) akan berada di folder \`dist/\`.

---
Dibuat untuk operasional kedai kopi modern K99 Coffee.
`;

  zip.file('README.md', readmeContent);
  zip.file('.npmrc', 'legacy-peer-deps=true\n');

  // Add source files
  let count = 0;
  for (const [filePath, content] of Object.entries(srcFiles)) {
    // Clean up path
    let cleanPath = filePath
      .replace(/^\.\.\/\.\.\//, '')
      .replace(/^\.\.\//, 'src/');

    if (cleanPath.startsWith('src/src/')) {
      cleanPath = cleanPath.replace('src/src/', 'src/');
    }

    // Skip node_modules or dist if any
    if (cleanPath.includes('node_modules') || cleanPath.includes('.git') || cleanPath.includes('dist/')) {
      continue;
    }

    if (typeof content === 'string') {
      zip.file(cleanPath, content);
      count++;
    }
  }

  if (onProgress) onProgress(`Mengompresi ${count} berkas ke dalam format .ZIP...`);

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `k99_coffee_pos_source_code_${timestamp}.zip`;

  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);

  if (onProgress) onProgress('Unduhan selesai!');
}

export function downloadBackupJson(data: unknown): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const timestamp = new Date().toISOString().split('T')[0];
  link.download = `k99_coffee_pos_database_${timestamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
