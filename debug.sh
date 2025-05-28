#!/bin/bash
# Debug script for Django migration issues

echo "🔍 Debugging Django migration issues..."

cd examples/demo_project

echo "1. Checking if Django can see the blog app:"
python manage.py check

echo ""
echo "2. Listing all installed apps Django recognizes:"
python manage.py shell -c "
from django.apps import apps
for app in apps.get_app_configs():
    print(f'  - {app.name} ({app.label})')
"

echo ""
echo "3. Checking if models are detected:"
python manage.py shell -c "
from django.apps import apps
try:
    from blog.models import BlogPost, Comment
    print('✅ Models imported successfully')
    print(f'  - BlogPost fields: {[f.name for f in BlogPost._meta.fields]}')
    print(f'  - Comment fields: {[f.name for f in Comment._meta.fields]}')
except ImportError as e:
    print(f'❌ Import error: {e}')
"

echo ""
echo "4. Checking migration status:"
python manage.py showmigrations

echo ""
echo "5. Trying to make migrations with verbose output:"
python manage.py makemigrations --verbosity=2

echo ""
echo "6. File structure check:"
echo "Blog app structure:"
find blog -name "*.py" -type f | head -10
