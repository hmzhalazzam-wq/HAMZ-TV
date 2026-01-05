import requests
import re
import json
import os

# CONFIG
SOURCE_URL = "https://iptv-org.github.io/iptv/index.m3u"
# Output to Frontend Directory for GitHub Pages
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend', 'database.json')

# Smart AI Icons
ICONS = {
    "Sports": "https://img.icons8.com/color/96/football2--v1.png",
    "News": "https://img.icons8.com/color/96/news.png",
    "Movies": "https://img.icons8.com/color/96/cinema-.png",
    "Kids": "https://img.icons8.com/color/96/homer-simpson.png",
    "Religious": "https://img.icons8.com/color/96/mosque.png",
    "Default": "https://img.icons8.com/fluency/96/tv.png"
}

def detect_category(name, group):
    n = name.lower()
    g = group.lower() if group else ""
    if re.search(r'(sport|soccer|football|koora|bein|espn)', n) or "sport" in g: return "Sports"
    if re.search(r'(news|jazeera|arabia|cnn|bbc)', n) or "news" in g: return "News"
    if re.search(r'(movie|film|cinema|drama|action)', n) or "movie" in g: return "Movies"
    if re.search(r'(kid|cartoon|disney|spacetoon)', n) or "kids" in g: return "Kids"
    if re.search(r'(quran|sunnah|iqra)', n): return "Religious"
    return "Channel" # General catch-all

def get_icon(logo, cat):
    if logo and logo.startswith('http'): return logo
    return ICONS.get(cat, ICONS["Default"])

def main():
    print("🚀 Auto-Scraper Started...")
    try:
        r = requests.get(SOURCE_URL, timeout=30)
        r.raise_for_status()
        
        channels = []
        lines = r.text.splitlines()
        current = {}
        
        for line in lines:
            line = line.strip()
            if not line: continue
            
            if line.startswith("#EXTINF:"):
                # Parse Info
                info = line[8:]
                logo_m = re.search(r'tvg-logo="([^"]*)"', info)
                logo = logo_m.group(1) if logo_m else ""
                
                group_m = re.search(r'group-title="([^"]*)"', info)
                group = group_m.group(1) if group_m else ""
                
                name = info.split(',')[-1].strip()
                
                # Logic
                cat = detect_category(name, group)
                final_icon = get_icon(logo, cat)
                
                current = {
                    "name": name,
                    "logo": final_icon,
                    "category": cat
                }
            elif not line.startswith("#") and current:
                current['url'] = line
                channels.append(current)
                current = {}
                
        print(f"✅ Extracted {len(channels)} channels.")
        
        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(channels, f, ensure_ascii=False, indent=2)
            
        print(f"💾 Saved to {OUTPUT_FILE}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        exit(1) # Fail action if error

if __name__ == "__main__":
    main()
