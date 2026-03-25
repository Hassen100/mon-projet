#!/usr/bin/env python
"""
Setup script for SEO Analytics Backend
"""

import subprocess
import sys
import os

def install_package(package):
    """Install a Python package using pip."""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f"✅ Successfully installed {package}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install {package}: {e}")
        return False

def main():
    """Install all required packages."""
    print("🚀 Setting up SEO Analytics Backend...")
    print("=" * 50)
    
    packages = [
        "django==4.2.7",
        "djangorestframework==3.14.0",
        "google-analytics-data==0.18.0",
        "google-auth==2.23.4",
        "django-cors-headers==4.3.1"
    ]
    
    failed_packages = []
    
    for package in packages:
        if not install_package(package):
            failed_packages.append(package)
    
    print("\n" + "=" * 50)
    if failed_packages:
        print(f"❌ Setup failed. Could not install: {', '.join(failed_packages)}")
        print("\n💡 Try installing manually:")
        for pkg in failed_packages:
            print(f"   pip install {pkg}")
        return False
    else:
        print("✅ All packages installed successfully!")
        print("\n🎯 Next steps:")
        print("   1. python manage.py migrate")
        print("   2. python manage.py runserver")
        return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
