// HMZH TV - The Logic (Repair Edition)

let channels = [];
let heroChannel = null;
let sleepTimeout = null;

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupInputs();
    setupCast();
});

// 1. Fetch Data (Direct Path)
async function loadData() {
    try {
        const res = await fetch('./database.json'); // FIX: Relative Path
        if (!res.ok) throw new Error("DB Error");

        channels = await res.json();
        console.log(`✅ Loaded ${channels.length} channels.`);

        // Setup Hero (Top Priority)
        heroChannel = channels[0];
        document.getElementById('hero-title').textContent = heroChannel.name;
        document.getElementById('hero-desc').textContent = heroChannel.description;

        // Render Rows
        renderRow("🔥 الأكثر مشاهدة (Trending)", c => c.is_arabic);
        renderRow("⚽ رياضة (Sports)", c => c.category === "Sports");
        renderRow("🎬 أفلام (Movies)", c => c.category === "Movies");
        renderRow("📰 أخبار (News)", c => c.category === "News");

        document.querySelector('main div').remove(); // Remove loader

    } catch (e) {
        console.error(e);
        document.querySelector('main').innerHTML = "<h3>⚠️ يرجى انتظار التحديث التلقائي الأول...</h3>";
    }
}

function renderRow(title, filterFn) {
    const list = channels.filter(filterFn).slice(0, 30);
    if (list.length === 0) return;

    const container = document.getElementById('rows-container');

    const section = document.createElement('div');
    section.innerHTML = `<div class="row-title">${title}</div>`;

    const slider = document.createElement('div');
    slider.className = 'slider';

    list.forEach(ch => {
        const card = document.createElement('div');
        card.className = 'card';
        card.tabIndex = 0; // Focusable for TV
        card.innerHTML = `
            <img src="${ch.logo}" onerror="this.src='https://img.icons8.com/3d-fluency/94/tv.png'">
            <div class="card-info">
                <strong>${ch.name}</strong><br>
                <small>${ch.program}</small>
            </div>
        `;

        card.onclick = () => play(ch);
        card.onkeydown = (e) => { if (e.key === 'Enter') play(ch); };

        slider.appendChild(card);
    });

    section.appendChild(slider);
    container.appendChild(section);
}

// 2. Play System
function play(ch) {
    const modal = document.getElementById('player-modal');
    const video = document.getElementById('video');

    modal.classList.remove('hidden');
    document.getElementById('player-title').textContent = ch.name;

    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(ch.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = ch.url;
        video.play();
    }
}

function playHero() {
    if (heroChannel) play(heroChannel);
}

window.closePlayer = function () { // Expose to HTML
    document.getElementById('player-modal').classList.add('hidden');
    document.getElementById('video').pause();
};

// 3. TV Navigation & Features
function setupInputs() {
    // TV Arrow Keys
    document.addEventListener('keydown', (e) => {
        if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            const focusable = Array.from(document.querySelectorAll('.card, button, input'));
            const idx = focusable.indexOf(document.activeElement);

            if (idx === -1) {
                focusable[0].focus();
                return;
            }

            let nextIdx = idx;
            if (e.key === 'ArrowLeft') nextIdx = idx + 1; // RTL logic
            if (e.key === 'ArrowRight') nextIdx = idx - 1;
            if (e.key === 'ArrowDown') nextIdx = idx + 5; // Jump row

            if (nextIdx >= 0 && nextIdx < focusable.length) {
                focusable[nextIdx].focus();
                e.preventDefault();
            }
        }

        // Panic Button (ESC)
        if (e.key === 'Escape') {
            document.getElementById('panic-overlay').classList.toggle('hidden');
            closePlayer(); // Mute video
        }
    });

    // Sleep Timer
    document.getElementById('sleep-timer').addEventListener('change', (e) => {
        clearTimeout(sleepTimeout);
        const mins = parseInt(e.target.value);
        if (mins > 0) {
            sleepTimeout = setTimeout(() => {
                closePlayer();
                alert("Sleep Timer: TV Off.");
            }, mins * 60 * 1000);
        }
    });
}

// 4. Google Cast
function setupCast() {
    window['__onGCastApiAvailable'] = function (isAvailable) {
        if (isAvailable) {
            cast.framework.CastContext.getInstance().setOptions({
                receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
                autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
            });
        }
    };
}
