// HMZH TV - Ultimate Brain (Root Edition)

let channels = [];
let sleepTimer = null;

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    loadChannels();
    setupTVNavigation();
    setupVoiceSearch();
    setupPanicButton();
    setupSleepTimer();
    initCast();
});

// 1. جلب البيانات من الملف المحلي (الذي ولده السكربت)
async function loadChannels() {
    try {
        const response = await fetch('database.json?t=' + new Date().getTime()); // إضافة الوقت لتجنب الكاش
        if (!response.ok) throw new Error("لم يتم العثور على قاعدة البيانات");
        
        channels = await response.json();
        console.log(`✅ تم تحميل ${channels.length} قناة`);

        // تجهيز القسم المميز (Hero) بأول قناة عربية
        setupHero(channels[0]);

        // تقسيم القنوات إلى أقسام
        renderCategory("🔥 الأكثر مشاهدة", c => c.is_arabic); // العرب أولاً
        renderCategory("⚽ رياضة (Sports)", c => c.category === "Sports");
        renderCategory("📰 أخبار (News)", c => c.category === "News");
        renderCategory("🎬 أفلام (Movies)", c => c.category === "Movies");
        renderCategory("👶 أطفال (Kids)", c => c.category === "Kids");
        
        // إزالة شاشة التحميل
        document.querySelector('.loader-center').style.display = 'none';

    } catch (error) {
        console.error("خطأ:", error);
        document.querySelector('.loader-center').innerHTML = 
            '<p style="color:red">جاري تهيئة النظام لأول مرة... يرجى الانتظار 6 ساعات أو تشغيل التحديث يدوياً.</p>';
    }
}

// إعداد قسم الهيرو
function setupHero(channel) {
    if (!channel) return;
    document.getElementById('hero-title').textContent = channel.name;
    document.getElementById('hero-desc').textContent = channel.description || "بث مباشر بجودة عالية - متوفر الآن على HMZH TV";
    document.querySelector('.hero-section').style.backgroundImage = `linear-gradient(to top, var(--bg-color), transparent), url('${channel.logo}')`;
    
    // تشغيل الهيرو
    window.playHero = () => playChannel(channel);
}

// 2. عرض القنوات (Rendering)
function renderCategory(title, filterFn) {
    const filtered = channels.filter(filterFn).slice(0, 20); // عرض أول 20 قناة فقط للتسريع
    if (filtered.length === 0) return;

    const container = document.getElementById('content-rows');
    
    // عنوان القسم
    const titleEl = document.createElement('h3');
    titleEl.className = 'row-title';
    titleEl.textContent = title;
    container.appendChild(titleEl);

    // الشريط المتحرك
    const slider = document.createElement('div');
    slider.className = 'slider-wrapper';

    filtered.forEach(ch => {
        const card = document.createElement('div');
        card.className = 'card';
        card.tabIndex = 0; // قابل للتركيز عليه بالريموت
        
        card.innerHTML = `
            <img src="${ch.logo}" loading="lazy" onerror="this.src='https://img.icons8.com/fluency/96/tv.png'">
            <div class="card-info">
                <strong>${ch.name}</strong>
                <small>${ch.program || 'بث مباشر'}</small>
            </div>
        `;

        // تشغيل عند النقر
        card.onclick = () => playChannel(ch);
        // تشغيل عند الضغط على Enter (للتلفزيون)
        card.onkeydown = (e) => { if (e.key === 'Enter') playChannel(ch); };

        slider.appendChild(card);
    });

    container.appendChild(slider);
}

// 3. المشغل (Player Logic)
function playChannel(ch) {
    const modal = document.getElementById('player-modal');
    const video = document.getElementById('video-player');
    
    // تحديث البيانات
    document.getElementById('player-channel-name').textContent = ch.name;
    document.getElementById('view-count').textContent = (ch.views || 1000).toLocaleString();
    document.getElementById('like-count').textContent = (ch.likes || 50).toLocaleString();

    modal.classList.remove('hidden');

    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(ch.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = ch.url;
        video.play();
    }

    startAmbilight(video);
}

