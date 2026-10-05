import os
import sys
import subprocess
import time
import signal
import webbrowser
from urllib.request import urlopen, Request

STANDALONE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(STANDALONE_DIR, 'backend')
FRONTEND_DIR = os.path.join(STANDALONE_DIR, 'frontend')
UPLOADS_DIR = os.path.join(STANDALONE_DIR, 'uploads')
DATA_DIR = os.path.join(STANDALONE_DIR, 'data')

def log(tag, msg):
    print(f"[{tag}] {msg}")

def check_node():
    try:
        res = subprocess.run(["node", "--version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        return res.returncode == 0
    except Exception:
        return False

def wait_for_url(url, timeout=25, interval=0.5):
    start = time.time()
    while time.time() - start < timeout:
        try:
            req = Request(url, headers={'User-Agent': 'SkillWorth-HealthCheck'})
            with urlopen(req, timeout=1.5) as res:
                if res.status in (200, 304):
                    return True
        except Exception:
            pass
        time.sleep(interval)
    return False

def main():
    print("=" * 65)
    print("  SKILLWORTH ? RECOGNITION OF PRIOR LEARNING PLATFORM")
    print("  Master Application Launcher (app.py)")
    print(f"  Project Root: {STANDALONE_DIR}")
    print("=" * 65)

    # 1. Environment & Directories
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)
    log("INIT", "Dedicated storage directories confirmed (/uploads, /data).")

    if not check_node():
        log("ERROR", "Node.js is not found in PATH. Please install Node.js (v18+).")
        sys.exit(1)

    # 2. Check Database initialization
    db_script = "const db = require('./database/skillworthDatabase'); console.log(db.read().users.length);"
    try:
        subprocess.run(["node", "-e", db_script], cwd=BACKEND_DIR, stdout=subprocess.PIPE, check=True)
        log("DATABASE", "SkillWorth database engine initialized (data/skillworth_db.json).")
    except Exception as e:
        log("WARN", f"Database engine check note: {e}")

    # 3. Start Backend API Server
    log("BACKEND", "Starting Express API Server on port 5000...")
    backend_env = os.environ.copy()
    backend_env['PORT'] = '5000'
    backend_env['NODE_ENV'] = 'development'
    
    backend_proc = subprocess.Popen(
        ["node", "server.js"],
        cwd=BACKEND_DIR,
        env=backend_env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    # Wait for backend health
    log("BACKEND", "Waiting for API health at http://localhost:5000/api/health...")
    if wait_for_url("http://localhost:5000/api/health", timeout=15):
        log("BACKEND", "Backend API online (HTTP 200 at http://localhost:5000/api/health).")
    else:
        log("WARN", "Backend took longer than expected to report health. Continuing...")

    # 4. Start Frontend Dev Server
    log("FRONTEND", "Starting Vite Dev Server on port 5173...")
    frontend_proc = subprocess.Popen(
        ["npm.cmd" if os.name == "nt" else "npm", "run", "dev"],
        cwd=FRONTEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    log("FRONTEND", "Waiting for UI at http://localhost:5173...")
    if wait_for_url("http://localhost:5173", timeout=20):
        log("FRONTEND", "Frontend ready at http://localhost:5173.")
    else:
        log("FRONTEND", "Frontend launched on port 5173.")

    banner = [
        "",
        "=" * 65,
        "  SKILLWORTH RPL PLATFORM IS LIVE AND READY",
        "=" * 65,
        "  Backend API   : http://localhost:5000",
        "  Frontend App  : http://localhost:5173",
        "  Health Check  : http://localhost:5000/api/health",
        "  Registry Verif: http://localhost:5000/api/credentials/verify/SW-884201",
        "",
        "  Quick Demo Logins:",
        "    * Learner / Student   : learner.demo@skillworth.org / SkillWorth@2026",
        "    * Assessor/Institution: assessor.demo@skillworth.org / SkillWorth@2026",
        "    * Industry / Company  : industry.demo@skillworth.org / SkillWorth@2026",
        "",
        "  ISO/IEC 17024 Demo Credential: SW-884201",
        "=" * 65,
        "  Press Ctrl+C to stop all SkillWorth processes.",
        ""
    ]
    print("\n".join(banner))

    try:
        webbrowser.open("http://localhost:5173")
    except Exception:
        pass

    def cleanup(signum=None, frame=None):
        print("\n[SHUTDOWN] Stopping SkillWorth platform...")
        for name, proc in [("Frontend", frontend_proc), ("Backend", backend_proc)]:
            if proc and proc.poll() is None:
                try:
                    proc.terminate()
                    proc.wait(timeout=3)
                except Exception:
                    proc.kill()
                print(f"[SHUTDOWN] {name} terminated cleanly.")
        sys.exit(0)

    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    try:
        while True:
            if backend_proc.poll() is not None:
                log("BACKEND", f"Exited unexpectedly with code {backend_proc.returncode}.")
                cleanup()
            if frontend_proc.poll() is not None:
                log("FRONTEND", f"Exited unexpectedly with code {frontend_proc.returncode}.")
                cleanup()
            time.sleep(1)
    except KeyboardInterrupt:
        cleanup()

if __name__ == '__main__':
    main()
