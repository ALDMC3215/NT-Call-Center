import os
import subprocess

def main():
    print("Installing Novintech Call Manager dependencies...")
    try:
        subprocess.check_call(["npm", "install"], shell=True)
        print("Dependencies installed successfully.")
    except Exception as e:
        print("Error installing dependencies:", e)

if __name__ == "__main__":
    main()
