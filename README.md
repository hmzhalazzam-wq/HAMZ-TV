# HMZH TV - Cloud Edition ☁️

## خطوات الرفع إلى GitHub (How to Deploy)

لكي يعمل هذا المشروع بشكل تلقائي (Automatic)، يجب عليك رفعه إلى GitHub.

### 1. إنشاء المستودع (Create Repo)

1. اذهب إلى [GitHub.com](https://github.com/new).
2. أنشئ مستودعاً جديداً (New Repository) باسم `HAMZ-TV`.
3. اختر **Public**.

### 2. رفع الملفات (Upload Files)

يمكنك رفع الملفات يدوياً أو عبر Git:

1. داخل هذا المجلد (`HMZH_TV_GitHub`)، افتح الطرفية (Terminal).
2. اكتب الأوامر التالية:

   ```bash
   git init
   git add .
   git commit -m "First Launch"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/HAMZ-TV.git
   git push -u origin main
   ```

### 3. تفعيل GitHub Pages (تفعيل الموقع)

1. اذهب إلى **Settings** > **Pages** في مستودعك على GitHub.
2. في قسم **Branch**، اختر `main` واضغط **Save**.
3. انتظر قليلاً، وسيظهر لك رابط موقعك (مثلاً: `https://username.github.io/HAMZ-TV`).

### 4. تفعيل البوت (The Robot)

1. اذهب إلى تبويب **Actions** في GitHub.
2. سترى عملية تسمى `Update Channels`.
3. ستعمل تلقائياً كل 6 ساعات. يمكنك تشغيلها يدوياً بالضغط على زر **Run workflow**.

---
**مبروك!** لديك الآن منصة IPTV عالمية تعمل بدون خادم (Serverless).
