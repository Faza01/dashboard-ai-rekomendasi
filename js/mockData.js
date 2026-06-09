// Mock Data Engine matching the actual Spreadsheet structures

const names = [
  "Budi Santoso", "Siti Aminah", "Rian Hidayat", "Dewi Lestari", "Aditya Pratama",
  "Riska Amelia", "Fajar Nugraha", "Putri Utami", "Dimas Saputra", "Anisa Fitriani",
  "Yusuf Wijaya", "Indah Permatasari", "Eko Prasetyo", "Mega Wahyuni", "Hendra Setiawan",
  "Novianti", "Angga Kusuma", "Larasati", "Diki Ramadhan", "Dian Sastro",
  "Andi Wijaya", "Bella Citra", "Candra Wijaya", "Denny Siregar", "Elisa Putri",
  "Farhan Maulana", "Gita Gutawa", "Hafizh Rasyid", "Irfan Bachdim", "Joko Widodo",
  "Kartika Sari", "Lukman Hakim", "Maudy Ayunda", "Naufal Hadi", "Olivia Zalianty",
  "Panji Petualang", "Qori Sandioriva", "Raffi Ahmad", "Sandra Dewi", "Taufik Hidayat",
  "Ussy Sulistiawaty", "Vicky Prasetyo", "Wulan Guritno", "Xena Warrior", "Yuni Shara",
  "Zaskia Adya Mecca", "Achmad Dhani", "Bunga Citra Lestari", "Chelsea Islan", "Desta Mahendra"
];

const classes = [
  "XII RPL 1", "XII RPL 2", "XII TKJ 1", "XII TKJ 2", "XII TJA 1", "XII TJA 2", "XII MM 1", "XII MM 2"
];

const riasecShort = ["R", "I", "A", "S", "E", "C"];
const riasecFull = {
  "R": "Realistic",
  "I": "Investigative",
  "A": "Artistic",
  "S": "Social",
  "E": "Enterprising",
  "C": "Conventional"
};

const majorRecommendations = {
  "R": ["Teknik Komputer & Jaringan", "Teknik Jaringan Akses", "Sistem Informasi"],
  "I": ["Rekayasa Perangkat Lunak", "Data Science", "Cyber Security"],
  "A": ["Desain Komunikasi Visual", "Multimedia", "Animasi / Game Design"],
  "S": ["Pendidikan Teknologi Informasi", "Sistem Informasi / Konsultasi IT", "Manajemen Layanan IT"],
  "E": ["Digital Marketing", "Technopreneurship", "Manajemen Bisnis Telekomunikasi"],
  "C": ["Sistem Informasi Akuntansi", "Administrasi Server / Database", "Project Management IT"]
};

const careerRecommendations = {
  "R": ["Network Technician", "Network Engineer", "Hardware Specialist"],
  "I": ["Software Developer", "Data Analyst", "Cyber Security Analyst"],
  "A": ["UI/UX Designer", "Creative Director", "3D Animator"],
  "S": ["IT Support Trainer", "IT Consultant", "Scrum Master"],
  "E": ["Product Manager", "Startup Founder", "Digital Marketer"],
  "C": ["Database Administrator", "IT Project Administrator", "System Analyst"]
};

const aiExplanationTemplates = {
  "R": "Siswa menunjukkan ketertarikan yang tinggi pada hal praktis dan teknis. Kemampuan memecahkan masalah langsung pada infrastruktur jaringan sangat baik. Sangat cocok dalam bidang instalasi, konfigurasi jaringan, serta pemeliharaan perangkat keras.",
  "I": "Siswa memiliki rasa ingin tahu yang tinggi, berpikir logis, analitis, dan suka memecahkan algoritme rumit. Rekomendasi di bidang pengembangan perangkat lunak (software development) didasarkan pada ketertarikan mereka pada pemecahan masalah koding secara mendalam.",
  "A": "Siswa memiliki jiwa kreativitas dan estetika yang menonjol. Sangat menikmati proses perancangan visual, baik itu desain antarmuka pengguna (UI/UX) maupun pembuatan media interaktif. Desain yang dihasilkan memiliki nilai keindahan dan fungsi yang tinggi.",
  "S": "Siswa memiliki kemampuan komunikasi interpersonal yang sangat baik dan senang membantu sesama. Mereka sangat cocok dalam peran yang menghubungkan antara kebutuhan teknis dan pengguna, seperti edukasi teknologi atau konsultasi.",
  "E": "Siswa berjiwa pemimpin, persuasif, dan pandai menangkap peluang. Sangat tertarik pada dunia bisnis teknologi dan manajemen produk. Mereka memiliki dorongan kuat untuk memimpin tim proyek atau membangun startup digital.",
  "C": "Siswa sangat teliti, terorganisir, dan menyukai keteraturan data. Kemampuan administrasi dan pemrosesan data sangat menonjol. Sangat cocok untuk mengelola database, memastikan kualitas perangkat lunak (QA), atau mengelola jalannya proyek TI secara administratif."
};

