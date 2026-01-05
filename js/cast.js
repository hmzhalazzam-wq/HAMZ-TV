// HMZH TV - Google Cast Logic

window['__onGCastApiAvailable'] = function (isAvailable) {
    if (isAvailable) {
        initializeCastApi();
    }
};

function initializeCastApi() {
    console.log("📺 Cast API Initializing...");

    const context = cast.framework.CastContext.getInstance();

    context.setOptions({
        receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
    });

    console.log("✅ Cast API Ready.");
}

// Function to start casting a specific stream manually if needed
function castStream(url, type = 'application/x-mpegurl', title = 'Live Stream', image = '') {
    const session = cast.framework.CastContext.getInstance().getCurrentSession();
    if (!session) {
        alert("Please connect to a Cast device first (Click the Icon at top-left).");
        return;
    }

    const mediaInfo = new chrome.cast.media.MediaInfo(url, type);
    mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
    mediaInfo.metadata.title = title;
    mediaInfo.metadata.images = [{ url: image || 'https://img.icons8.com/fluency/96/tv.png' }];

    const request = new chrome.cast.media.LoadRequest(mediaInfo);

    session.loadMedia(request).then(
        () => console.log('📢 Casting started'),
        (e) => console.error('❌ Cast Error', e)
    );
}
