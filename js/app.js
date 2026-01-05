// HMZH TV Cloud - The Hybrid Core

let allChannels = [];
let deferredPrompt;

document.addEventListener('DOMContentLoaded', () => {
    loadDB();
    setupIdleMode();

    // PWA Install Logic
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const btn = document.getElementById('install-btn');
        if (btn) {
            btn.classList.remove('hidden');
            btn.onclick = () => {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choice) => {
                    console.log('User choice:', choice.outcome);
                    deferredPrompt = null;
                    btn.classList.add('hidden');
                });
            };
        }
    });

    document.getElementById('search').addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        render(allChannels.filter(c => c.name.toLowerCase().includes(q)));
    });
});

async function loadDB() {
    const grid = document.getElementById('grid');

    try {
        // Plan A: Local DB
        const res = await fetch('database.json');
        if (!res.ok) throw new Error("DB not found");
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error("DB Empty");

        console.log("✅ Plan A: Cloud DB Loaded");
        allChannels = data;
        render(allChannels);
    } catch (e) {
        console.warn("⚠️ Plan A Failed. Engaging Hybrid Core (Plan B)...", e);
        grid.innerHTML = '<div class="loader">⚡ Engaging Browser Scraper...</div>';
        await fallbackScrape();
    }
}

// Plan B: Client-Side Spider
async function fallbackScrape() {
    try {
        const SOURCE = "https://iptv-org.github.io/iptv/index.m3u";
        const res = await fetch(SOURCE);
        if (!res.ok) throw new Error("Source Dead");
        const text = await res.text();

        const lines = text.split('\n');
        allChannels = [];
        let clean = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith("#EXTINF:")) {
                const info = line.substring(8);
                const logoMatch = info.match(/tvg-logo="([^"]*)"/);
                const groupMatch = info.match(/group-title="([^"]*)"/);
                const name = info.split(',').pop().trim();

                const logo = (logoMatch) ? logoMatch[1] : "";
                const group = (groupMatch) ? groupMatch[1] : "";

                if (lines[i + 1] && lines[i + 1].startsWith('http')) {
                    i++;
                    const url = lines[i].trim();

                    const cat = detectCategory(name, group);
                    const finalLogo = getIcon(logo, cat);

                    clean.push({ name, url, logo: finalLogo, category: cat });
                }
            }
        }

        console.log(`✅ Plan B Success: ${clean.length} Channels Scraped in Browser.`);
        allChannels = clean;
        render(allChannels);

    } catch (err) {
        document.getElementById('grid').innerHTML = '<div style="color:red; padding:20px">❌ Complete System Failure. Check Internet.</div>';
    }
}

function detectCategory(name, group) {
    const n = name.toLowerCase();
    const g = group ? group.toLowerCase() : "";
    if (n.match(/(sport|soccer|football|koora|bein|espn)/) || g.includes('sport')) return "Sports";
    if (n.match(/(news|jazeera|arabia|cnn|bbc)/) || g.includes('news')) return "News";
    if (n.match(/(movie|film|cinema|drama|action)/) || g.includes('movie')) return "Movies";
    if (n.match(/(kid|cartoon|disney|spacetoon)/) || g.includes('kids')) return "Kids";
    if (n.match(/(quran|sunnah|iqra)/)) return "Religious";
    return "Channel";
}

function getIcon(logo, cat) {
    if (logo && logo.startsWith('http')) return logo;
    const icons = {
        "Sports": "https://img.icons8.com/color/96/football2--v1.png",
        "News": "https://img.icons8.com/color/96/news.png",
        "Movies": "https://img.icons8.com/color/96/cinema-.png",
        "Kids": "https://img.icons8.com/color/96/homer-simpson.png",
        "Religious": "https://img.icons8.com/color/96/mosque.png",
        "Default": "https://img.icons8.com/fluency/96/tv.png"
    };
    return icons[cat] || icons["Default"];
}

// Progressive Rendering System (Fixes Lag)
let renderQueue = [];
let isRendering = false;

function render(list) {
    const grid = document.getElementById('grid');
    grid.innerHTML = ''; // Clear existing
    renderQueue = [...list]; // Clone list to queue

    if (!isRendering) {
        requestAnimationFrame(processQueue);
    }
}

function processQueue() {
    const grid = document.getElementById('grid');
    if (renderQueue.length === 0) {
        isRendering = false;
        return;
    }

    isRendering = true;
    const fragment = document.createDocumentFragment();
    const BATCH_SIZE = 40; // Render 40 items per frame (60fps target)

    const batch = renderQueue.splice(0, BATCH_SIZE);

    batch.forEach(ch => {
        const el = document.createElement('div');
        el.className = 'card';
        el.tabIndex = 0;

        // Lazy Load Images for speed
        el.innerHTML = `
            <img loading="lazy" src="${ch.logo}" onerror="this.src='https://img.icons8.com/fluency/96/tv.png'">
            <div class="title">${ch.name}</div>
        `;

        el.onclick = () => play(ch);
        el.onkeydown = (e) => { if (e.key === 'Enter') play(ch); };

        fragment.appendChild(el);
    });

    grid.appendChild(fragment);

    // Continue next frame
    requestAnimationFrame(processQueue);
}

function filter(cat) {
    const btns = document.querySelectorAll('.cat-btn');
    btns.forEach(b => b.classList.remove('active'));
    event.target.classList.add('active'); // simplified handle

    // Optimistic UI update
    document.getElementById('grid').innerHTML = '<div class="loader">Filtering...</div>';

    // Small delay to allow UI to show loader before blocking work
    setTimeout(() => {
        if (cat === 'All') render(allChannels);
        else render(allChannels.filter(c => c.category === cat));
    }, 10);
}


function play(ch) {
    const container = document.getElementById('player-container');
    const video = document.getElementById('video');
    const title = document.getElementById('channel-name');
    container.classList.remove('hidden');
    title.textContent = ch.name;
    video.scrollIntoView();
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

function closePlayer() {
    const container = document.getElementById('player-container');
    const video = document.getElementById('video');
    container.classList.add('hidden');
    video.pause();
    video.src = "";
}

// Cinematic Idle Mode
let idleTimer;
function setupIdleMode() {
    const body = document.body;
    document.addEventListener('mousemove', () => {
        body.classList.remove('idle-active');
        clearTimeout(idleTimer);
        // Only verify idle if player is open
        if (!document.getElementById('player-container').classList.contains('hidden')) {
            idleTimer = setTimeout(() => {
                body.classList.add('idle-active');
            }, 3000);
        }
    });
    // Initial trigger
    document.dispatchEvent(new Event('mousemove'));
}
