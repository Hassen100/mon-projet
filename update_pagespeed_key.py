#!/usr/bin/env python3
"""
Quick script to update PAGESPEED_API_KEY in .env and test it
Usage: python update_pagespeed_key.py <new_api_key>
"""

import sys
import os
from pathlib import Path
import re


def resolve_env_file():
    """Find backend/.env from common execution locations."""
    candidates = [
        Path(__file__).resolve().parent / "backend" / ".env",
        Path.cwd() / "backend" / ".env",
        Path.cwd() / ".env",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return candidates[0]


def bootstrap_env_file(env_file):
    """Create .env from .env.example when missing."""
    if env_file.exists():
        return True

    example_candidates = [
        env_file.with_name(".env.example"),
        Path(__file__).resolve().parent / "backend" / ".env.example",
        Path.cwd() / "backend" / ".env.example",
    ]
    example_file = next((p for p in example_candidates if p.exists()), None)
    if example_file is None:
        print(f"❌ {env_file} not found and no .env.example available to bootstrap.")
        return False

    env_file.parent.mkdir(parents=True, exist_ok=True)
    content = example_file.read_text(encoding="utf-8")
    # Ensure PageSpeed keys exist in bootstrapped .env.
    if "PAGESPEED_API_KEY=" not in content:
        content += "\nPAGESPEED_API_KEY=\n"
    if "PAGESPEED_REQUEST_REFERER=" not in content:
        content += "PAGESPEED_REQUEST_REFERER=http://localhost:4200\n"
    env_file.write_text(content, encoding="utf-8")
    print(f"✓ Created {env_file} from {example_file}")
    return True

def update_env_file(new_key):
    """Update PAGESPEED_API_KEY in backend/.env"""
    env_file = resolve_env_file()

    if not bootstrap_env_file(env_file):
        return False
    
    try:
        content = env_file.read_text(encoding='utf-8')
        
        # Replace the key
        pattern = r'PAGESPEED_API_KEY=.*'
        replacement = f'PAGESPEED_API_KEY={new_key}'

        if re.search(pattern, content):
            updated_content = re.sub(pattern, replacement, content)
        else:
            updated_content = content.rstrip() + f"\nPAGESPEED_API_KEY={new_key}\n"
            if "PAGESPEED_REQUEST_REFERER=" not in updated_content:
                updated_content += "PAGESPEED_REQUEST_REFERER=http://localhost:4200\n"
        
        env_file.write_text(updated_content, encoding='utf-8')
        print(f"✓ Updated {env_file}")
        print(f"  Key (partial): {new_key[:10]}...{new_key[-5:]}")
        return True
    except Exception as e:
        print(f"❌ Error updating .env: {e}")
        return False

def test_pagespeed_key(api_key):
    """Test the PageSpeed API key against Google"""
    import urllib.request
    import json
    
    test_url = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
    test_page = "https://www.google.com"
    params = f"?url={test_page}&key={api_key}&strategy=mobile"
    
    print(f"\n🔍 Testing key against Google PageSpeed API...")
    print(f"   URL: {test_url + params}")
    
    try:
        request = urllib.request.Request(test_url + params)
        with urllib.request.urlopen(request, timeout=10) as response:
            data = json.loads(response.read().decode())
            if 'lighthouseResult' in data:
                print("✓ Key works! Got valid PageSpeed response")
                return True
            else:
                print(f"⚠️  Got response but no lighthouse data: {list(data.keys())}")
                return True
    except Exception as e:
        error_str = str(e)
        if 'quota' in error_str.lower():
            print(f"❌ Quota error: {error_str}")
        elif '403' in error_str:
            print(f"❌ Permission error: {error_str}")
        elif '401' in error_str or '400' in error_str:
            print(f"❌ Invalid key or request: {error_str}")
        else:
            print(f"❌ Error: {error_str}")
        return False

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python update_pagespeed_key.py <new_api_key>")
        print("Example: python update_pagespeed_key.py AIzaSyxxxxxxxxxxxxxxxx")
        sys.exit(1)
    
    new_key = sys.argv[1].strip()
    
    if not new_key or len(new_key) < 20:
        print("❌ Invalid API key format (should be at least 20 characters)")
        sys.exit(1)
    
    # Update .env
    if update_env_file(new_key):
        # Test the key
        test_pagespeed_key(new_key)
        print("\n✓ Done! Update your Render env vars and redeploy backend.")
    else:
        sys.exit(1)
