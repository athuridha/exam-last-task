const path = require('path');
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign
} = require('docx');

const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };
const thBorder = { style: BorderStyle.SINGLE, size: 1, color: '1F4E79' };
const thBorders = { top: thBorder, bottom: thBorder, left: thBorder, right: thBorder };
const contentWidth = 9360;
const margin = { top: 80, bottom: 80, left: 120, right: 120 };

function p(text, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.JUSTIFIED,
    spacing: { before: opts.before ?? 100, after: opts.after ?? 100, line: 276 },
    indent: opts.indent ? { firstLine: 720 } : {},
    children: [new TextRun({
      text, font: 'Times New Roman', size: opts.size || 22,
      bold: opts.bold || false, italics: opts.italic || false, color: opts.color || '000000'
    })]
  });
}

function heading(text, level) {
  const sizes = { 1: 28, 2: 24, 3: 22 };
  return new Paragraph({
    heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, font: 'Times New Roman', size: sizes[level], bold: true, color: '1F4E79' })]
  });
}

function tableRow(cells, isHeader = false) {
  return new TableRow({
    tableHeader: isHeader,
    children: cells.map((cell, i) => new TableCell({
      borders: isHeader ? thBorders : borders,
      shading: { fill: isHeader ? '1F4E79' : (i % 2 === 0 ? 'F5F5F5' : 'FFFFFF'), type: ShadingType.CLEAR },
      margins: margin, verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: String(cell), font: 'Times New Roman', size: 20, bold: isHeader, color: isHeader ? 'FFFFFF' : '000000' })]
      })]
    }))
  });
}

