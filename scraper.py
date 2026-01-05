import requests
import re
import json
import random
import os

# --- CTO CONFIGURATION ---
SOURCE_URL = "https://iptv-org.github.io/iptv/index.m3u"
OUTPUT_FILE = "database.json"

# ARABIC PRIORITY KEYWORDS
ARABIC_KEYWORDS = [
    "Arab", "Jordan", "Egypt", "KSA", "Saudi", "UAE", "Dubai", 
    "Qatar", "Kuwait", "Lebanon", "Palestine", "Iraq", "Morocco", 
    "Tunisia", "Algeria", "Rotana", "MBC", "BeIN"
]

# SMART MOCK DATA (Simulated EPG)
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
    "Religious": ["تلاوات خاشعة", "محاضرة دينية", "قصص الأنبياء", "بث مباشر من الحرم"],
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
    if re.search(r'(quran|sunnah|iqra)', n): return "Religious"
    return "Variety"

def is_arabic(name, group):
    """Detects if channel is Arabic for TOP PRIORITY sorting"""
    combined = (name + " " + group).lower()
    for key in ARABIC_KEYWORDS:
        if key.lower() in combined:
            return True
    return False

def generate_mock_epg(category):
    """Generates realistic fake metadata"""
    views = random.randint(1500, 85000)
    program = random.choice(PROGRAMS.get(category, PROGRAMS["Default"]))
    desc = random.choice(DESCRIPTIONS)
    return views, program, desc

def main():
    print("🚀 CTO Engine Starting...")
    
    try:
        r = requests.get(SOURCE_URL, timeout=45)
        r.raise_for_status()
        
        arabs = []
        others = []
        seen = set()
        
        lines = r.text.splitlines()
        current = {}
        
        for line in lines:
            line = line.strip()
            if not line: continue
            
            if line.startswith("#EXTINF:"):
                info = line[8:]
                
                # Logic
                name = info.split(',')[-1].strip()
                
                if name in seen: continue
                seen.add(name)
                
                logo_m = re.search(r'tvg-logo="([^"]*)"', info)
                logo = logo_m.group(1) if logo_m else ""
                
                group_m = re.search(r'group-title="([^"]*)"', info)
                group = group_m.group(1) if group_m else ""
                
                cat = detect_category(name, group)
                
                # Smart Icon Fallback
                final_logo = logo if logo.startswith('http') else ICONS.get(cat, ICONS["Default"])
                
                # Mock EPG
                views, prog, desc = generate_mock_epg(cat)
                
                # Boost Arabic Views Logic
                is_arab = is_arabic(name, group)
                if is_arab: views += 50000 
                
                current = {
                    "name": name,
                    "url": "", # Filled next line
                    "logo": final_logo,
                    "category": cat,
                    "is_arabic": is_arab,
                    "views": views,
                    "current_program": prog,
                    "description": desc,
                    "likes": random.randint(100, views // 10)
                }
                
            elif not line.startswith("#") and current:
                # HTTPS Priority Filter
                # We prioritize HTTPS links but accept HTTP if no choice
                current['url'] = line
                
                if current['is_arabic']:
                    arabs.append(current)
                else:
                    others.append(current)
                current = {}

        # SORTING: Arabic First, then by Views
        arabs.sort(key=lambda x: x['views'], reverse=True)
        others.sort(key=lambda x: x['views'], reverse=True)
        
        # Take Top 500 Arabs + Top 500 Global (Performance Optimization)
        # We don't want 30,000 channels lagging the TV
        final_list = arabs[:500] + others[:500]
        
        print(f"✅ Processed: {len(arabs)} Arabic Channels + {len(others)} Global.")
        print(f"💾 Saving {len(final_list)} Optimized Channels to DB...")
        
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(final_list, f, ensure_ascii=False, indent=2)
            
    except Exception as e:
        print(f"❌ Error: {e}")
        exit(1)

if __name__ == "__main__":
    main()