const aiTipsTemplates = {
  "R": "Fokus mengambil sertifikasi industri seperti CCNA (Cisco Certified Network Associate) atau MTCNA (MikroTik). Perbanyak praktik lab jaringan.",
  "I": "Pelajari framework modern (React, Node.js, Laravel) dan ikut kompetisi coding seperti LKS SMK bidang Web Technologies atau hackathon.",
  "A": "Bangun portofolio desain di platform seperti Dribbble atau Behance. Pelajari tools UI/UX terbaru seperti Figma secara mendalam.",
  "S": "Asah kemampuan komunikasi publik, ikut organisasi intra-sekolah, dan pelajari metodologi agile/scrum untuk kolaborasi tim.",
  "E": "Pelajari dasar-dasar digital marketing, product management, dan coba buat proyek bisnis kecil atau startup bersama teman sekolah.",
  "C": "Pelajari SQL database (MySQL, PostgreSQL) secara mendalam, kuasai software manajemen proyek seperti Trello atau Jira, dan pelajari metode QA testing."
};

function generateMockData() {
  const data_siswa = [
    ["timestamp", "nama", "nis", "kelas", "jurusan_smk", "rencana_lulus", "bidang_minat", "R1", "R2", "R3", "I1", "I2", "I3", "A1", "A2", "A3", "S1", "S2", "S3", "E1", "E2", "E3", "C1", "C2", "C3"]
  ];
  
  const skor_riasec = [
    ["nis", "nama", "skor_R", "skor_I", "skor_A", "skor_S", "skor_E", "skor_C", "tipe_dominan"]
  ];
  
  const nilai_siswa = [
    ["nis", "nama_siswa", "jenis_kelamin", "jurusan", "kelas", "nilai_matematika", "nilai_bahasa_indonesia", "nilai_bahasa_inggris", "rata_rata", "status_kelulusan", "nilai_pemrograman", "nilai_jaringan", "nilai_tja"]
  ];
  
  const prestasi_siswa = [
    ["nis", "nama_siswa", "nama_lomba_akademik", "tingkat_akademik", "prestasi_akademik", "nama_kegiatan", "kategori", "tingkat_non_akademik", "prestasi_non_akademik", "catatan_bk"]
  ];
  
  const hasil_rekomendasi = [
    ["timestamp", "nis", "nama", "rekomendasi_jurusan", "rekomendasi_karier", "penjelasan_ai", "status_nilai"]
  ];

  // Helper date generator
  const randomDate = (start, end) => {
    const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  };

  const totalStudents = 100;
  for (let i = 1; i <= totalStudents; i++) {
    const nisNum = 10000 + i;
    const nis = String(nisNum);
    const nama = names[i % names.length] + " " + String.fromCharCode(65 + (i % 26)) + ".";
    const kelas = classes[Math.floor(Math.random() * classes.length)];
    const gender = Math.random() > 0.5 ? "L" : "P";
    const majorCode = kelas.split(' ')[1]; // RPL, TKJ, TJA, MM
    
    // RIASEC Dominant Tipe
    const domType = riasecShort[Math.floor(Math.random() * riasecShort.length)];
    
    // Status distribution
    const rand = Math.random();
    let status = "Lengkap";
    if (i === 5) {
      status = "PENDING: NIS tidak ditemukan di data nilai"; // Pending Case 1
    } else if (i === 9) {
      status = "PENDING: Data nilai belum ada"; // Pending Case 2
    } else if (rand < 0.15) {
      status = "Tanpa nilai";
    }

    const timestamp = randomDate(new Date(2026, 4, 1), new Date(2026, 5, 2));

    // 1. data_siswa
    const rowDataSiswa = [
      timestamp, nama, nis, kelas, majorCode,
      ["Kuliah", "Kerja", "Wirausaha"][Math.floor(Math.random() * 3)],
      "IT, Desain",
      // R1-C3 values (1-5)
      ...Array.from({ length: 18 }, (_, k) => {
        const typeIndex = Math.floor(k / 3);
        const typeLetter = riasecShort[typeIndex];
        return typeLetter === domType ? (4 + Math.floor(Math.random() * 2)) : (1 + Math.floor(Math.random() * 4));
      })
    ];
    data_siswa.push(rowDataSiswa.map(String));

    // 2. skor_riasec
    const scores = { R: 6, I: 6, A: 6, S: 6, E: 6, C: 6 };
    scores[domType] = 12 + Math.floor(Math.random() * 4);
    Object.keys(scores).forEach(k => {
      if (k !== domType) {
        scores[k] = 3 + Math.floor(Math.random() * 8);
      }
    });

    skor_riasec.push([
      nis, nama,
      String(scores.R), String(scores.I), String(scores.A),
      String(scores.S), String(scores.E), String(scores.C),
      domType
    ]);

    // 3. nilai_siswa
    if (!status.startsWith("PENDING")) {
      const mat = 70 + Math.floor(Math.random() * 26);
      const ind = 75 + Math.floor(Math.random() * 21);
      const ing = 65 + Math.floor(Math.random() * 31);
      
      let pem = "", jar = "", tja = "";
      if (majorCode === "RPL") pem = String(75 + Math.floor(Math.random() * 21));
      if (majorCode === "TKJ") {
        pem = String(70 + Math.floor(Math.random() * 20));
        jar = String(75 + Math.floor(Math.random() * 21));
      }
      if (majorCode === "TJA") tja = String(75 + Math.floor(Math.random() * 21));
      
      const numGrades = [mat, ind, ing, parseFloat(pem) || 0, parseFloat(jar) || 0, parseFloat(tja) || 0].filter(n => n > 0);
      const avg = (numGrades.reduce((sum, n) => sum + n, 0) / numGrades.length).toFixed(1);

      nilai_siswa.push([
        nis, nama, gender, majorCode, kelas,
        String(mat), String(ind), String(ing), String(avg),
        "Lulus", pem, jar, tja
      ]);
    }

    // 4. prestasi_siswa
    if (Math.random() < 0.15) {
      const isAcademic = Math.random() > 0.5;
      if (isAcademic) {
        prestasi_siswa.push([
          nis, nama,
          "Olimpiade Matematika", "Provinsi", "Juara 2",
          "", "", "", "", "Siswa berprestasi di bidang sains"
        ]);
      } else {
        prestasi_siswa.push([
          nis, nama,
          "", "", "",
          "Futsal Cup", "Olahraga", "Kabupaten", "Juara 1", "Kapten tim sekolah"
        ]);
      }
    }

    // 5. hasil_rekomendasi
    const recMajors = majorRecommendations[domType];
    const recCareers = careerRecommendations[domType];
    const explanation = `ALASAN: ${aiExplanationTemplates[domType]}\n\nTIPS: ${aiTipsTemplates[domType]}`;

    hasil_rekomendasi.push([
      timestamp,
      nis,
      nama,
      status.startsWith("PENDING") ? "" : recMajors.slice(0, 3).join(" | "),
      status.startsWith("PENDING") ? "" : recCareers.slice(0, 3).join(" | "),
      status.startsWith("PENDING") ? "" : explanation,
      status
    ]);
  }

  return {
    data_siswa,
    skor_riasec,
    nilai_siswa,
    prestasi_siswa,
    hasil_rekomendasi
  };
}

export const MOCK_DATA = generateMockData();
