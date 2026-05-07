#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import GoogleSearchConsoleData
from django.contrib.auth.models import User

user = User.objects.get(id=1)
data = GoogleSearchConsoleData.objects.filter(user=user)
print(f'Nombre d\'entrées: {data.count()}')
for d in data[:5]:
    print(f'- {d.query}: {d.clicks} clics, {d.impressions} impressions')
