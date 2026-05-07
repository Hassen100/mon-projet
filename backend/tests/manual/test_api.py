#!/usr/bin/env python
import requests
import json

print("=== TEST DES APIs ===")

# Test Analytics Summary
try:
    response = requests.get("http://127.0.0.1:8000/api/analytics/summary/?user_id=1&days=30")
    print("Analytics Summary:", response.json())
except Exception as e:
    print("Analytics Error:", e)

# Test Search Summary
try:
    response = requests.get("http://127.0.0.1:8000/api/search/summary/?user_id=1&days=30")
    print("Search Summary:", response.json())
except Exception as e:
    print("Search Error:", e)

# Test Top Queries
try:
    response = requests.get("http://127.0.0.1:8000/api/search/top-queries/?user_id=1&days=30&limit=5")
    print("Top Queries:", response.json())
except Exception as e:
    print("Top Queries Error:", e)

# Test Top Pages
try:
    response = requests.get("http://127.0.0.1:8000/api/analytics/top-pages/?user_id=1&days=30&limit=5")
    print("Top Pages:", response.json())
except Exception as e:
    print("Top Pages Error:", e)
