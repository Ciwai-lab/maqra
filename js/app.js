const citySelect = document.getElementById('city');

const times = {
    imsyak: document.getElementById('imsyak'),
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

        times.imsyak.textContent = t.Imsak;
        times.subuh.textContent = t.Fajr;
        times.dzuhur.textContent = t.Dhuhr;
        times.ashar.textContent = t.Asr;
        times.maghrib.textContent = t.Maghrib;
        times.isya.textContent = t.Isha;

        startCountdown(t);
    } catch (err) {
        countdownEl.textContent = '--:--:--';
        console.error('Gagal load jadwal sholat');
    }
}

// ======================
// COUNTDOWN
// ======================
function startCountdown(timings) {
    clearInterval(window._countdown);

    function tick() {
        const now = new Date();
        const prayerList = [
            { name: 'Imsyak', time: timings.Imsak },
            { name: 'Subuh', time: timings.Fajr },
            { name: 'Dzuhur', time: timings.Dhuhr },
            { name: 'Ashar', time: timings.Asr },
            { name: 'Maghrib', time: timings.Maghrib },
            { name: 'Isya', time: timings.Isha },
        ];

        let next = null;
        let nextName = '';

        for (let p of prayerList) {
            const [h, m] = p.time.split(':');
            const d = new Date();
            d.setHours(h, m, 0);

            if (d > now) {
                next = d;
                nextName = p.name;
                break;
            }
        }

        if (!next) {
            const [h, m] = prayerList[0].time.split(':');
            next = new Date();
            next.setDate(next.getDate() + 1);
            next.setHours(h, m, 0);
            nextName = prayerList[0].name;
        }

        const diff = next - now;
        const hh = String(Math.floor(diff / 3600000)).padStart(2, '0');
        const mm = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
        const ss = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');

        countdownEl.textContent = `${hh}:${mm}:${ss}`;

        document.getElementById('nextPrayer').textContent =
            `Menuju ${nextName}`;
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

// load last city
const savedCity = localStorage.getItem('maqra-city');
if (savedCity) {
    citySelect.value = savedCity;
}

// save on change
citySelect.addEventListener('change', () => {
    localStorage.setItem('maqra-city', citySelect.value);
    loadPrayerTimes(citySelect.value);
});

