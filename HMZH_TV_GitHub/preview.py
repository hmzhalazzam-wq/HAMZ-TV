import http.server
import socketserver
import webbrowser
import os
import time
import threading

# CONFIG
PORT = 8080
DIRECTORY = "frontend"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def open_browser():
    time.sleep(1.5)
    print(f"🌍 Opening http://localhost:{PORT}")
    webbrowser.open(f"http://localhost:{PORT}")

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"✅ Local Preview Server running at http://localhost:{PORT}")
        print("   (Press Ctrl+C to stop)")
        
        threading.Thread(target=open_browser, daemon=True).start()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped.")

if __name__ == "__main__":
    main()
