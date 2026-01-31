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
// JADWAL SHOLAT (MYQURAN + FALLBACK)
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
            throw new Error("Data MyQuran not found");
        }
    } catch (err) {
        console.warn("Switching to Aladhan fallback...");
        const cityName = citySelect.options[citySelect.selectedIndex].text;
        const fallbackUrl = `https://api.aladhan.com/v1/timingsByCity?city=${cityName}&country=Indonesia&method=11`;

        try {
            const resFB = await fetch(fallbackUrl);
            const dataFB = await resFB.json();
            const t = dataFB.data.timings;
            updateUI(t.Imsak, t.Fajr, t.Dhuhr, t.Asr, t.Maghrib, t.Isha);
            startCountdown(t);
        } catch (fbErr) {
            countdownEl.textContent = 'Error';
            console.error('Semua API tumbang:', fbErr);
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
function startCountdown(timings) {
    clearInterval(window._countdown);

    function tick() {
        const now = new Date();
        const prayerList = [
            { id: 'imsyak', name: 'Imsyak', time: timings.Imsak || timings.imsak },
            { id: 'subuh', name: 'Subuh', time: timings.Fajr || timings.subuh },
            { id: 'dzuhur', name: 'Dzuhur', time: timings.Dhuhr || timings.dzuhur },
            { id: 'ashar', name: 'Ashar', time: timings.Asr || timings.ashar },
            { id: 'maghrib', name: 'Maghrib', time: timings.Maghrib || timings.maghrib },
            { id: 'isya', name: 'Isya', time: timings.Isha || timings.isya },
        ];

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
// LIVE & INIT
// ======================
const toggleBtn = document.getElementById('toggleLive');
const liveContainer = document.getElementById('liveContainer');

toggleBtn.addEventListener('click', () => {
    liveContainer.classList.toggle('hidden');
    if (!liveContainer.innerHTML) {
        liveContainer.innerHTML = `<iframe width="100%" height="240" src="https://www.youtube.com/embed/live_stream?channel=UC9k-yiEpRHMNVOnOi_aQK8w&mute=1" frameborder="0" allowfullscreen></iframe>`;
    }
});

const savedCity = localStorage.getItem('maqra-city') || citySelect.value;
citySelect.value = savedCity;
loadPrayerTimes(savedCity);

citySelect.addEventListener('change', () => {
    localStorage.setItem('maqra-city', citySelect.value);
    loadPrayerTimes(citySelect.value);
});