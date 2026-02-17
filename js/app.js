const citySelect = document.getElementById('city');
const countdownEl = document.getElementById('countdown');
const nextPrayerEl = document.getElementById('nextPrayer');
const progressBarEl = document.getElementById('progress-bar');
const upcomingPrayersEl = document.getElementById('upcoming-prayers');

const player = document.getElementById("maqra-player");
let hasPlayedToday = "";

// ===== TV MODE DETECTION =====
(function () {
    const params = new URLSearchParams(window.location.search);
    const isTV = params.get('tv') === '1';
    if (isTV) {
        document.body.classList.add('tv-mode');

        document.documentElement.requestFullscreen?.().catch(() => { });

        setInterval(() => location.reload(), 10 * 60 * 1000);
    }
})();

// ======================
// AUDIO ROUTINE (ADZAN -> ZIKIR)
// ======================
function playRoutine(prayerName) {
    if (!player) return;

    console.log(`Memulai rutinitas: ${prayerName}`);
    player.src = "/assets/audio/adzan.mp3";
    player.play().catch(e => {
        console.warn("Autoplay diblokir. Butuh klik user pertama kali di halaman ini.", e);
    });

    player.onended = () => {
        if (prayerName === "Subuh") {
            player.src = "/assets/audio/zikir-pagi.mp3";
            player.play();
        } else if (prayerName === "Ashar") {
            player.src = "/assets/audio/zikir-petang.mp3";
            player.play();
        } else {
            player.onended = null;
        }
    };
}

// =====================
// Fungsi Tanggal
// =====================
function updateDate() {
    const el = document.getElementById("today-date");
    if (!el) return;
    const now = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    el.textContent = now.toLocaleDateString('id-ID', options);
}
updateDate();

function parsePrayerDate(time, baseDate = new Date()) {
    if (!time || !time.includes(':')) return null;
    const [h, m] = time.split(':').map(Number);
    const d = new Date(baseDate);
    d.setHours(h, m, 0, 0);
    return d;
}

function renderPrayerBlocks(prayerList, nextId) {
    if (!upcomingPrayersEl) return;

    const now = new Date();
    const upcoming = [];

    prayerList.forEach((prayer) => {
        const prayerDate = parsePrayerDate(prayer.time, now);
        if (!prayerDate) return;
        if (prayerDate > now) upcoming.push(prayer);
    });

    upcomingPrayersEl.innerHTML = '';
    if (upcoming.length === 0) {
        const first = prayerList[0];
        if (first) {
            const li = document.createElement('li');
            li.className = 'prayer-item active-prayer';
            li.innerHTML = `<span>${first.name} (Besok)</span><strong>${first.time}</strong>`;
            upcomingPrayersEl.appendChild(li);
        } else {
            upcomingPrayersEl.innerHTML = '<li class="empty-state">Tidak ada data sholat</li>';
        }
        return;
    }

    upcoming.forEach((prayer) => {
        const li = document.createElement('li');
        li.className = `prayer-item${prayer.id === nextId ? ' active-prayer' : ''}`;
        li.innerHTML = `<span>${prayer.name}</span><strong>${prayer.time}</strong>`;
        upcomingPrayersEl.appendChild(li);
    });
}

