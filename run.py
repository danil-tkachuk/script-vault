#!/usr/bin/env python3
import os
import sys
import subprocess
import time
import webbrowser
import threading

def setup_and_run():
    print("=" * 60)
    print("           AetherTasks Launch & Setup Wizard")
    print("=" * 60)
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    venv_dir = os.path.join(base_dir, "venv")
    requirements_path = os.path.join(base_dir, "requirements.txt")
    
    # Define python & pip paths for virtual environment
    if sys.platform == "win32":
        venv_python = os.path.join(venv_dir, "Scripts", "python.exe")
        venv_pip = os.path.join(venv_dir, "Scripts", "pip.exe")
    else:
        venv_python = os.path.join(venv_dir, "bin", "python")
        venv_pip = os.path.join(venv_dir, "bin", "pip")
        
    # Check if virtual environment exists
    if not os.path.exists(venv_dir):
        print("[*] Creating local Python virtual environment (venv)...")
        try:
            subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
            print("[+] Virtual environment created successfully.")
        except subprocess.CalledProcessError as e:
            print(f"[-] Failed to create virtual environment: {e}")
            print("[*] Falling back to system python...")
            venv_python = sys.executable
            venv_pip = "pip3"
    else:
        print("[+] Existing virtual environment detected.")

    # Install dependencies
    print("[*] Validating dependencies...")
    try:
        subprocess.run([venv_pip, "install", "-r", requirements_path], check=True)
        print("[+] All dependencies installed successfully.")
    except Exception as e:
        print(f"[-] Failed to install requirements: {e}")
        print("[*] Trying a quick force-install of Flask...")
        try:
            subprocess.run([venv_pip, "install", "Flask==3.0.3"], check=True)
        except Exception as e2:
            print(f"[-] Emergency installation failed: {e2}")
            print("[!] Please run: pip install flask")
            
    # Auto-open browser thread
    def open_browser():
        time.sleep(1.5)
        url = "http://127.0.0.1:5000"
        print(f"\n[*] Automatically launching default browser to: {url}")
        webbrowser.open(url)

    browser_thread = threading.Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()
    
    # Start Flask server
    print("\n[*] Starting AetherTasks Flask Server...")
    print("[*] Press Ctrl+C to terminate the application.")
    print("=" * 60)
    
    try:
        subprocess.run([venv_python, os.path.join(base_dir, "app.py")], check=True)
    except KeyboardInterrupt:
        print("\n[+] AetherTasks stopped safely. Have a productive day!")
    except Exception as e:
        print(f"\n[-] Server exited with an error: {e}")

if __name__ == "__main__":
    setup_and_run()
