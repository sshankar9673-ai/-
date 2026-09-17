import http.server
import socketserver
import json
import os
import io

PORT = 8000
DB_FILE = 'database.json'

# Initialize database if not exists
if not os.path.exists(DB_FILE):
    with open(DB_FILE, 'w') as f:
        json.dump({"w2_users": []}, f)

class SimpleHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for local testing from different devices
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/data':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            try:
                with open(DB_FILE, 'rb') as f:
                    self.wfile.write(f.read())
            except Exception as e:
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            return http.server.SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        if self.path == '/api/data':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                # Validate JSON before writing
                data = json.loads(post_data.decode('utf-8'))
                
                current_db = {}
                if os.path.exists(DB_FILE):
                    try:
                        with open(DB_FILE, 'r', encoding='utf-8') as f:
                            current_db = json.load(f)
                    except:
                        pass
                
                for k, v in data.items():
                    current_db[k] = v
                
                with open(DB_FILE, 'w', encoding='utf-8') as f:
                    json.dump(current_db, f, ensure_ascii=False, indent=4)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success"}).encode())
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()

Handler = SimpleHTTPRequestHandler

print(f"Server is running on port {PORT}")
print(f"You can now access your site locally at http://localhost:{PORT}")
print(f"From other phones/devices on WiFi, use your computer's IP address (e.g., http://192.168.1.100:{PORT})")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