// ======================
// JADWAL SHOLAT (MYQURAN API + FALLBACK)
// ======================
async function loadPrayerTimes(cityId) {
    if (countdownEl) countdownEl.textContent = '...';
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const url = `https://api.myquran.com/v2/sholat/jadwal/${cityId}/${y}/${m}/${d}`;

    try {
        const res = await fetch(url);
        const json = await res.json();
        if (json.status && json.data && json.data.jadwal) {
            const t = json.data.jadwal;
            startCountdown({
                Fajr: t.subuh, Dhuhr: t.dzuhur,
                Asr: t.ashar, Maghrib: t.maghrib, Isha: t.isya
            });
        } else { throw new Error("Data MyQuran kosong"); }
    } catch (err) {
        console.warn("Switching to Aladhan fallback...");
        const cityName = citySelect?.options?.[citySelect.selectedIndex]?.text;
        if (!cityName) throw new Error("Nama kota tidak ditemukan");
        const fallbackUrl = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(cityName)}&country=Indonesia&method=11`;
        try {
            const resFallback = await fetch(fallbackUrl);
            const dataFallback = await resFallback.json();
            const t = dataFallback?.data?.timings;
            if (!t) throw new Error("Data Aladhan kosong");
            startCountdown(t);
        } catch (fallbackErr) {
            if (countdownEl) countdownEl.textContent = 'Error Total';
            console.error('Semua API tumbang, bro:', fallbackErr);
        }
    }
}

// ======================
// COUNTDOWN & AUTO-AUDIO
// ======================
function startCountdown(t) {
    clearInterval(window._countdown);

    const prayerList = [
        { id: 'subuh', name: 'Subuh', time: t.Fajr || t.subuh },
        { id: 'dzuhur', name: 'Dzuhur', time: t.Dhuhr || t.dzuhur },
        { id: 'ashar', name: 'Ashar', time: t.Asr || t.ashar },
        { id: 'maghrib', name: 'Maghrib', time: t.Maghrib || t.maghrib },
        { id: 'isya', name: 'Isya', time: t.Isha || t.isya },
    ].filter(p => p.time && p.time.includes(':'));

    function tick() {
        const now = new Date();
        const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        // --- LOGIC AUDIO OTOMATIS ---
        const currentPrayerNow = prayerList.find(p => p.time === currentTimeStr);
        if (currentPrayerNow && hasPlayedToday !== currentPrayerNow.name) {
            hasPlayedToday = currentPrayerNow.name;
            playRoutine(currentPrayerNow.name);
        }
        // Reset hasPlayed pas tengah malam
        if (currentTimeStr === "00:00") hasPlayedToday = "";

        // --- LOGIC COUNTDOWN ---
        let next = null;
        let nextName = '';
        let nextId = '';

        for (const p of prayerList) {
            const prayerDate = parsePrayerDate(p.time, now);
            if (prayerDate && prayerDate > now) {
                next = prayerDate;
                nextName = p.name;
                nextId = p.id;
                break;
            }
        }

        if (!next && prayerList.length > 0) {
            const first = prayerList[0];
            next = parsePrayerDate(first.time, now);
            if (next) {
                next.setDate(next.getDate() + 1);
                nextName = first.name;
                nextId = first.id;
            }
        }

        renderPrayerBlocks(prayerList, nextId);

        if (next) {
            const diff = next - now;
            const hh = String(Math.floor(diff / 3600000)).padStart(2, '0');
            const mm = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
            const ss = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
            if (countdownEl) countdownEl.textContent = `${hh}:${mm}:${ss}`;
            if (nextPrayerEl) nextPrayerEl.textContent = `Menuju ${nextName}`;

            const nextIndex = prayerList.findIndex(p => p.id === nextId);
            if (progressBarEl && nextIndex >= 0 && prayerList.length > 1) {
                const prevPrayer = prayerList[(nextIndex - 1 + prayerList.length) % prayerList.length];
                const prev = parsePrayerDate(prevPrayer.time, now);
                if (prev && prev > now) prev.setDate(prev.getDate() - 1);

                const total = prev ? next - prev : 0;
                const elapsed = prev ? now - prev : 0;
                const pct = total > 0 ? Math.max(0, Math.min(100, (elapsed / total) * 100)) : 0;
                progressBarEl.style.width = `${pct.toFixed(1)}%`;
            }
        }
    }

    tick();
    window._countdown = setInterval(tick, 1000);
}

// ======================
// INIT
// ======================
if (citySelect) {
    const savedCity = localStorage.getItem('maqra-city') || citySelect.value;
    citySelect.value = savedCity;
    loadPrayerTimes(savedCity);
    citySelect.addEventListener('change', () => {
        localStorage.setItem('maqra-city', citySelect.value);
        loadPrayerTimes(citySelect.value);
    });
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('MaQra PWA Ready!', reg))
            .catch(err => console.log('PWA Failed', err));
    });
}
