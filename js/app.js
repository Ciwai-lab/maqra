const citySelect = document.getElementById('city');
const countdownEl = document.getElementById('countdown');
const nextPrayerEl = document.getElementById('nextPrayer');
const clockEl = document.getElementById('realtime-clock');

const times = {
    imsyak: document.getElementById('imsyak'),
    subuh: document.getElementById('subuh'),
    dzuhur: document.getElementById('dzuhur'),
    ashar: document.getElementById('ashar'),
    maghrib: document.getElementById('maghrib'),
    isya: document.getElementById('isya'),
};

// ======================
// CLOCK REALTIME
// ======================
function updateClock() {
    const now = new Date();
    if (clockEl) {
        clockEl.textContent = now.toLocaleTimeString('id-ID', { hour12: false });
    }
}
setInterval(updateClock, 1000);
updateClock();

// =====================
// Fungsi Tanggal
// =====================
function updateDate() {
    const el = document.getElementById("today-date");
    const now = new Date();

    const options = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    };

    el.textContent = now.toLocaleDateString('id-ID', options);
}

updateDate();

// ======================
// JADWAL SHOLAT (MYQURAN API + FALLBACK)
// ======================
async function loadPrayerTimes(cityId) {
    countdownEl.textContent = '...';
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
            updateUI(t.imsak, t.subuh, t.dzuhur, t.ashar, t.maghrib, t.isya);
            startCountdown({
                Imsak: t.imsak, Fajr: t.subuh, Dhuhr: t.dzuhur,
                Asr: t.ashar, Maghrib: t.maghrib, Isha: t.isya
            });
        } else {
            throw new Error("Data MyQuran kosong");
        }
    } catch (err) {
        console.warn("Switching to Aladhan fallback...");
        const cityName = citySelect.options[citySelect.selectedIndex].text;
        const fallbackUrl = `https://api.aladhan.com/v1/timingsByCity?city=${cityName}&country=Indonesia&method=11`;

        try {
            const resFallback = await fetch(fallbackUrl);
            const dataFallback = await resFallback.json();
            const t = dataFallback.data.timings;
            updateUI(t.Imsak, t.Fajr, t.Dhuhr, t.Asr, t.Maghrib, t.Isha);
            startCountdown(t);
        } catch (fallbackErr) {
            countdownEl.textContent = 'Error Total';
            console.error('Semua API tumbang, bro:', fallbackErr);
        }
    }
}

function updateUI(imsyak, subuh, dzuhur, ashar, maghrib, isya) {
    times.imsyak.textContent = imsyak;
    times.subuh.textContent = subuh;
    times.dzuhur.textContent = dzuhur;
    times.ashar.textContent = ashar;
    times.maghrib.textContent = maghrib;
    times.isya.textContent = isya;
}

// ======================
// COUNTDOWN
// ======================
function startCountdown(t) {
    clearInterval(window._countdown);

    const prayerList = [
        { id: 'imsyak', name: 'Imsyak', time: t.Imsak || t.imsak },
        { id: 'subuh', name: 'Subuh', time: t.Fajr || t.subuh },
        { id: 'dzuhur', name: 'Dzuhur', time: t.Dhuhr || t.dzuhur },
        { id: 'ashar', name: 'Ashar', time: t.Asr || t.ashar },
        { id: 'maghrib', name: 'Maghrib', time: t.Maghrib || t.maghrib },
        { id: 'isya', name: 'Isya', time: t.Isha || t.isya },
    ];

    function tick() {
        const now = new Date();
        let next = null;
        let nextName = '';
        let nextId = '';

        for (let p of prayerList) {
            const [h, m] = p.time.split(':');
            const d = new Date();
            d.setHours(h, m, 0);
            if (d > now) {
                next = d; nextName = p.name; nextId = p.id;
                break;
            }
        }

        if (!next) {
            const [h, m] = prayerList[0].time.split(':');
            next = new Date();
            next.setDate(next.getDate() + 1);
            next.setHours(h, m, 0);
            nextName = prayerList[0].name;
            nextId = prayerList[0].id;
        }

        const diff = next - now;
        const hh = String(Math.floor(diff / 3600000)).padStart(2, '0');
        const mm = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
        const ss = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');

        countdownEl.textContent = `${hh}:${mm}:${ss}`;
        nextPrayerEl.textContent = `Menuju ${nextName}`;

        Object.values(times).forEach(el => el.parentElement.classList.remove('active-prayer'));
        if (times[nextId]) times[nextId].parentElement.classList.add('active-prayer');
    }

    tick();
    window._countdown = setInterval(tick, 1000);
}

// ======================
// LIVE Masjidil Haram (YOUTUBE)
// ======================
const toggleBtn = document.getElementById('toggleLive');
const liveContainer = document.getElementById('liveContainer');

toggleBtn.addEventListener('click', () => {
    liveContainer.classList.toggle('hidden');

    if (liveContainer.dataset.loaded) return;
    liveContainer.dataset.loaded = "true";

    liveContainer.innerHTML = `
    <div style="padding:10px; text-align:center;">
      <p style="font-size:0.8rem; color:#94a3b8; margin-bottom:8px">
        Live mengikuti siaran resmi Masjidil Haram.
      </p>

      <iframe
        loading="lazy"
        width="100%"
        height="240"
        src="https://www.youtube.com/embed/live_stream?channel=UCc3Jj0zK7nLq8lJt7RkX1Vw&mute=1"
        frameborder="0"
        allow="autoplay; encrypted-media"
        allowfullscreen>
      </iframe>

      <p style="font-size:0.75rem; color:#64748b; margin-top:8px">
        Jika live tidak tampil, kemungkinan siaran sedang tidak aktif.
      </p>
    </div>
  `;
    document.getElementById("refreshLive").onclick = () => {
        const iframe = document.getElementById("liveIframe");
        iframe.src = iframe.src;
    };
});

// ======================
// INIT & STORAGE
// ======================
const savedCity = localStorage.getItem('maqra-city') || citySelect.value;
citySelect.value = savedCity;
loadPrayerTimes(savedCity);

citySelect.addEventListener('change', () => {
    localStorage.setItem('maqra-city', citySelect.value);
    loadPrayerTimes(citySelect.value);
});