const toggleBtn = document.getElementById('toggleLive');
const liveContainer = document.getElementById('liveContainer');

toggleBtn.addEventListener('click', () => {
    liveContainer.classList.toggle('hidden');

    if (!liveContainer.innerHTML) {
        liveContainer.innerHTML = `
      <iframe
        width="100%"
        height="240"
        src="https://www.youtube.com/embed/live_stream?channel=CHANNEL_ID&mute=1"
        frameborder="0"
        allow="autoplay; encrypted-media"
        allowfullscreen>
      </iframe>
    `;
    }
});
