import requests
import re
import json
import random
import os

# --- إعدادات المحرك ---
SOURCE_URL = "https://iptv-org.github.io/iptv/index.m3u"
OUTPUT_FILE = "database.json" # حفظ الملف في المجلد الرئيسي مباشرة

# الكلمات المفتاحية لترتيب القنوات العربية في المقدمة
ARABIC_KEYWORDS = [
    "Jordan", "KSA", "Egypt", "Palestine", "UAE", "Dubai", 
    "Qatar", "Kuwait", "Lebanon", "Iraq", "Morocco", 
    "Tunisia", "Algeria", "Rotana", "MBC", "BeIN", "Sport", "News", "Syria"
]

# أيقونات احتياطية عالية الجودة في حال عدم توفر شعار للقناة
ICONS = {
    "Sports": "https://img.icons8.com/3d-fluency/94/football-2.png",
    "News": "https://img.icons8.com/3d-fluency/94/news.png",
    "Movies": "https://img.icons8.com/3d-fluency/94/cinema-.png",
    "Kids": "https://img.icons8.com/3d-fluency/94/homer-simpson.png",
    "Religious": "https://img.icons8.com/3d-fluency/94/mosque.png",
    "Default": "https://img.icons8.com/3d-fluency/94/tv.png"
}

# بيانات وهمية "ذكية" لجدول البرامج
PROGRAMS = {
    "Sports": ["استوديو التحليل", "مباراة القمة (مباشر)", "ملخص الأهداف", "صباح الرياضة", "الدوري المشتعل"],
    "News": ["نشرة الأخبار الرئيسية", "حوار خاص", "الاقتصاد اليوم", "موجز الأنباء", "تغطية خاصة"],
    "Movies": ["فيلم السهرة: أكشن", "سينما كلاسيك", "نجوم هوليود", "فيلم عربي حصري", "عرض أول"],
    "Kids": ["كرتون الصباح", "مغامرات شيقة", "تعلم ومرح", "أبطال المستقبل", "حكايات قبل النوم"],
    "Default": ["بث مباشر", "برنامج منوع", "فواصل موسيقية", "إعادة", "جولة الكاميرا"]
}

DESCRIPTIONS = [
    "بث مباشر بجودة عالية - تابع أحدث البرامج.",
    "قناة العائلة العربية - مسلسلات وبرامج ترفيهية.",
    "تغطية إخبارية شاملة على مدار الساعة.",
    "أقوى المباريات والتحليلات الرياضية الحصرية.",
    "أفلام عربية وعالمية مترجمة - سينما في بيتك."
]

def detect_category(name, group):
    n = name.lower()
    g = group.lower() if group else ""
    if re.search(r'(sport|soccer|football|koora|bein|espn)', n) or "sport" in g: return "Sports"
    if re.search(r'(news|jazeera|arabia|cnn|bbc)', n) or "news" in g: return "News"
    if re.search(r'(movie|film|cinema|drama|action)', n) or "movie" in g: return "Movies"
    if re.search(r'(kid|cartoon|disney|spacetoon)', n) or "kids" in g: return "Kids"
    if re.search(r'(quran|sunnah|iqra)', n): return "Religious"
    return "Variety"

def is_arabic_priority(name, group):
    combined = (name + " " + group).lower()
    for key in ARABIC_KEYWORDS:
        if key.lower() in combined:
            return True
    return False

def generate_mock_data(category):
    # توليد مشاهدات وهمية تبدو حقيقية (عالية للرياضة والأخبار)
    base_views = 50000 if category in ["Sports", "News"] else 5000
    views = random.randint(base_views, base_views * 5)
    
    program = random.choice(PROGRAMS.get(category, PROGRAMS["Default"]))
    desc = random.choice(DESCRIPTIONS)
    likes = random.randint(100, 5000)
    
    return views, program, desc, likes

def main():
    print("🚀 بدء المحرك الذكي...")
    
    try:
        print(f"📡 جاري الاتصال بالمصدر: {SOURCE_URL}")
        r = requests.get(SOURCE_URL, timeout=45)
        r.raise_for_status()
        
        arabs = []
        others = []
        seen_names = set()
        
        lines = r.text.splitlines()
        current = {}
        
        for line in lines:
            line = line.strip()
            if not line: continue
            
            if line.startswith("#EXTINF:"):
                info = line[8:]
                
                # استخراج الاسم
                name_parts = info.split(',')
                name = name_parts[-1].strip()
                
                # منع التكرار
                if name in seen_names: continue
                seen_names.add(name)
                
                # استخراج الشعار
                logo_m = re.search(r'tvg-logo="([^"]*)"', info)
                logo = logo_m.group(1) if logo_m else ""
                
                # استخراج المجموعة
                group_m = re.search(r'group-title="([^"]*)"', info)
                group = group_m.group(1) if group_m else ""
                
                # التصنيف والذكاء الاصطناعي
                cat = detect_category(name, group)
                
                # إصلاح الشعار المفقود
                final_logo = logo if logo.startswith('http') else ICONS.get(cat, ICONS["Default"])
                
                # توليد البيانات الوهمية
                views, prog, desc, likes = generate_mock_data(cat)
                
                # فحص هل القناة عربية؟
                is_arab = is_arabic_priority(name, group)
                if is_arab:
                    views += 100000 # دفعة قوية للقنوات العربية لتظهر في "الأكثر مشاهدة"
                
                current = {
                    "name": name,
                    "logo": final_logo,
                    "category": cat,
                    "group": group,
                    "is_arabic": is_arab,
                    "views": views,
                    "likes": likes,
                    "program": prog,
                    "description": desc
                }
                
            elif not line.startswith("#") and current:
                url = line
                # فلترة الروابط: نفضل HTTPS ليعمل على GitHub Pages
                if url.startswith('http'):
                    current['url'] = url
                    
                    if current['is_arabic']:
                        arabs.append(current)
                    else:
                        others.append(current)
                
                current = {}

        # الترتيب حسب المشاهدات (الوهمية)
        arabs.sort(key=lambda x: x['views'], reverse=True)
        others.sort(key=lambda x: x['views'], reverse=True)
        
        # دمج القائمتين: العرب أولاً (أول 800 قناة عربية + أول 400 قناة عالمية)
        final_list = arabs[:800] + others[:400]
        
        print(f"✅ تم المعالجة: {len(final_list)} قناة (الأولوية للعربية).")
        
        # الحفظ
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(final_list, f, ensure_ascii=False, indent=2)
            
        print(f"💾 تم حفظ قاعدة البيانات في: {OUTPUT_FILE}")
        
    except Exception as e:
        print(f"❌ خطأ فادح: {e}")
        exit(1)

if __name__ == "__main__":
    main()
