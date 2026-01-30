const citySelect = document.getElementById('city');

const times = {
    subuh: document.getElementById('subuh'),
    dzuhur: document.getElementById('dzuhur'),
    ashar: document.getElementById('ashar'),
    maghrib: document.getElementById('maghrib'),
    isya: document.getElementById('isya'),
};

const countdownEl = document.getElementById('countdown');

// ======================
// JADWAL SHOLAT (REAL)
// ======================
async function loadPrayerTimes(city) {
    const url = `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=Indonesia&method=11`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        const t = data.data.timings;

        times.subuh.textContent = t.Fajr;
        times.dzuhur.textContent = t.Dhuhr;
        times.ashar.textContent = t.Asr;
        times.maghrib.textContent = t.Maghrib;
        times.isya.textContent = t.Isha;

        startCountdown(t);
    } catch (err) {
        console.error('Gagal load jadwal sholat', err);
    }
}

// ======================
// COUNTDOWN
// ======================
function startCountdown(timings) {
    clearInterval(window._countdown);

    function tick() {
        const now = new Date();
        const prayers = [
            timings.Fajr,
            timings.Dhuhr,
            timings.Asr,
            timings.Maghrib,
            timings.Isha,
        ];

        let nextTime = null;

        for (let time of prayers) {
            const [h, m] = time.split(':');
            const d = new Date();
            d.setHours(h, m, 0);

            if (d > now) {
                nextTime = d;
                break;
            }
        }

        if (!nextTime) {
            const [h, m] = prayers[0].split(':');
            nextTime = new Date();
            nextTime.setDate(nextTime.getDate() + 1);
            nextTime.setHours(h, m, 0);
        }

        const diff = nextTime - now;
        const hh = String(Math.floor(diff / 3600000)).padStart(2, '0');
        const mm = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
        const ss = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');

        countdownEl.textContent = `${hh}:${mm}:${ss}`;
    }

    tick();
    window._countdown = setInterval(tick, 1000);
}

// ======================
// LIVE MASJIDIL HARAM
// ======================
const toggleBtn = document.getElementById('toggleLive');
const liveContainer = document.getElementById('liveContainer');

toggleBtn.addEventListener('click', () => {
    liveContainer.classList.toggle('hidden');

    if (!liveContainer.innerHTML) {
        liveContainer.innerHTML = `
      <iframe
        width="100%"
        height="240"
        src="https://www.youtube.com/embed/live_stream?channel=UC9k-yiEpRHMNVOnOi_aQK8w&mute=1"
        frameborder="0"
        allow="autoplay; encrypted-media"
        allowfullscreen>
      </iframe>
    `;
    }
});

// ======================
// INIT
// ======================
loadPrayerTimes(citySelect.value);

citySelect.addEventListener('change', () => {
    loadPrayerTimes(citySelect.value);
});
