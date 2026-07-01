/* =========================================================
   SCRIPT.JS — Coffee Nusantara Smart Label
   Vanilla JS: perpindahan tab & logika verifikasi keaslian.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* =====================================================
     1. TAB SWITCHING
     Menambah/menghapus class 'hidden' pada konten tab dan
     class 'tab-active' pada tombol tab.
     ===================================================== */
  const tabButtons  = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.tab;

      // Reset semua tombol: hapus status aktif
      tabButtons.forEach((b) => b.classList.remove('tab-active'));
      // Aktifkan tombol yang diklik
      btn.classList.add('tab-active');

      // Sembunyikan semua konten tab, lalu tampilkan yang sesuai
      tabContents.forEach((content) => {
        if (content.id === `tab-content-${targetId}`) {
          content.classList.remove('hidden');
        } else {
          content.classList.add('hidden');
        }
      });

      // Jalankan ulang animasi bar profil rasa saat tab 3 dibuka
      if (targetId === '3') {
        animateTasteBars();
      }
    });
  });

  /* =====================================================
     2. INDIKATOR PENGGULIR NAVBAR
     Menampilkan trek/thumb scroll + bayangan tepi kanan
     HANYA jika menu tab tidak muat semua di layar (mis. HP kecil),
     supaya pengguna tahu masih ada tab lain yang bisa digeser.
     ===================================================== */
  const tabNav       = document.getElementById('tab-nav');
  const scrollTrack  = document.getElementById('tab-scroll-track');
  const scrollThumb  = document.getElementById('tab-scroll-thumb');
  const fadeRight     = document.getElementById('tab-fade-right');

  function updateTabScrollUI() {
    if (!tabNav || !scrollTrack || !scrollThumb) return;

    const maxScrollLeft = tabNav.scrollWidth - tabNav.clientWidth;
    const isScrollable = maxScrollLeft > 4; // toleransi kecil pembulatan

    // Sembunyikan seluruh indikator jika semua tab sudah muat di layar
    scrollTrack.classList.toggle('show', isScrollable);
    if (fadeRight) {
      fadeRight.classList.toggle('show', isScrollable && tabNav.scrollLeft < maxScrollLeft - 4);
    }
    if (!isScrollable) return;

    // Lebar thumb proporsional dengan porsi tab yang terlihat dari total lebar
    const trackWidth = scrollTrack.clientWidth;
    const thumbWidthRatio = tabNav.clientWidth / tabNav.scrollWidth;
    const thumbWidth = Math.max(thumbWidthRatio * trackWidth, 28);
    scrollThumb.style.width = `${thumbWidth}px`;

    // Posisi thumb mengikuti posisi scroll saat ini
    const maxThumbLeft = trackWidth - thumbWidth;
    const scrollRatio = tabNav.scrollLeft / maxScrollLeft;
    const thumbLeft = scrollRatio * maxThumbLeft;
    scrollThumb.style.transform = `translateX(${thumbLeft}px)`;
  }

  if (tabNav) {
    tabNav.addEventListener('scroll', updateTabScrollUI);
    window.addEventListener('resize', updateTabScrollUI);
    // Jalankan setelah semua elemen (termasuk font ikon) selesai dimuat agar lebar terukur tepat
    window.addEventListener('load', updateTabScrollUI);
    updateTabScrollUI();
  }

  // ----- Thumb bisa DI-DRAG langsung dengan jari/mouse untuk menggulirkan tab -----
  if (scrollThumb && tabNav && scrollTrack) {
    let isDragging = false;
    let dragStartX = 0;
    let dragStartScrollLeft = 0;

    scrollThumb.addEventListener('pointerdown', (e) => {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartScrollLeft = tabNav.scrollLeft;
      scrollThumb.classList.add('dragging');
      scrollThumb.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    scrollThumb.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const maxScrollLeft = tabNav.scrollWidth - tabNav.clientWidth;
      const trackWidth = scrollTrack.clientWidth;
      const thumbWidth = scrollThumb.getBoundingClientRect().width;
      const maxThumbLeft = trackWidth - thumbWidth;
      if (maxThumbLeft <= 0) return;

      const deltaX = e.clientX - dragStartX;
      // Konversi jarak drag di trek (pixel kecil) ke jarak scroll asli (pixel penuh)
      const scrollDelta = deltaX * (maxScrollLeft / maxThumbLeft);
      const nextScrollLeft = Math.min(Math.max(dragStartScrollLeft + scrollDelta, 0), maxScrollLeft);
      tabNav.scrollLeft = nextScrollLeft; // otomatis memicu updateTabScrollUI lewat event 'scroll'
    });

    const endDrag = (e) => {
      if (!isDragging) return;
      isDragging = false;
      scrollThumb.classList.remove('dragging');
      try { scrollThumb.releasePointerCapture(e.pointerId); } catch (err) { /* abaikan */ }
    };
    scrollThumb.addEventListener('pointerup', endDrag);
    scrollThumb.addEventListener('pointercancel', endDrag);

    // ----- Klik/tap di area trek (bukan thumb) langsung melompat ke posisi itu -----
    scrollTrack.addEventListener('pointerdown', (e) => {
      if (e.target === scrollThumb) return; // sudah ditangani drag di atas
      const rect = scrollTrack.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const thumbWidth = scrollThumb.getBoundingClientRect().width;
      const maxScrollLeft = tabNav.scrollWidth - tabNav.clientWidth;
      const maxThumbLeft = rect.width - thumbWidth;
      if (maxThumbLeft <= 0) return;

      const targetThumbLeft = Math.min(Math.max(clickX - thumbWidth / 2, 0), maxThumbLeft);
      const ratio = targetThumbLeft / maxThumbLeft;
      tabNav.scrollTo({ left: ratio * maxScrollLeft, behavior: 'smooth' });
    });
  }

  /* =====================================================
     3. PROFIL RASA — animasi bar acidity/body/sweetness
     ===================================================== */
  function animateTasteBars() {
    document.querySelectorAll('.taste-bar-fill').forEach((bar) => {
      const value = bar.dataset.value || 0;
      bar.style.width = '0%';
      // requestAnimationFrame + setTimeout kecil agar transisi CSS terpicu ulang
      requestAnimationFrame(() => {
        setTimeout(() => {
          bar.style.width = `${value}%`;
        }, 60);
      });
    });
  }

  /* =====================================================
     4. SARAN PENYAJIAN — data metode seduh (V60 & Tubruk)
     EDIT: ubah angka takaran/suhu di objek ini sesuai resep Anda
     ===================================================== */
  const brewData = {
    v60: {
      temp: '92°C',
      ratio: '1 : 16',
      time: '2:30 min',
      grind: 'Sedang',
      gauge: 76,
      note: 'Tuang air panas perlahan secara memutar untuk ekstraksi merata.',
    },
    tubruk: {
      temp: '100°C',
      ratio: '1 : 15',
      time: '4:00 min',
      grind: 'Kasar',
      gauge: 92,
      note: 'Seduh langsung dengan air mendidih, biarkan ampas mengendap sebelum diminum.',
    },
  };

  const brewButtons = document.querySelectorAll('.brew-opt');
  const gaugeEl = document.getElementById('gauge');

  brewButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      brewButtons.forEach((b) => b.classList.remove('brew-active'));
      btn.classList.add('brew-active');

      const data = brewData[btn.dataset.method];
      if (!data) return;

      document.getElementById('gauge-temp').textContent  = data.temp;
      document.getElementById('gauge-ratio').textContent = data.ratio;
      document.getElementById('gauge-time').textContent  = data.time;
      document.getElementById('gauge-grind').textContent = data.grind;
      document.getElementById('gauge-note').textContent  = data.note;
      gaugeEl.style.setProperty('--gauge', data.gauge);
    });
  });

  /* =====================================================
     5. CEK KEASLIAN PRODUK
     Klik tombol -> tampilkan spinner loading 1 detik ->
     tampilkan hasil sukses (emerald-50) dengan nomor seri fiktif.
     ===================================================== */
  const verifyBox = document.getElementById('verify-box');
  const verifyBtn = document.getElementById('verify-btn');

  verifyBtn.addEventListener('click', () => {
    // Tampilkan state loading (spinner fiktif)
    verifyBox.innerHTML = `
      <i class="fa-solid fa-mug-hot spinner text-3xl" style="color:var(--color-accent);"></i>
      <p class="text-xs mt-3 font-mono" style="color:var(--color-coffee-mid);">Memeriksa basis data...</p>
    `;

    setTimeout(() => {
      // EDIT: pola nomor seri fiktif bisa disesuaikan (mis. kode batch asli Anda)
      const randomPart = Math.floor(10000 + Math.random() * 89999);
      const year = new Date().getFullYear();
      const serialNumber = `CN-GYO-${year}-${randomPart}`;

      const now = new Date();
      const timestamp =
        'Diverifikasi pada ' +
        now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) +
        ' · ' +
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

      // Ubah tampilan kotak menjadi status sukses (emerald-50)
      verifyBox.className = 'pop-in text-center py-6 rounded-2xl border-2 border-emerald-200 bg-emerald-50';
      verifyBox.innerHTML = `
        <i class="fa-solid fa-circle-check text-4xl text-emerald-500 mb-3"></i>
        <p class="font-display font-semibold text-emerald-800">Produk 100% Original</p>
        <p class="text-xs text-emerald-700/70 mt-1">Terverifikasi dalam sistem Coffee Nusantara</p>
        <p class="font-mono text-sm mt-3 tracking-wider bg-emerald-100 text-emerald-700 inline-block px-3 py-1.5 rounded-lg">
          ${serialNumber}
        </p>
        <p class="text-[10px] text-emerald-700/60 mt-2 font-mono">${timestamp}</p>
      `;
    }, 1000);
  });

});