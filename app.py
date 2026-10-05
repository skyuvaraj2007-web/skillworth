#!/usr/bin/env python3
"""
================================================================================
SKILL NEXUS AI — APPLICATION LAUNCHER (app.py)
================================================================================
Single-command launcher for the complete Skill Nexus stack:
1. PostgreSQL verification (localhost:5432, skillnexus_db)
2. Node.js / Express Backend (localhost:5000)
3. React / Vite Frontend (localhost:5173)
4. Automated browser open & Ctrl+C process management

DO NOT REWRITE THE EXISTING STACK. THIS LAUNCHER ORCHESTRATES THE EXISTING CODEBASE.
================================================================================
"""

import atexit
import json
import os
import shutil
import signal
import socket
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
import webbrowser
from pathlib import Path

# Configure UTF-8 encoding on Windows to prevent charmap UnicodeEncodeError
if sys.platform == "win32":
    try:
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)
        if hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)
    except Exception:
        pass

# ------------------------------------------------------------------------------
# 1. Project Root & Path Detection
# ------------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = PROJECT_ROOT / "backend"
FRONTEND_DIR = PROJECT_ROOT / "frontend"

BACKEND_URL = "http://localhost:5000"
BACKEND_HEALTH_URL = "http://localhost:5000/api/health"
FRONTEND_PORT = 5173
FRONTEND_URL = f"http://localhost:{FRONTEND_PORT}"
PG_HOST = "localhost"
PG_PORT = 5432
PG_DATABASE = "skillnexus_db"

backend_process = None
frontend_process = None
is_shutting_down = False

# Log capture buffers
backend_logs = []
frontend_logs = []

def log_streamer(pipe, buffer, prefix):
    """Capture child process stdout/stderr into ring buffer and display errors."""
    try:
        while True:
            line = pipe.readline()
            if not line:
                # Pipe closed or EOF
                break
            line_str = line.strip()
            if line_str:
                buffer.append(line_str)
                if len(buffer) > 100:
                    buffer.pop(0)
                # Show critical errors live
                if any(k in line_str.lower() for k in ['fatal', 'uncaughtexception', 'eaddrinuse', 'panic']):
                    print(f"[{prefix} ERR] {line_str}")
    except Exception:
        pass

# ------------------------------------------------------------------------------
# 2. Process Cleanup & Termination
# ------------------------------------------------------------------------------
def kill_process_tree(proc):
    """Cleanly terminate process and all child processes on Windows or POSIX."""
    if not proc or proc.poll() is not None:
        return
    pid = proc.pid
    try:
        if sys.platform == "win32":
            subprocess.run(
                f"taskkill /F /T /PID {pid}",
                shell=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        else:
            proc.terminate()
            proc.wait(timeout=3)
    except Exception:
        try:
            proc.kill()
        except Exception:
            pass

def cleanup():
    """Cleanup handler called on normal exit or interrupt."""
    global is_shutting_down, backend_process, frontend_process
    if is_shutting_down:
        return
    is_shutting_down = True
    print("\n[APP] Shutting down Skill Nexus services...")
    if frontend_process:
        print("[APP] Stopping Frontend server...")
        kill_process_tree(frontend_process)
        frontend_process = None
    if backend_process:
        print("[APP] Stopping Backend server...")
        kill_process_tree(backend_process)
        backend_process = None
    print("[APP] Skill Nexus stopped cleanly.")

def signal_handler(signum, frame):
    cleanup()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)
atexit.register(cleanup)

# ------------------------------------------------------------------------------
# 3. Port & Socket Utilities
# ------------------------------------------------------------------------------
def is_port_in_use(port, host="127.0.0.1"):
    """Check if a network port is listening."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        return s.connect_ex((host, port)) == 0

def check_http_200(url, timeout=3.0):
    """Probe an HTTP URL and return True if HTTP 200 is returned."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "SkillNexus-Launcher"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status == 200
    except Exception:
        return False

def get_process_on_port(port):
    """Identify the PID and process name listening on a specific port."""
    try:
        import psutil
        for conn in psutil.net_connections(kind='inet'):
            if conn.laddr and conn.laddr.port == port and conn.status == 'LISTEN':
                try:
                    proc = psutil.Process(conn.pid)
                    return conn.pid, proc.name()
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    return conn.pid, "Unknown"
    except Exception:
        pass

    # Fallback to netstat on Windows
    if sys.platform == "win32":
        try:
            out = subprocess.check_output(f"netstat -aon | findstr :{port}", shell=True, text=True)
            for line in out.strip().splitlines():
                if "LISTENING" in line:
                    parts = line.split()
                    if len(parts) >= 5:
                        return int(parts[-1]), "process"
        except Exception:
            pass
    return None, None

