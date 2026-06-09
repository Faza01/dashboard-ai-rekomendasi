// Google Sheets API Data Fetcher with Normalization Layer
import CONFIG from './config.js';
import { MOCK_DATA } from './mockData.js';

// Global flag to track if mock data is being used
window.isMockDataMode = false;

// Check if credentials are placeholders
const hasCredentials = CONFIG.SPREADSHEET_ID && 
                       CONFIG.SPREADSHEET_ID !== 'ID_SPREADSHEET_KAMU' &&
                       CONFIG.API_KEY && 
                       CONFIG.API_KEY !== 'GOOGLE_SHEETS_API_KEY';

// Cache expiration: 30 seconds
const CACHE_DURATION_MS = 30 * 1000;

export const SHEETS_API = {
  // Fetch raw, un-normalized sheet data
  async fetchRawSheetData(sheetName) {
    const rawCacheKey = `raw_sheets_cache_${sheetName}`;
    const cachedData = sessionStorage.getItem(rawCacheKey);
    const cachedTime = sessionStorage.getItem(`${rawCacheKey}_timestamp`);
    const now = Date.now();

    if (cachedData && cachedTime && (now - parseInt(cachedTime, 10) < CACHE_DURATION_MS)) {
      try {
        return JSON.parse(cachedData);
      } catch (e) {
        console.error(`Error parsing raw cached data for ${sheetName}`, e);
      }
    }

    if (!hasCredentials) {
      console.warn(`No credentials. Using mock data for raw sheet: ${sheetName}`);
      window.isMockDataMode = true;
      sessionStorage.setItem('is_mock_mode', 'true');
      const mockResult = MOCK_DATA[sheetName] || [];
      sessionStorage.setItem(rawCacheKey, JSON.stringify(mockResult));
      sessionStorage.setItem(`${rawCacheKey}_timestamp`, now.toString());
      return mockResult;
    }

    try {
      const url = `${CONFIG.BASE_URL}/${sheetName}?key=${CONFIG.API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Sheets API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      const values = data.values || [];
      sessionStorage.setItem(rawCacheKey, JSON.stringify(values));
      sessionStorage.setItem(`${rawCacheKey}_timestamp`, now.toString());
      return values;
    } catch (error) {
      console.error(`Failed to fetch raw sheet "${sheetName}":`, error);
      
      if (CONFIG.ENABLE_MOCK_FALLBACK) {
        console.log(`Serving mock fallback for raw sheet: ${sheetName}`);
        window.isMockDataMode = true;
        sessionStorage.setItem('is_mock_mode', 'true');
        const mockResult = MOCK_DATA[sheetName] || [];
        sessionStorage.setItem(rawCacheKey, JSON.stringify(mockResult));
        sessionStorage.setItem(`${rawCacheKey}_timestamp`, now.toString());
        return mockResult;
      }
      
      throw error;
    }
  },

  // Main normalized entry point
  async getSheetData(sheetName) {
    const cacheKey = `sheets_cache_${sheetName}`;
    const cachedData = sessionStorage.getItem(cacheKey);
    const cachedTime = sessionStorage.getItem(`${cacheKey}_timestamp`);
    const now = Date.now();

    if (cachedData && cachedTime && (now - parseInt(cachedTime, 10) < CACHE_DURATION_MS)) {
      try {
        if (sessionStorage.getItem('is_mock_mode') === 'true') {
          window.isMockDataMode = true;
        }
        return JSON.parse(cachedData);
      } catch (e) {
        console.error(`Error parsing cached data for ${sheetName}`, e);
      }
    }

    let normalizedData = [];

    if (sheetName === 'hasil_rekomendasi') {
      // We need: hasil_rekomendasi, skor_riasec, nilai_siswa, and data_siswa
      const [rawRec, rawRiasec, rawGrades, rawStudents] = await Promise.all([
        this.fetchRawSheetData('hasil_rekomendasi'),
        this.fetchRawSheetData('skor_riasec'),
        this.fetchRawSheetData('nilai_siswa'),
        this.fetchRawSheetData('data_siswa')
      ]);

      // Build lookups
      const classLookup = {};
      const riasecLookup = {};

      // 1. Map class from nilai_siswa (index 0 is nis, index 4 is kelas)
      if (rawGrades && rawGrades.length > 1) {
        rawGrades.slice(1).forEach(row => {
          if (row[0]) classLookup[row[0].trim()] = row[4];
        });
      }

      // 2. Map class from data_siswa (index 2 is nis, index 3 is kelas)
      if (rawStudents && rawStudents.length > 1) {
        rawStudents.slice(1).forEach(row => {
          if (row[2]) {
            const nis = row[2].trim();
            // data_siswa has higher precedence for class in case student is pending (not in nilai_siswa)
            if (row[3]) classLookup[nis] = row[3];
          }
        });
      }

      // 3. Map dominant RIASEC type from skor_riasec (index 0 is nis, index 8 is tipe_dominan)
      if (rawRiasec && rawRiasec.length > 1) {
        rawRiasec.slice(1).forEach(row => {
          if (row[0]) {
            const nis = row[0].trim();
            const letter = row[8] ? row[8].trim() : '';
            // Map letter to full word for dashboard badge
            const labelMap = {
              'R': 'Realistic',
              'I': 'Investigative',
              'A': 'Artistic',
              'S': 'Social',
              'E': 'Enterprising',
              'C': 'Conventional'
            };
            riasecLookup[nis] = labelMap[letter] || letter || '-';
          }
        });
      }

      // Normalization of hasil_rekomendasi
      // Raw columns: [0] timestamp, [1] nis, [2] nama, [3] rekomendasi_jurusan, [4] rekomendasi_karier, [5] penjelasan_ai, [6] status_nilai
      const header = ["timestamp", "nis", "nama", "kelas", "tipe_dominan", "rekomendasi_jurusan", "rekomendasi_karier", "status", "penjelasan_ai", "tips_ai", "pending_reason"];
      normalizedData.push(header);

      if (rawRec && rawRec.length > 1) {
        rawRec.slice(1).forEach(row => {
          const timestamp = row[0] || '';
          const nis = row[1] ? row[1].trim() : '';
          const nama = row[2] || '';
          const rekomendasi_jurusan = row[3] || '';
          const rekomendasi_karier = row[4] || '';
          const rawAiText = row[5] || '';
          const status_nilai = row[6] || '';

          // Determine status & pending_reason
          let status = 'Lengkap';
          let pending_reason = '';
          if (status_nilai.toUpperCase().startsWith('PENDING')) {
            status = 'PENDING';
            pending_reason = status_nilai.includes(':') ? status_nilai.split(':')[1].trim() : status_nilai;
          } else if (status_nilai === 'Tanpa nilai') {
            status = 'Tanpa nilai';
          }

          // Lookup joined fields
          const kelas = classLookup[nis] || '-';
          const tipe_dominan = riasecLookup[nis] || '-';

          // Split explanation and tips
          let penjelasan_ai = rawAiText;
          let tips_ai = 'Tingkatkan kemampuan akademik dan ikuti bimbingan konseling lebih lanjut.';
          
          if (rawAiText.includes('TIPS:')) {
            const parts = rawAiText.split(/TIPS\s*:/i);
            penjelasan_ai = parts[0].replace(/ALASAN\s*:/i, '').trim();
            tips_ai = parts[1].trim();
          } else if (rawAiText.includes('TIPS')) {
            const parts = rawAiText.split(/TIPS/i);
            penjelasan_ai = parts[0].replace(/ALASAN/i, '').trim();
            tips_ai = parts[1].replace(/^\s*:\s*/, '').trim();
          }

          normalizedData.push([
            timestamp,
            nis,
            nama,
            kelas,
            tipe_dominan,
            rekomendasi_jurusan,
            rekomendasi_karier,
            status,
            penjelasan_ai,
            tips_ai,
            pending_reason
          ]);
        });
      }

    } else if (sheetName === 'skor_riasec') {
      const rawRiasec = await this.fetchRawSheetData('skor_riasec');
      // Raw columns: [0] nis, [1] nama, [2] skor_R, [3] skor_I, [4] skor_A, [5] skor_S, [6] skor_E, [7] skor_C, [8] tipe_dominan
      // Target: [nis, R, I, A, S, E, C, tipe_dominan]
      const header = ["nis", "R", "I", "A", "S", "E", "C", "tipe_dominan"];
      normalizedData.push(header);

      if (rawRiasec && rawRiasec.length > 1) {
        rawRiasec.slice(1).forEach(row => {
          normalizedData.push([
            row[0], // nis
            row[2], // R
            row[3], // I
            row[4], // A
            row[5], // S
            row[6], // E
            row[7], // C
            row[8]  // tipe_dominan
          ]);
        });
      }

    } else if (sheetName === 'nilai_siswa') {
      const rawGrades = await this.fetchRawSheetData('nilai_siswa');
      // Raw columns: [0] nis, [1] nama_siswa, [2] jenis_kelamin, [3] jurusan, [4] kelas, [5] nilai_matematika, [6] nilai_bahasa_indonesia, [7] nilai_bahasa_inggris, [8] rata_rata, [9] status_kelulusan, [10] nilai_pemrograman, [11] nilai_jaringan, [12] nilai_tja
      // Target: [nis, Matematika, B_Indonesia, B_Inggris, Pemrograman, Jaringan, TJA, rata_rata]
      const header = ["nis", "Matematika", "B_Indonesia", "B_Inggris", "Pemrograman", "Jaringan", "TJA", "rata_rata"];
      normalizedData.push(header);

      if (rawGrades && rawGrades.length > 1) {
        rawGrades.slice(1).forEach(row => {
          normalizedData.push([
            row[0], // nis
            row[5] || '0', // Matematika
            row[6] || '0', // B_Indonesia
            row[7] || '0', // B_Inggris
            row[10] || '',  // Pemrograman
            row[11] || '',  // Jaringan
            row[12] || '',  // TJA
            row[8] || '0'   // rata_rata
          ]);
        });
      }

    } else if (sheetName === 'prestasi_siswa') {
      const rawAchievements = await this.fetchRawSheetData('prestasi_siswa');
      // Raw columns: [0] nis, [1] nama_siswa, [2] nama_lomba_akademik, [3] tingkat_akademik, [4] prestasi_akademik, [5] nama_kegiatan, [6] kategori, [7] tingkat_non_akademik, [8] prestasi_non_akademik, [9] catatan_bk
      // Target: [nis, kegiatan, kategori, tingkat, prestasi]
      const header = ["nis", "kegiatan", "kategori", "tingkat", "prestasi"];
      normalizedData.push(header);

      if (rawAchievements && rawAchievements.length > 1) {
        rawAchievements.slice(1).forEach(row => {
          const nis = row[0];
          // Check academic achievement
          if (row[2]) {
            normalizedData.push([
              nis,
              row[2], // kegiatan (lomba)
              "Akademik", // kategori
              row[3] || 'Sekolah', // tingkat
              row[4] || 'Peserta'  // prestasi
            ]);
          }
          // Check non-academic achievement
          if (row[5]) {
            normalizedData.push([
              nis,
              row[5], // kegiatan
              row[6] || 'Non-Akademik', // kategori
              row[7] || 'Sekolah', // tingkat
              row[8] || 'Peserta'  // prestasi
            ]);
          }
        });
      }
    } else {
      // Fallback for generic sheets
      normalizedData = await this.fetchRawSheetData(sheetName);
    }

    sessionStorage.setItem(cacheKey, JSON.stringify(normalizedData));
    sessionStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
    return normalizedData;
  },

  // Clear cache
  clearCache() {
    // Clear all sheets-related cache keys and timestamps
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('sheets_cache') || key.includes('raw_sheets_cache') || key === 'is_mock_mode') {
        sessionStorage.removeItem(key);
      }
    });
    window.isMockDataMode = false;
  },

  // Fetch all sheets in parallel to warm up the cache
  async warmUpCache() {
    try {
      await Promise.all([
        this.getSheetData('hasil_rekomendasi'),
        this.getSheetData('skor_riasec'),
        this.getSheetData('nilai_siswa'),
        this.getSheetData('prestasi_siswa')
      ]);
      return true;
    } catch (e) {
      console.error("Error warming up sheets cache:", e);
      return false;
    }
  }
};

export default SHEETS_API;
