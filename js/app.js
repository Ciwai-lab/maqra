const citySelect = document.getElementById('city');
const countdownEl = document.getElementById('countdown');
const nextPrayerEl = document.getElementById('nextPrayer');

const times = {
    imsyak: document.getElementById('imsyak'),
    subuh: document.getElementById('subuh'),
    dzuhur: document.getElementById('dzuhur'),
    ashar: document.getElementById('ashar'),
    maghrib: document.getElementById('maghrib'),
    isya: document.getElementById('isya'),
};

// ======================
// INIT & STORAGE
// ======================
const savedCity = localStorage.getItem('maqra-city');
if (savedCity) {
    citySelect.value = savedCity;
}

loadPrayerTimes(citySelect.value);

citySelect.addEventListener('change', () => {
    localStorage.setItem('maqra-city', citySelect.value);
    loadPrayerTimes(citySelect.value);
});

// ======================
// JADWAL SHOLAT (MYQURAN API)
// ======================
async function loadPrayerTimes(cityId) {
    countdownEl.textContent = 'Memuat...';

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');

    // API MyQuran: /sholat/jadwal/{id_kota}/{y}/{m}/{d}
    const url = `https://api.myquran.com/v2/sholat/jadwal/${cityId}/${y}/${m}/${d}`;

    try {
        const res = await fetch(url);
        const json = await res.json();
        const t = json.data.jadwal;

        // Update UI
        times.imsyak.textContent = t.imsak;
        times.subuh.textContent = t.subuh;
        times.dzuhur.textContent = t.dzuhur;
        times.ashar.textContent = t.ashar;
        times.maghrib.textContent = t.maghrib;
        times.isya.textContent = t.isya;

        startCountdown(t);
    } catch (err) {
        countdownEl.textContent = 'Error';
        console.error('API Error:', err);
    }
}

// ======================
// COUNTDOWN & HIGHLIGHT
// ======================
function startCountdown(t) {
    clearInterval(window._countdown);

    const prayerList = [
        { id: 'imsyak', name: 'Imsyak', time: t.imsak },
        { id: 'subuh', name: 'Subuh', time: t.subuh },
        { id: 'dzuhur', name: 'Dzuhur', time: t.dzuhur },
        { id: 'ashar', name: 'Ashar', time: t.ashar },
        { id: 'maghrib', name: 'Maghrib', time: t.maghrib },
        { id: 'isya', name: 'Isya', time: t.isya },
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
                next = d;
                nextName = p.name;
                nextId = p.id;
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

        // Highlight Active
        Object.values(times).forEach(el => el.parentElement.classList.remove('active-prayer'));
        if (times[nextId]) times[nextId].parentElement.classList.add('active-prayer');
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
        liveContainer.innerHTML = `<iframe width="100%" height="240" src="https://www.youtube.com/embed/live_stream?channel=UC9k-yiEpRHMNVOnOi_aQK8w&mute=1&autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    }
});