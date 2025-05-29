import json
import pytest
import tempfile
from pathlib import Path
from unittest.mock import patch
from django_blocknote.assets import get_vite_asset  # Replace with your actual import


@pytest.fixture
def temp_static_dir():
    """Create a temporary directory structure for static files."""
    with tempfile.TemporaryDirectory() as temp_dir:
        static_dir = Path(temp_dir) / "static"
        static_dir.mkdir(parents=True, exist_ok=True)
        django_blocknote_dir = static_dir / "django_blocknote" / ".vite"
        django_blocknote_dir.mkdir(parents=True, exist_ok=True)
        yield static_dir, django_blocknote_dir


def create_manifest(django_blocknote_dir, manifest_data):
    """Helper to create a manifest.json file with given data."""
    manifest_path = django_blocknote_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest_data))
    return str(manifest_path)


def test_no_manifest_file_found():
    """Test behavior when manifest file doesn't exist."""
    with patch('django.contrib.staticfiles.finders.find') as mock_find:
        mock_find.return_value = None
        result = get_vite_asset("blocknote.js")
        assert result == "django_blocknote/blocknote.js"


def test_blocknote_js_with_valid_manifest(temp_static_dir):
    """Test successful lookup of blocknote.js asset."""
    static_dir, django_blocknote_dir = temp_static_dir
    
    manifest_data = {
        "src/blocknote.js": {
            "file": "js/blocknote.abc123.js",
            "isEntry": True
        }
    }
    
    manifest_path = create_manifest(django_blocknote_dir, manifest_data)
    
    with patch('django.contrib.staticfiles.finders.find') as mock_find:
        mock_find.return_value = manifest_path
        result = get_vite_asset("blocknote.js")
        assert result == "django_blocknote/js/blocknote.abc123.js"


def test_blocknote_css_with_valid_manifest(temp_static_dir):
    """Test successful lookup of blocknote.css asset."""
    static_dir, django_blocknote_dir = temp_static_dir
    
    manifest_data = {
        "style.css": {
            "file": "css/style.def456.css"
        }
    }
    
    manifest_path = create_manifest(django_blocknote_dir, manifest_data)
    
    with patch('django.contrib.staticfiles.finders.find') as mock_find:
        mock_find.return_value = manifest_path
        result = get_vite_asset("blocknote.css")
        assert result == "django_blocknote/css/style.def456.css"


def test_any_css_file_uses_style_css_entry(temp_static_dir):
    """Test that any .css file uses the style.css manifest entry."""
    static_dir, django_blocknote_dir = temp_static_dir
    
    manifest_data = {
        "style.css": {
            "file": "css/main.xyz789.css"
        }
    }
    
    manifest_path = create_manifest(django_blocknote_dir, manifest_data)
    
    with patch('django.contrib.staticfiles.finders.find') as mock_find:
        mock_find.return_value = manifest_path
        result = get_vite_asset("custom.css")
        assert result == "django_blocknote/css/main.xyz789.css"


def test_unknown_asset_fallback(temp_static_dir):
    """Test fallback for unknown asset types."""
    static_dir, django_blocknote_dir = temp_static_dir
    
    manifest_data = {
        "src/blocknote.js": {
            "file": "js/blocknote.abc123.js"
        }
    }
    
    manifest_path = create_manifest(django_blocknote_dir, manifest_data)
    
    with patch('django.contrib.staticfiles.finders.find') as mock_find:
        mock_find.return_value = manifest_path
        result = get_vite_asset("unknown.png")
        assert result == "django_blocknote/unknown.png"


def test_missing_js_entry_in_manifest(temp_static_dir):
    """Test when JS entry is missing from manifest."""
    static_dir, django_blocknote_dir = temp_static_dir
    
    manifest_data = {
        "some/other/file.js": {
            "file": "js/other.abc123.js"
        }
    }
    
    manifest_path = create_manifest(django_blocknote_dir, manifest_data)
    
    with patch('django.contrib.staticfiles.finders.find') as mock_find:
        mock_find.return_value = manifest_path
        result = get_vite_asset("blocknote.js")
        assert result == "django_blocknote/js/blocknote.js"


