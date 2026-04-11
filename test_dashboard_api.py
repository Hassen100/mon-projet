#!/usr/bin/env python
import requests
import json

print("🧪 Test des API endpoints pour le dashboard Angular...")

# Test analytics summary
try:
    response = requests.get('http://127.0.0.1:8000/api/analytics/summary/?days=30')
    print(f"\n📊 Analytics Summary Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Sessions: {data['sessions']}")
        print(f"✅ Users: {data['users']}")
        print(f"✅ Page Views: {data['page_views']}")
        print(f"✅ Bounce Rate: {data['bounce_rate']}%")
        print(f"✅ Avg Session Duration: {data['avg_session_duration']}s")
    else:
        print(f"❌ Erreur: {response.text}")
except Exception as e:
    print(f"❌ Erreur Analytics Summary: {e}")

# Test top pages
try:
    response = requests.get('http://127.0.0.1:8000/api/analytics/top-pages/?days=30')
    print(f"\n📄 Top Pages Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        pages = data['pages']
        print(f"✅ Nombre de pages: {len(pages)}")
        for i, page in enumerate(pages[:5], 1):
            print(f"  {i}. {page['page_path']}: {page['views']} vues")
    else:
        print(f"❌ Erreur: {response.text}")
except Exception as e:
    print(f"❌ Erreur Top Pages: {e}")

# Test top queries
try:
    response = requests.get('http://127.0.0.1:8000/api/search/top-queries/?days=30')
    print(f"\n🔍 Top Queries Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        queries = data['queries']
        print(f"✅ Nombre de requêtes: {len(queries)}")
        for i, query in enumerate(queries[:5], 1):
            print(f"  {i}. '{query['query']}': {query['clicks']} clics, position {query['position']}")
    else:
        print(f"❌ Erreur: {response.text}")
except Exception as e:
    print(f"❌ Erreur Top Queries: {e}")

print(f"\n🌐 Dashboard Angular disponible sur: http://localhost:4205")
print(f"🔧 Backend API disponible sur: http://127.0.0.1:8000")
print(f"\n✅ Le dashboard devrait maintenant afficher les VRAIES données depuis la base MySQL !")