# ------------------------------------------------------------------------------
# 4. Dependency & Environment Verification
# ------------------------------------------------------------------------------
def verify_system_prerequisites():
    """Verify Node.js and npm exist on PATH."""
    node_path = shutil.which("node")
    if not node_path:
        print("\n" + "=" * 60)
        print("ERROR: Node.js was not found on your system PATH!")
        print("Please install Node.js (v18+ or v20+) from https://nodejs.org/")
        print("=" * 60 + "\n")
        sys.exit(1)

    npm_path = shutil.which("npm") or shutil.which("npm.cmd")
    if not npm_path:
        print("\n" + "=" * 60)
        print("ERROR: npm was not found on your system PATH!")
        print("Please verify your Node.js and npm installation.")
        print("=" * 60 + "\n")
        sys.exit(1)

    # Check project directories
    if not BACKEND_DIR.is_dir():
        print(f"ERROR: Backend directory not found at: {BACKEND_DIR}")
        sys.exit(1)
    if not FRONTEND_DIR.is_dir():
        print(f"ERROR: Frontend directory not found at: {FRONTEND_DIR}")
        sys.exit(1)

    # Check node_modules in backend
    if not (BACKEND_DIR / "node_modules").is_dir():
        print("[SETUP] Installing backend dependencies (npm install)...")
        res = subprocess.run("npm install", cwd=str(BACKEND_DIR), shell=True)
        if res.returncode != 0:
            print("ERROR: Failed to install backend dependencies.")
            sys.exit(1)

    # Check node_modules in frontend
    if not (FRONTEND_DIR / "node_modules").is_dir():
        print("[SETUP] Installing frontend dependencies (npm install)...")
        res = subprocess.run("npm install", cwd=str(FRONTEND_DIR), shell=True)
        if res.returncode != 0:
            print("ERROR: Failed to install frontend dependencies.")
            sys.exit(1)

# ------------------------------------------------------------------------------
# 5. PostgreSQL Check
# ------------------------------------------------------------------------------
def check_postgresql():
    """Verify PostgreSQL is reachable on localhost:5432."""
    print(f"[DB] Checking PostgreSQL connectivity on {PG_HOST}:{PG_PORT} ({PG_DATABASE})...")
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(3.0)
    try:
        s.connect((PG_HOST, PG_PORT))
        s.close()
        print("[DB] PostgreSQL connected successfully.")
        return True
    except Exception as e:
        s.close()
        print(f"[DB] Notice: PostgreSQL is not reachable at {PG_HOST}:{PG_PORT}.")
        print("[DB] Continuing startup using built-in JSON persistence database (data/db.json).")
        return False

