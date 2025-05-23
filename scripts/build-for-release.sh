#!/bin/bash
# scripts/build-for-release.sh
set -e

echo "🚀 Building django-blocknote for PyPI release..."

# Clean everything first
echo "🧹 Cleaning previous builds..."
rm -rf dist/ build/ *.egg-info/
cd frontend && npm run clean && cd ..

# Build production assets
echo "📦 Building production frontend assets..."
./scripts/build-production.sh

# Run tests
echo "🧪 Running tests..."
uv run pytest

# Lint and format
echo "🔍 Running code quality checks..."
uv run black django_blocknote tests --check
uv run isort django_blocknote tests --check-only
uv run flake8 django_blocknote tests

# Build Python package
echo "📦 Building Python package..."
uv run python -m build

# Check package
echo "✅ Checking package..."
uv run python -m twine check dist/*

echo "✨ Release build complete!"
echo "Files ready for upload:"
ls -la dist/

echo ""
echo "To upload to PyPI:"
echo "  uv run python -m twine upload dist/*"
echo ""
echo "To upload to Test PyPI first:"
echo "  uv run python -m twine upload --repository testpypi dist/*"