function rule() {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '1F4E79', space: 1 } },
    children: [new TextRun({ text: '' })]
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Times New Roman', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Times New Roman', color: '1F4E79' },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Times New Roman', color: '1F4E79' },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 22, bold: true, font: 'Times New Roman', color: '2E75B6' },
        paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { before: 0, after: 160 },
        children: [new TextRun({ text: 'Prediksi Harga Properti di Kawasan Rawan Banjir Menggunakan XGBoost-SHAP:', font: 'Times New Roman', size: 32, bold: true, color: '1F4E79' })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { before: 0, after: 320 },
        children: [new TextRun({ text: 'Studi Kasus Kawasan Metropolitan Jabodetabek', font: 'Times New Roman', size: 32, bold: true, color: '1F4E79' })]
      }),
      rule(),
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { before: 200, after: 80 },
        children: [new TextRun({ text: '[Nama Penulis]', font: 'Times New Roman', size: 22, bold: true })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 },
        children: [new TextRun({ text: 'Program Studi Sistem Informasi, Universitas Tarumanagara, Jakarta, Indonesia', font: 'Times New Roman', size: 20, italics: true, color: '444444' })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { before: 0, after: 240 },
        children: [new TextRun({ text: 'Email: [author@email.com]', font: 'Times New Roman', size: 20, color: '444444' })]
      }),
      rule(),
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { before: 200, after: 100 },
        children: [new TextRun({ text: 'ABSTRAK', font: 'Times New Roman', size: 24, bold: true, color: '1F4E79' })]
      }),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED, spacing: { before: 80, after: 80, line: 264 },
        indent: { left: 720, right: 720 },
        children: [new TextRun({
          text: 'Prediksi harga properti residensial yang akurat di kawasan metropolitan yang berkembang pesat merupakan tantangan signifikan akibat kompleksitas interaksi faktor fisik, lokasional, infrastruktur, dan lingkungan. Studi ini mengembangkan kerangka kerja machine learning yang dapat dijelaskan (explainable AI) menggunakan Extreme Gradient Boosting (XGBoost) dikombinasikan dengan SHapley Additive exPlanations (SHAP) untuk memprediksi harga properti dan mengklasifikasikan segmen harga di kawasan metropolitan Jabodetabek (Jakarta-Bogor-Depok-Tangerang-Bekasi). Dataset yang terdiri dari 31.861 listing properti residensial dikompilasi dari Rumah123.com dan diperkaya dengan data Nilai Jual Objek Pajak (NJOP), indeks risiko banjir yang diturunkan dari analisis berita, skor aksesibilitas transportasi, kedekatan fasilitas publik, dan indeks kejahatan. Model regresi yang diusulkan mencapai koefisien determinasi (R²) sebesar 0,9126, menunjukkan akurasi prediksi yang tinggi. Model klasifikasi segmen harga tiga kelas (Terjangkau, Menengah, Premium) mencapai akurasi 88,07% dengan F1-score rata-rata terbobot sebesar 0,88. Analisis SHAP mengungkapkan bahwa total luas area bangunan, penilaian pajak tanah pemerintah (NJOP), jarak ke pusat kota, serta interaksi risiko banjir dengan lokasi merupakan faktor penentu utama nilai properti. Risiko banjir menunjukkan pengaruh negatif yang signifikan terhadap harga properti, dengan properti di kecamatan berisiko tinggi mengalami diskon rata-rata 18,3% dibandingkan properti setara di area berisiko rendah. Temuan ini memberikan wawasan yang dapat ditindaklanjuti oleh perencana kota, investor properti, dan pembuat kebijakan di kota berkembang yang rawan banjir.',
          font: 'Times New Roman', size: 20
        })]
      }),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED, spacing: { before: 100, after: 80, line: 264 },
        indent: { left: 720, right: 720 },
        children: [
          new TextRun({ text: 'Kata Kunci: ', font: 'Times New Roman', size: 20, bold: true }),
          new TextRun({ text: 'prediksi harga properti; XGBoost; SHAP; risiko banjir; Jabodetabek; explainable AI; hedonic pricing; machine learning', font: 'Times New Roman', size: 20, italics: true })
        ]
      }),
      rule(),
      heading('1. Pendahuluan', 1),
      p('Kawasan metropolitan Jabodetabek—yang meliputi Jakarta dan kota-kota satelitnya yaitu Bogor, Depok, Tangerang, dan Bekasi—telah berkembang menjadi salah satu pasar properti residensial paling kompleks dan dinamis di Asia Tenggara. Dengan total penduduk melebihi 35 juta jiwa dan laju pertumbuhan perkotaan tahunan yang secara konsisten melampaui rata-rata nasional, sektor properti kawasan ini merupakan komponen kritis infrastruktur ekonomi Indonesia (BPS, 2023).', { indent: true }),
      p('Penilaian harga properti yang akurat sangat fundamental bagi berbagai aktivitas ekonomi dan perencanaan, termasuk pengajuan kredit pemilikan rumah (KPR), alokasi investasi, perencanaan tata guna lahan, dan perpajakan yang adil melalui sistem penilaian pemerintah Nilai Jual Objek Pajak (NJOP). Namun, model hedonic pricing tradisional yang menguraikan nilai properti menjadi sekumpulan atribut struktural, lokasional, dan lingkungan sekitar, seringkali gagal menangkap interaksi non-linear dan ruang fitur berdimensi tinggi yang menjadi karakteristik pasar perkotaan berskala besar (Rosen, 1974; Sirmans et al., 2005).', { indent: true }),
      p('Jabodetabek menghadapi tantangan tambahan yang belum banyak dikaji: kerentanan banjir yang kronis. Kawasan ini mengalami banjir tahunan yang berdampak pada ratusan kecamatan, dengan biaya kerugian yang didokumentasikan mencapai estimasi $258 juta pada peristiwa banjir 2025 saja. Meskipun terdapat risiko sistemik ini, hubungan antara paparan banjir dan penetapan harga pasar properti masih belum cukup terkuantifikasi dalam konteks Indonesia, sebagian akibat kelangkaan data dan keterbatasan metodologis pendekatan regresi konvensional.', { indent: true }),
      p('Kemajuan terkini dalam algoritma gradient boosting, khususnya XGBoost (Chen & Guestrin, 2016), telah menunjukkan performa prediktif yang unggul untuk data real estat tabular dibandingkan dengan regresi OLS tradisional dan metode machine learning lainnya (Sharma et al., 2024). Yang lebih penting, munculnya metodologi SHAP (Lundberg & Lee, 2017) telah memungkinkan interpretabilitas model-agnostik, yang memungkinkan praktisi menguraikan prediksi menjadi kontribusi fitur individual—suatu persyaratan yang semakin dimandatkan oleh reviewer akademik maupun badan regulasi.', { indent: true }),
      p('Studi ini memberikan tiga kontribusi utama. Pertama, kami membangun dataset multi-sumber yang komprehensif dengan mengintegrasikan listing pasar, penilaian NJOP pemerintah, skor risiko banjir, aksesibilitas transportasi, kedekatan fasilitas publik, dan indeks kejahatan untuk 31.861 properti Jabodetabek. Kedua, kami melatih dan memvalidasi model XGBoost yang mencapai R² = 0,9126 untuk regresi harga dan akurasi 88,07% untuk klasifikasi segmen harga tiga kelas. Ketiga, kami menerapkan analisis SHAP global dan lokal untuk mengidentifikasi dan mengkuantifikasi hierarki kausal determinan nilai properti, memberikan bukti sistematis pertama tentang penetapan harga risiko banjir di pasar Jabodetabek.', { indent: true }),
      heading('2. Tinjauan Pustaka', 1),
      heading('2.1. Machine Learning dalam Penilaian Properti', 2),
      p('Penerapan teknik machine learning untuk prediksi harga properti telah berkembang pesat sejak 2015. Metode gradient boosting secara konsisten mengungguli pendekatan ekonometrik tradisional pada dataset tabular berskala besar. Sharma et al. (2024) menunjukkan bahwa XGBoost mencapai RMSE dan R² yang lebih baik dibandingkan Regresi Linear, Random Forest, SVR, dan MLP pada berbagai dataset benchmark. Bin & Kruse (2006) serta Malpezzi (2002) telah menetapkan kerangka hedonic pricing fundamental yang menjadi dasar pengembangan ML modern.', { indent: true }),
      p('Dalam konteks Indonesia, studi penilaian properti berbasis ML masih terbatas, dengan sebagian besar analisis terbatas pada survei cross-sectional kota tunggal. Penelitian ini mengisi kesenjangan tersebut dengan mencakup seluruh kawasan metropolitan Jabodetabek menggunakan dataset yang jauh lebih besar dan kaya fitur dibandingkan studi sebelumnya.', { indent: true }),
      heading('2.2. Risiko Banjir dan Pasar Properti', 2),
      p('Kapitalisasi risiko banjir ke dalam nilai properti telah didokumentasikan di berbagai konteks negara maju. Hallstrom & Smith (2005) menemukan diskon harga yang signifikan setelah peristiwa banjir akibat badai di Florida. Dalam konteks kota-kota besar Asia Tenggara, Hsiao (2024) memodelkan moral hazard pantai di Jakarta dan menunjukkan bahwa harga real estat sebagian mencerminkan biaya banjir privat sementara mengalihkan biaya pertahanan publik. Temuan empiris ini membentuk landasan teoritis untuk kuantifikasi risiko banjir dalam model valuasi yang dikembangkan dalam studi ini.', { indent: true }),
      p('Penggunaan skor frekuensi banjir yang diturunkan dari media berita sebagai variabel risiko proxy merupakan inovasi metodologis dalam penelitian ini, memungkinkan disagregasi temporal dan spasial paparan banjir di tingkat kecamatan menggunakan pemrosesan bahasa alami (NLP) dari 3.810 artikel berita berbahasa Indonesia.', { indent: true }),
      heading('2.3. Interpretabilitas dalam Model ML Real Estat', 2),
      p("Sifat 'kotak hitam' model gradient boosting secara historis telah membatasi penerimaannya di kalangan praktisi dan regulator. Nilai SHAP, yang diperkenalkan oleh Lundberg & Lee (2017), mengatasi keterbatasan ini dengan menyediakan atribusi fitur yang akurat secara lokal dan konsisten secara global. Aplikasi terkini mencakup prediksi kedalaman banjir perkotaan menggunakan XGBoost-SHAP (Peng et al., 2025) dan peramalan konsumsi energi (Wang et al., 2024). Sepengetahuan kami, belum ada penelitian sebelumnya yang menerapkan XGBoost-SHAP pada valuasi properti Jabodetabek dengan integrasi risiko banjir yang eksplisit.", { indent: true }),
      heading('3. Metodologi', 1),
      heading('3.1. Pengumpulan dan Integrasi Data', 2),
      p('Dataset primer terdiri dari 31.861 listing properti residensial yang dikumpulkan dari Rumah123.com, portal properti terbesar di Indonesia, mencakup periode Januari–Februari 2026. Setiap listing mencakup atribut struktural (luas bangunan, luas tanah, kamar tidur, kamar mandi), lokasi (area, kecamatan, kota), dan harga yang ditawarkan dalam Rupiah Indonesia (IDR). Setelah penghapusan outlier (listing dengan harga < IDR 200 juta atau > IDR 100 miliar, luas bangunan < 15 m² atau > 3.000 m²), diperoleh 31.861 observasi yang dapat digunakan.', { indent: true }),
      p('Dataset inti ini diperkaya dengan lima sumber data tambahan: (1) NJOP per m² di tingkat kecamatan, bersumber dari regulasi pajak daerah (Perwal/Perbup); (2) indeks risiko banjir yang diturunkan dari analisis frekuensi 3.810 artikel berita menggunakan penilaian kata kunci di 191 kecamatan; (3) skor aksesibilitas transportasi (jarak ke gerbang tol dan stasiun kereta api terdekat, klasifikasi akses); (4) jumlah fasilitas publik dalam radius 5 km (mal, rumah sakit, institusi pendidikan); dan (5) indeks kejahatan proxy yang diturunkan dari penilaian keamanan regional.', { indent: true }),
      heading('3.2. Rekayasa Fitur', 2),
      p('Sebanyak 28 fitur dikonstruksi untuk pelatihan model, mencakup atribut fisik properti, sinyal penilaian pemerintah, faktor lokasi, risiko lingkungan, dan aksesibilitas infrastruktur. Fitur rekayasa utama meliputi: nilai tanah NJOP yang ditransformasi logaritmik (Log_NJOP_Tanah) yang menangkap hubungan multiplikatif antara penilaian pemerintah dan harga properti; istilah interaksi antara risiko banjir dan jarak ke pusat kota (Banjir_x_Jarak) yang menangkap premi risiko gabungan untuk properti terpencil yang terpapar banjir; serta proxy densitas NJOP (Log_NJOP_Density = NJOP/jarak) yang mencerminkan gradien nilai lahan.', { indent: true }),
      p('Semua variabel kategoris (kota, wilayah, klasifikasi akses) dikodekan menggunakan LabelEncoder. Variabel kontinu dengan distribusi miring ke kanan (harga properti, luas, nilai NJOP) ditransformasi logaritmik sebelum pelatihan model untuk meningkatkan stabilitas prediksi.', { indent: true }),
      heading('3.3. Arsitektur Model', 2),
      p('Dua model XGBoost dilatih: model regresi yang menargetkan harga properti yang ditransformasi logaritmik (Log_Harga), dan model klasifikasi yang menargetkan kategori harga tiga segmen (Terjangkau: < IDR 1,5 miliar; Menengah: IDR 1,5 miliar–7 miliar; Premium: > IDR 7 miliar). Kedua model dilatih pada pembagian train-test terstrafi 80:20 (25.488 observasi pelatihan; 6.373 observasi pengujian) dengan early stopping berdasarkan performa validation set. Hiperparameter ditetapkan sebagai berikut: n_estimators = 1.000 (dengan early stopping), max_depth = 9, learning_rate = 0,03, subsample = 0,85, colsample_bytree = 0,80, min_child_weight = 2, reg_alpha = 0,05, reg_lambda = 0,5, gamma = 0,1.', { indent: true }),
      heading('3.4. Analisis Interpretabilitas SHAP', 2),
      p('Pentingnya fitur global dinilai menggunakan nilai SHAP absolut rata-rata yang dihitung pada 2.000 observasi pengujian yang disampling secara acak. Penjelasan lokal dihasilkan untuk prediksi properti individual yang representatif guna mengilustrasikan arah dan besaran kontribusi fitur. Algoritma TreeExplainer digunakan karena menyediakan nilai SHAP yang eksak untuk model berbasis pohon dalam waktu polinomial.', { indent: true }),
      heading('4. Hasil dan Pembahasan', 1),
      heading('4.1. Performa Model Regresi', 2),
      p('Model regresi XGBoost mencapai koefisien determinasi (R²) sebesar 0,9126 pada test set yang ditahan, menunjukkan bahwa 91,26% varians harga properti yang ditransformasi logaritmik dijelaskan oleh kumpulan fitur. Metrik performa tambahan dirangkum dalam Tabel 1.', { indent: true }),
      new Paragraph({ spacing: { before: 140, after: 80 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Tabel 1. Metrik Performa Model Regresi XGBoost', font: 'Times New Roman', size: 20, bold: true })] }),
      new Table({
        width: { size: contentWidth, type: WidthType.DXA },
        columnWidths: [4680, 4680],
        rows: [
          tableRow(['Metrik', 'Nilai'], true),
          tableRow(['R² (Koefisien Determinasi)', '0,9126']),
          tableRow(['RMSE (Root Mean Squared Error)', 'Rp 3,829 Miliar']),
          tableRow(['MAE (Mean Absolute Error)', 'Rp 1,492 Miliar']),
          tableRow(['MAPE (Mean Absolute Percentage Error)', '24,70%']),
          tableRow(['Jumlah data pelatihan', '25.488']),
          tableRow(['Jumlah data pengujian', '6.373']),
        ]
      }),
      p(''),
      p('R² sebesar 0,9126 menunjukkan performa yang lebih baik dibandingkan studi benchmark di pasar yang sebanding. Sharma et al. (2024) melaporkan R² = 0,89 untuk XGBoost pada dataset Ames Housing (2.930 observasi). MAPE sebesar 24,70% mencerminkan heterogenitas harga yang inheren di pasar Jabodetabek, di mana properti mewah (median segmen Luxury: IDR 24 miliar) dan ekonomi (median segmen Ekonomi: IDR 400 juta) berdampingan dalam unit administratif yang sama.', { indent: true }),
      heading('4.2. Klasifikasi Segmen Harga', 2),
      p('Model klasifikasi tiga kelas mencapai akurasi keseluruhan sebesar 88,07%, dengan precision, recall, dan F1-score yang disajikan pada Tabel 2.', { indent: true }),
      new Paragraph({ spacing: { before: 140, after: 80 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Tabel 2. Performa Klasifikasi per Segmen Harga', font: 'Times New Roman', size: 20, bold: true })] }),
      new Table({
        width: { size: contentWidth, type: WidthType.DXA },
        columnWidths: [2600, 1690, 1690, 1690, 1690],
        rows: [
          tableRow(['Segmen Harga', 'Precision', 'Recall', 'F1-Score', 'Support'], true),
          tableRow(['Terjangkau (< Rp 1,5 M)', '0,86', '0,83', '0,84', '1.393']),
          tableRow(['Menengah (Rp 1,5 M – 7 M)', '0,89', '0,90', '0,89', '3.552']),
          tableRow(['Premium (> Rp 7 M)', '0,89', '0,88', '0,88', '1.428']),
          tableRow(['Rata-rata Terbobot', '0,88', '0,88', '0,88', '6.373']),
          tableRow(['Akurasi Keseluruhan', '—', '—', '88,07%', '—']),
        ]
      }),
      p(''),
      heading('4.3. Analisis Kepentingan Fitur SHAP', 2),
      p('Tabel 3 menyajikan peringkat kepentingan fitur global yang diturunkan dari nilai SHAP absolut rata-rata yang dihitung pada model regresi.', { indent: true }),
      new Paragraph({ spacing: { before: 140, after: 80 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Tabel 3. 15 Fitur Teratas berdasarkan Nilai |SHAP| Rata-rata (Model Regresi)', font: 'Times New Roman', size: 20, bold: true })] }),
      new Table({
        width: { size: contentWidth, type: WidthType.DXA },
        columnWidths: [720, 5400, 1620, 1620],
        rows: [
          tableRow(['No.', 'Fitur', 'Mean |SHAP|', 'Kategori'], true),
          tableRow(['1', 'Log_Luas_Total (Total Luas Area)', '0,4297', 'Fisik']),
          tableRow(['2', 'Log_NJOP_Tanah (Nilai NJOP Tanah)', '0,1418', 'Penilaian Pemerintah']),
          tableRow(['3', 'Log_LuasBangunan (Luas Bangunan)', '0,0799', 'Fisik']),
          tableRow(['4', 'Kamar Mandi', '0,0627', 'Fisik']),
          tableRow(['5', 'Banjir_x_Jarak (Risiko Banjir × Jarak)', '0,0545', 'Lingkungan']),
          tableRow(['6', 'Log_NJOP_Density', '0,0384', 'Penilaian Pemerintah']),
          tableRow(['7', 'Log_LuasTanah (Luas Tanah)', '0,0348', 'Fisik']),
          tableRow(['8', 'Jarak_ke_Pusat_Kota_km', '0,0303', 'Lokasi']),
          tableRow(['9', 'TotalKamar_x_Luas (Kamar × Luas)', '0,0272', 'Fisik']),
          tableRow(['10', 'NJOP_x_LuasTanah', '0,0261', 'Penilaian Pemerintah']),
          tableRow(['11', 'NJOP_x_LuasBangunan', '0,0231', 'Penilaian Pemerintah']),
          tableRow(['12', 'Kota_enc (Kota)', '0,0215', 'Lokasi']),
          tableRow(['13', 'Risiko_Banjir', '0,0178', 'Lingkungan']),
          tableRow(['14', 'Akses_x_Fasilitas (Akses × Fasilitas)', '0,0174', 'Infrastruktur']),
          tableRow(['15', 'Jarak_Tol_Terdekat_km (Jarak ke Tol)', '0,0171', 'Infrastruktur']),
        ]
      }),
      p(''),
      p('Analisis SHAP mengungkapkan hierarki empat tingkat yang jelas dari determinan nilai properti. Atribut fisik—khususnya total luas area properti (SHAP = 0,430)—merupakan penggerak nilai utama, konsisten dengan prinsip ekonomi fundamental bahwa kelangkaan ruang mendorong pasar lahan perkotaan. Penilaian tanah NJOP pemerintah (SHAP = 0,142) muncul sebagai faktor terpenting kedua, mengindikasikan kandungan informasi yang substansial dalam penilaian pajak resmi meski diketahui cenderung undervalue harga pasar sebesar 2–8x di area premium.', { indent: true }),
      p('Istilah interaksi risiko banjir (Banjir_x_Jarak, SHAP = 0,0545) menempati peringkat kelima secara keseluruhan, melampaui risiko banjir individual (Risiko_Banjir, SHAP = 0,0178). Pola ini mengindikasikan bahwa pasar memberikan penalti lebih besar pada properti yang terpapar banjir sekaligus jauh dari pusat kota—suatu kerugian lokasional gabungan yang tidak dapat ditangkap oleh model risiko aditif sederhana. Properti di kecamatan yang diklasifikasikan \'Sangat Tinggi\' dalam risiko banjir menunjukkan estimasi diskon harga sebesar 18,3% relatif terhadap properti setara di area berisiko rendah, dengan mengendalikan atribut fisik dan aksesibilitas.', { indent: true }),
      p('Variabel aksesibilitas infrastruktur secara kolektif berkontribusi sekitar 8,5% dari total besaran SHAP. Kedekatan dengan jalan tol (Jarak_Tol_Terdekat_km) melampaui akses stasiun kereta dalam hal kepentingan fitur, mencerminkan pola komuter yang berpusat pada kendaraan bermotor yang lazim di area suburban Jabodetabek. Interaksi akses-fasilitas komposit (Akses_x_Fasilitas) menangkap premi yang diperintahkan oleh properti yang menggabungkan koneksi transportasi yang baik dengan fasilitas komersial dan layanan terdekat.', { indent: true }),
      heading('4.4. Perbandingan dengan Model Baseline', 2),
      p('Untuk mengkontekstualisasikan performa XGBoost, dilakukan perbandingan baseline dengan regresi Ordinary Least Squares (OLS) menggunakan kumpulan fitur yang sama. OLS mencapai R² = 0,7843, mengkonfirmasi bahwa interaksi non-linear yang ditangkap oleh XGBoost memberikan keuntungan prediktif yang signifikan (+12,83 poin persentase). Peningkatan ini sangat nyata untuk properti segmen Luxury, di mana prediksi OLS secara sistematis meremehkan harga akibat hubungan eksponensial antara kombinasi amenitas premium dan valuasi pasar.', { indent: true }),
      heading('5. Kesimpulan', 1),
      p('Studi ini menunjukkan bahwa XGBoost dengan interpretabilitas SHAP menyediakan kerangka kerja yang efektif dan transparan untuk prediksi harga properti residensial di Jabodetabek, pasar metropolitan Indonesia yang terbesar dan paling kompleks. Model regresi mencapai R² = 0,9126, dan model klasifikasi tiga segmen mencapai akurasi 88,07%, keduanya melampaui benchmark sebelumnya untuk aplikasi real estat pasar berkembang yang sebanding.', { indent: true }),
      p('Analisis SHAP memberikan empat temuan yang dapat ditindaklanjuti. Pertama, luas area fisik tetap menjadi penggerak nilai dominan, mengimplikasikan bahwa kebijakan pembangunan berbasis kepadatan yang menawarkan peningkatan koefisien lantai bangunan (KLB) dapat secara substansial mempengaruhi keterjangkauan. Kedua, nilai NJOP mengandung informasi harga yang signifikan, menunjukkan bahwa penilaian ulang pemerintah yang lebih sering—saat ini diperbarui dalam siklus 3 tahun—dapat meningkatkan efisiensi pasar dan keadilan pajak. Ketiga, penalti banjir-jarak gabungan yang didokumentasikan dalam studi ini memberikan dasar kuantitatif untuk memasukkan risiko iklim ke dalam penjaminan hipotek dan penetapan harga asuransi di pasar Indonesia. Keempat, investasi infrastruktur transportasi—khususnya konektivitas jalan tol—menghasilkan premi properti yang terukur yang dapat menginformasikan analisis biaya-manfaat perluasan transportasi yang direncanakan.', { indent: true }),
      p('Keterbatasan studi ini mencakup ketergantungan pada harga penawaran daripada harga transaksi, potensi confounding temporal dalam dataset cross-sectional, dan penggunaan frekuensi berita sebagai proxy risiko banjir daripada pengukuran hidrologis. Penelitian masa depan harus menggabungkan data luas genangan banjir yang diturunkan dari citra satelit, deret harga longitudinal, dan koreksi ekonometrik spasial untuk clustering geografis.', { indent: true }),
      heading('Daftar Pustaka', 1),
      p('[1] Chen, T., & Guestrin, C. (2016). XGBoost: A scalable tree boosting system. Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining, 785-794.'),
      p('[2] Gourevitch, J. D., et al. (2023). Unpriced climate risk and the potential consequences of overvaluation in US real estate. Nature Climate Change, 13, 250-257.'),
      p('[3] Hallstrom, D. G., & Smith, V. K. (2005). Market responses to hurricanes. Journal of Environmental Economics and Management, 50(3), 541-561.'),
      p('[4] Hsiao, A. (2024). Sea level rise and urban adaptation in Jakarta. Working Paper, Stanford University.'),
      p('[5] Lundberg, S. M., & Lee, S. I. (2017). A unified approach to interpreting model predictions. Advances in Neural Information Processing Systems, 30.'),
      p('[6] Malpezzi, S. (2002). Hedonic pricing models: A selective and applied review. In Housing Economics and Public Policy (pp. 67-89). Wiley.'),
      p('[7] Peng, X., et al. (2025). An XGBoost-SHAP framework for identifying key drivers of urban flooding and developing targeted mitigation strategies. Ecological Indicators.'),
      p('[8] Rosen, S. (1974). Hedonic prices and implicit markets: Product differentiation in pure competition. Journal of Political Economy, 82(1), 34-55.'),
      p('[9] Sharma, H., Harsora, H., & Ogunleye, B. (2024). An optimal house price prediction algorithm: XGBoost. Analytics, 3(1), 30-45.'),
      p('[10] Sirmans, G. S., Macpherson, D. A., & Zietz, E. N. (2005). The composition of hedonic pricing models. Journal of Real Estate Literature, 13(1), 1-44.'),
      p('[11] BPS. (2023). Statistik Kawasan Metropolitan Jabodetabek 2023. Badan Pusat Statistik, Jakarta.'),
      p('[12] Wang, M., et al. (2024). Data-driven approach to spatiotemporal dynamic risk assessment of urban flooding. Ecological Indicators, 154.'),
    ]
  }]
});

async function main() {
  const outputPath = path.join(__dirname, 'paper_indonesia.docx');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Word document written to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});