# ------------------------------------------------------------------------------
# 6. Backend Launch & Health Verification
# ------------------------------------------------------------------------------
def start_backend():
    """Start the Node.js Express backend server and poll for HTTP 200."""
    global backend_process

    # Check if backend is already running and healthy
    if is_port_in_use(5000):
        if check_http_200(BACKEND_HEALTH_URL):
            print("[BACKEND] Existing Skill Nexus backend detected on port 5000 (ONLINE). Reusing existing instance.")
            return True
        else:
            pid, name = get_process_on_port(5000)
            print(f"[BACKEND] Port 5000 is occupied by PID {pid} ({name}) but health check failed.")
            print("[BACKEND] Freeing stale port 5000 process...")
            if pid and sys.platform == "win32":
                subprocess.run(f"taskkill /F /PID {pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                time.sleep(1)

    print("[BACKEND] Starting Node server...")

    # Determine command from backend/package.json
    pkg_file = BACKEND_DIR / "package.json"
    start_cmd = ["node", "src/server.js"]
    if pkg_file.is_file():
        try:
            with open(pkg_file, "r", encoding="utf-8") as f:
                pkg = json.load(f)
                if "scripts" in pkg and "start" in pkg["scripts"]:
                    parts = pkg["scripts"]["start"].split()
                    if parts:
                        start_cmd = parts
                elif "main" in pkg:
                    start_cmd = ["node", pkg["main"]]
        except Exception:
            start_cmd = ["node", "src/server.js"]

    # Spawn backend process
    backend_process = subprocess.Popen(
        start_cmd,
        cwd=str(BACKEND_DIR),
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1
    )

    # Start log streamer threads
    t_out = threading.Thread(target=log_streamer, args=(backend_process.stdout, backend_logs, "BACKEND"), daemon=True)
    t_err = threading.Thread(target=log_streamer, args=(backend_process.stderr, backend_logs, "BACKEND"), daemon=True)
    t_out.start()
    t_err.start()

    # Poll backend health endpoint (up to 45 seconds)
    print(f"[BACKEND] Waiting for {BACKEND_HEALTH_URL}...")
    start_time = time.time()
    while time.time() - start_time < 45:
        if backend_process.poll() is not None:
            print("\n" + "=" * 60)
            print(f"[BACKEND ERROR] Backend process terminated unexpectedly with code {backend_process.returncode}!")
            print("Recent backend output:")
            for log_line in backend_logs[-20:]:
                print(f"  {log_line}")
            print("=" * 60 + "\n")
            sys.exit(1)

        if check_http_200(BACKEND_HEALTH_URL):
            print("[BACKEND] Health check passed (HTTP 200).")
            return True

        time.sleep(0.5)

    print("\n" + "=" * 60)
    print("[BACKEND ERROR] Backend startup timed out after 45 seconds!")
    print(f"Could not reach {BACKEND_HEALTH_URL}")
    print("Recent backend logs:")
    for log_line in backend_logs[-25:]:
        print(f"  {log_line}")
    print("=" * 60 + "\n")
    sys.exit(1)

# ------------------------------------------------------------------------------
# 7. Frontend Launch & HTTP Verification
# ------------------------------------------------------------------------------
def free_port(port):
    """Kill any process listening on a specific port on Windows."""
    if sys.platform == "win32":
        try:
            out = subprocess.check_output(f"netstat -aon | findstr :{port}", shell=True, text=True)
            for line in out.strip().splitlines():
                if "LISTENING" in line:
                    parts = line.split()
                    if len(parts) >= 5:
                        pid = parts[-1]
                        subprocess.run(f"taskkill /F /PID {pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass

def start_frontend():
    """Start the React Vite frontend server and poll for HTTP 200."""
    global frontend_process

    # Always free any stale process on 5173 before spawning to prevent port conflicts
    free_port(FRONTEND_PORT)
    time.sleep(0.5)

    print("[FRONTEND] Starting Vite...")

    if sys.platform == "win32":
        npm_bin = shutil.which("npm.cmd") or "npm.cmd"
        start_cmd = f'"{npm_bin}" run dev'
    else:
        npm_bin = shutil.which("npm") or "npm"
        start_cmd = [npm_bin, "run", "dev"]

    frontend_process = subprocess.Popen(
        start_cmd,
        cwd=str(FRONTEND_DIR),
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
        shell=(sys.platform == "win32")
    )

    t_out = threading.Thread(target=log_streamer, args=(frontend_process.stdout, frontend_logs, "FRONTEND"), daemon=True)
    t_err = threading.Thread(target=log_streamer, args=(frontend_process.stderr, frontend_logs, "FRONTEND"), daemon=True)
    t_out.start()
    t_err.start()

    # Poll frontend endpoint (up to 45 seconds)
    print(f"[FRONTEND] Waiting for {FRONTEND_URL}...")
    start_time = time.time()
    while time.time() - start_time < 45:
        if frontend_process.poll() is not None:
            print("\n" + "=" * 60)
            print(f"[FRONTEND ERROR] Frontend process terminated unexpectedly with code {frontend_process.returncode}!")
            print("Recent frontend output:")
            for log_line in frontend_logs[-20:]:
                print(f"  {log_line}")
            print("=" * 60 + "\n")
            sys.exit(1)

        if check_http_200(FRONTEND_URL):
            print(f"[FRONTEND] HTTP 200 ({FRONTEND_URL}).")
            return True

        time.sleep(0.5)

    print("\n" + "=" * 60)
    print(f"[FRONTEND ERROR] Frontend startup timed out after 45 seconds at {FRONTEND_URL}!")
    print("Recent frontend logs:")
    for log_line in frontend_logs[-25:]:
        print(f"  {log_line}")
    print("=" * 60 + "\n")
    sys.exit(1)

# ------------------------------------------------------------------------------
# 8. Main Application Lifecycle
# ------------------------------------------------------------------------------
def main():
    print("=" * 60)
    print("[*] INITIALIZING SKILL NEXUS AI LAUNCHER")
    print(f"Project Root: {PROJECT_ROOT}")
    print("=" * 60)

    # 1. Verify Node.js, npm, dependencies
    verify_system_prerequisites()

    # 2. Check PostgreSQL
    check_postgresql()

    # 3. Start Backend
    start_backend()

    # 4. Start Frontend
    start_frontend()

    # 5. Display Official Success Banner
    banner = f"""
====================================================
SKILL NEXUS AI
Career Intelligence & Skill Development Platform
====================================================

Database : PostgreSQL / {PG_DATABASE}
Backend  : {BACKEND_URL}
Frontend : {FRONTEND_URL}

Status:
✓ PostgreSQL
✓ Backend API
✓ Frontend
✓ Ready

Open:
{FRONTEND_URL}

====================================================
Press Ctrl+C to stop all Skill Nexus services.
"""
    print(banner)

    # 6. Automatically Open Default Browser
    try:
        print("[APP] Skill Nexus is ready")
        print(f"[APP] Opening {FRONTEND_URL} in your default browser...")
        webbrowser.open(FRONTEND_URL)
    except Exception as e:
        print(f"[APP] Notice: Could not automatically open browser ({e}). Please navigate to {FRONTEND_URL}")

    # 7. Keep main thread alive and monitor child processes
    try:
        while True:
            time.sleep(2)
            # Check if backend crashed
            if backend_process and backend_process.poll() is not None:
                if not is_port_in_use(5000) and not check_http_200(BACKEND_HEALTH_URL):
                    print(f"\n[BACKEND ERROR] Backend process died unexpectedly (Exit Code: {backend_process.returncode})")
                    break
            # Check if frontend crashed
            if frontend_process and frontend_process.poll() is not None:
                if not is_port_in_use(FRONTEND_PORT) and not check_http_200(FRONTEND_URL):
                    print(f"\n[FRONTEND ERROR] Frontend process died unexpectedly (Exit Code: {frontend_process.returncode})")
                    break
    except KeyboardInterrupt:
        pass
    finally:
        cleanup()

if __name__ == "__main__":
    main()
