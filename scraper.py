import requests
import re
import json
import random
import os

# --- إعدادات المحرك ---
SOURCE_URL = "https://iptv-org.github.io/iptv/index.m3u"
OUTPUT_FILE = "database.json" # حفظ في المجلد الرئيسي مباشرة

# الكلمات المفتاحية للقنوات العربية (لترتيب الأولويات)
ARABIC_KEYWORDS = [
    "Jordan", "KSA", "Egypt", "Palestine", "UAE", "Dubai", 
    "Qatar", "Kuwait", "Lebanon", "Iraq", "Morocco", 
    "Tunisia", "Algeria", "Rotana", "MBC", "BeIN", "Sport", "News"
]

# بيانات وهمية ذكية (لإعطاء شعور بالاحترافية)
DESCRIPTIONS = [
    "بث مباشر بجودة عالية - تابع أحدث البرامج.",
    "قناة العائلة العربية - مسلسلات وبرامج ترفيهية.",
    "تغطية إخبارية شاملة على مدار الساعة.",
    "أقوى المباريات والتحليلات الرياضية الحصرية.",
    "أفلام عربية وعالمية مترجمة - سينما في بيتك."
]

PROGRAMS = {
    "Sports": ["استوديو التحليل", "مباراة القمة (مباشر)", "ملخص الأهداف", "صباح الرياضة"],
    "News": ["نشرة الأخبار الرئيسية", "حوار خاص", "الاقتصاد اليوم", "موجز الأنباء"],
    "Movies": ["فيلم السهرة: أكشن", "سينما كلاسيك", "نجوم هوليود", "فيلم عربي حصري"],
    "Kids": ["كرتون الصباح", "مغامرات شيقة", "تعلم ومرح", "أبطال المستقبل"],
    "Default": ["بث مباشر", "برنامج منوع", "فواصل موسيقية", "إعادة"]
}

ICONS = {
    "Sports": "https://img.icons8.com/3d-fluency/94/football-2.png",
    "News": "https://img.icons8.com/3d-fluency/94/news.png",
    "Movies": "https://img.icons8.com/3d-fluency/94/cinema-.png",
    "Kids": "https://img.icons8.com/3d-fluency/94/homer-simpson.png",
    "Religious": "https://img.icons8.com/3d-fluency/94/mosque.png",
    "Default": "https://img.icons8.com/3d-fluency/94/tv.png"
}

def detect_category(name, group):
    n = name.lower()
    g = group.lower() if group else ""
    if re.search(r'(sport|soccer|football|koora|bein|espn)', n) or "sport" in g: return "Sports"
    if re.search(r'(news|jazeera|arabia|cnn|bbc)', n) or "news" in g: return "News"
    if re.search(r'(movie|film|cinema|drama|action)', n) or "movie" in g: return "Movies"
    if re.search(r'(kid|cartoon|disney|spacetoon)', n) or "kids" in g: return "Kids"
    return "Variety"

def is_arabic_priority(name, group):
    combined = (name + " " + group).lower()
    for key in ARABIC_KEYWORDS:
        if key.lower() in combined:
            return True
    return False

def generate_mock_data(category):
    views = random.randint(1500, 85000)
    program = random.choice(PROGRAMS.get(category, PROGRAMS["Default"]))
    desc = random.choice(DESCRIPTIONS)
    return views, program, desc

def main():
    print("🚀 بدء المحرك الذكي...")
    
    try:
        r = requests.get(SOURCE_URL, timeout=45)
        r.text # Trigger download
        
        arabs = []
        others = []
        
        lines = r.text.splitlines()
        current = {}
        
        for line in lines:
            line = line.strip()
            if not line: continue
            
            if line.startswith("#EXTINF:"):
                info = line[8:]
                name = info.split(',')[-1].strip()
                
                logo_m = re.search(r'tvg-logo="([^"]*)"', info)
                logo = logo_m.group(1) if logo_m else ""
                
                group_m = re.search(r'group-title="([^"]*)"', info)
                group = group_m.group(1) if group_m else ""
                
                cat = detect_category(name, group)
                final_logo = logo if logo.startswith('http') else ICONS.get(cat, ICONS["Default"])
                
                views, prog, desc = generate_mock_data(cat)
                is_arab = is_arabic_priority(name, group)
                
                if is_arab: views += 50000 # زيادة المشاهدات للقنوات العربية
                
                current = {
                    "name": name,
                    "logo": final_logo,
                    "category": cat,
                    "is_arabic": is_arab,
                    "views": views,
                    "program": prog,
                    "description": desc
                }
            elif not line.startswith("#") and current:
                current['url'] = line
                if current['is_arabic']:
                    arabs.append(current)
                else:
                    others.append(current)
                current = {}

        # ترتيب حسب الأولوية والمشاهدات
        arabs.sort(key=lambda x: x['views'], reverse=True)
        others.sort(key=lambda x: x['views'], reverse=True)
        
        # دمج القائمتين (العرب أولاً)
        final_list = arabs[:600] + others[:600]
        
        print(f"✅ تم المعالجة: {len(final_list)} قناة (الأولوية للعربية).")
        
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(final_list, f, ensure_ascii=False, indent=2)
            
        print(f"💾 تم الحفظ في Root: {OUTPUT_FILE}")
        
    except Exception as e:
        print(f"❌ خطأ: {e}")

if __name__ == "__main__":
    main()