function closePlayer() {
    const modal = document.getElementById('player-modal');
    const video = document.getElementById('video-player');
    video.pause();
    video.src = "";
    modal.classList.add('hidden');
    stopAmbilight();
}

// 4. التحكم بالتلفاز (TV Remote Navigation)
function setupTVNavigation() {
    document.addEventListener('keydown', (e) => {
        // إذا كان المشغل مفتوحاً، لا تتحكم بالخلفية
        if (!document.getElementById('player-modal').classList.contains('hidden')) {
            if (e.key === 'Escape' || e.key === 'Backspace') closePlayer();
            return;
        }

        const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        if (!navKeys.includes(e.key)) return;

        e.preventDefault();
        
        const focusable = Array.from(document.querySelectorAll('.card, .btn-play, .btn-info, input'));
        const current = document.activeElement;
        const index = focusable.indexOf(current);

        let nextIndex = 0;

        if (index === -1) {
            nextIndex = 0; // التركيز المبدئي
        } else {
            // منطق الحركة
            if (e.key === 'ArrowRight') nextIndex = index - 1; // لليمين (لأن الموقع RTL)
            if (e.key === 'ArrowLeft') nextIndex = index + 1;
            if (e.key === 'ArrowDown') nextIndex = index + 5; // قفز للأسفل
            if (e.key === 'ArrowUp') nextIndex = index - 5;
        }

        // تصحيح الحدود
        if (nextIndex < 0) nextIndex = 0;
        if (nextIndex >= focusable.length) nextIndex = focusable.length - 1;

        focusable[nextIndex].focus();
        focusable[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
}

// 5. زر الرعب (Panic Button)
function setupPanicButton() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // إذا المشغل مغلق، افتح شاشة الإكسل
            if (document.getElementById('player-modal').classList.contains('hidden')) {
                const panic = document.getElementById('panic-overlay');
                panic.classList.toggle('hidden');
                if (!panic.classList.contains('hidden')) {
                    document.title = "Annual Report - Excel"; // تغيير عنوان المتصفح
                } else {
                    document.title = "HMZH TV";
                }
            }
        }
    });
}

// 6. البحث الصوتي (Voice Search)
function setupVoiceSearch() {
    const btn = document.getElementById('voice-btn');
    const input = document.getElementById('search-input');

    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'ar-SA';
        
        btn.onclick = () => {
            btn.style.color = 'red';
            recognition.start();
        };

        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            input.value = text;
            filterChannels(text);
            btn.style.color = '';
        };
    } else {
        btn.style.display = 'none'; // إخفاء الزر إذا المتصفح لا يدعم
    }

    input.addEventListener('input', (e) => filterChannels(e.target.value));
}

function filterChannels(query) {
    const term = query.toLowerCase();
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const name = card.querySelector('strong').textContent.toLowerCase();
        if (name.includes(term)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// 7. مؤقت النوم (Sleep Timer)
function setupSleepTimer() {
    const select = document.getElementById('sleep-timer');
    select.addEventListener('change', () => {
        const mins = parseInt(select.value);
        if (mins > 0) {
            clearTimeout(sleepTimer);
            sleepTimer = setTimeout(() => {
                closePlayer();
                alert("تصبح على خير! 😴 تم إيقاف البث تلقائياً.");
                select.value = "0";
            }, mins * 60 * 1000);
        }
    });
}

// 8. تأثير الإضاءة الخلفية (Ambilight)
let ambiInterval;
function startAmbilight(video) {
    const canvas = document.getElementById('ambilight');
    const ctx = canvas.getContext('2d');
    
    ambiInterval = setInterval(() => {
        if (video.paused || video.ended) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }, 100);
}

function stopAmbilight() {
    clearInterval(ambiInterval);
}

// 9. Google Cast Setup
function initCast() {
    window['__onGCastApiAvailable'] = function(isAvailable) {
        if (isAvailable) {
            cast.framework.CastContext.getInstance().setOptions({
                receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
                autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
            });
        }
    };
}