def test_missing_css_entry_in_manifest(temp_static_dir):
    """Test when CSS entry is missing from manifest."""
    static_dir, django_blocknote_dir = temp_static_dir
    
    manifest_data = {
        "src/blocknote.js": {
            "file": "js/blocknote.abc123.js"
        }
    }
    
    manifest_path = create_manifest(django_blocknote_dir, manifest_data)
    
    with patch('django.contrib.staticfiles.finders.find') as mock_find:
        mock_find.return_value = manifest_path
        result = get_vite_asset("blocknote.css")
        assert result == "django_blocknote/css/blocknote.css"


def test_manifest_entry_missing_file_key(temp_static_dir):
    """Test when manifest entry exists but missing 'file' key."""
    static_dir, django_blocknote_dir = temp_static_dir
    
    manifest_data = {
        "src/blocknote.js": {
            "isEntry": True
            # Missing 'file' key
        }
    }
    
    manifest_path = create_manifest(django_blocknote_dir, manifest_data)
    
    with patch('django.contrib.staticfiles.finders.find') as mock_find:
        mock_find.return_value = manifest_path
        result = get_vite_asset("blocknote.js")
        assert result == "django_blocknote/js/blocknote.js"


def test_manifest_entry_empty_file_value(temp_static_dir):
    """Test when manifest entry has empty 'file' value."""
    static_dir, django_blocknote_dir = temp_static_dir
    
    manifest_data = {
        "src/blocknote.js": {
            "file": "",
            "isEntry": True
        }
    }
    
    manifest_path = create_manifest(django_blocknote_dir, manifest_data)
    
    with patch('django.contrib.staticfiles.finders.find') as mock_find:
        mock_find.return_value = manifest_path
        result = get_vite_asset("blocknote.js")
        assert result == "django_blocknote/js/blocknote.js"


def test_invalid_json_manifest(temp_static_dir):
    """Test handling of invalid JSON in manifest file."""
    static_dir, django_blocknote_dir = temp_static_dir
    
    manifest_path = django_blocknote_dir / "manifest.json"
    manifest_path.write_text("{ invalid json }")
    
    with patch('django.contrib.staticfiles.finders.find') as mock_find:
        mock_find.return_value = str(manifest_path)
        result = get_vite_asset("blocknote.js")
        assert result == "django_blocknote/blocknote.js"


def test_empty_manifest(temp_static_dir):
    """Test handling of empty manifest file."""
    static_dir, django_blocknote_dir = temp_static_dir
    
    manifest_data = {}
    manifest_path = create_manifest(django_blocknote_dir, manifest_data)
    
    with patch('django.contrib.staticfiles.finders.find') as mock_find:
        mock_find.return_value = manifest_path
        result = get_vite_asset("blocknote.js")
        assert result == "django_blocknote/js/blocknote.js"


def test_complex_manifest_structure(temp_static_dir):
    """Test with a more complex, realistic manifest structure."""
    static_dir, django_blocknote_dir = temp_static_dir
    
    manifest_data = {
        "src/blocknote.js": {
            "file": "assets/blocknote-BwcJof8s.js",
            "name": "blocknote",
            "src": "src/blocknote.js",
            "isEntry": True,
            "imports": ["_commonjsHelpers-BosuxZz1.js"],
            "css": ["assets/blocknote-DfGqMuPF.css"]
        },
        "style.css": {
            "file": "assets/style-B8nJQq7v.css",
            "src": "style.css"
        },
        "_commonjsHelpers-BosuxZz1.js": {
            "file": "assets/_commonjsHelpers-BosuxZz1.js"
        }
    }
    
    manifest_path = create_manifest(django_blocknote_dir, manifest_data)
    
    with patch('django.contrib.staticfiles.finders.find') as mock_find:
        mock_find.return_value = manifest_path
        
        js_result = get_vite_asset("blocknote.js")
        assert js_result == "django_blocknote/assets/blocknote-BwcJof8s.js"
        
        css_result = get_vite_asset("blocknote.css")
        assert css_result == "django_blocknote/assets/style-B8nJQq7v.css"


def test_file_not_found_error(temp_static_dir):
    """Test FileNotFoundError handling."""
    static_dir, django_blocknote_dir = temp_static_dir
    
    # Create a manifest path that exists but point to non-existent file
    manifest_path = django_blocknote_dir / "nonexistent.json"
    
    with patch('django.contrib.staticfiles.finders.find') as mock_find:
        mock_find.return_value = str(manifest_path)
        result = get_vite_asset("blocknote.js")
        assert result == "django_blocknote/blocknote.js"
