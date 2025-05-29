import json
import tempfile
from pathlib import Path

import pytest
from django.test import TestCase, override_settings

from django_blocknote.assets import get_vite_asset  # Replace with your actual import


class TestGetViteAsset(TestCase):
    def setUp(self):
        """Set up temporary directories for static files testing."""
        self.temp_dir = tempfile.mkdtemp()
        self.static_dir = Path(self.temp_dir) / "static"
        self.static_dir.mkdir(parents=True, exist_ok=True)
        self.django_blocknote_dir = self.static_dir / "django_blocknote" / ".vite"
        self.django_blocknote_dir.mkdir(parents=True, exist_ok=True)

    def tearDown(self):
        """Clean up temporary files."""
        import shutil

        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def create_manifest(self, manifest_data):
        """Helper to create a manifest.json file with given data."""
        manifest_path = self.django_blocknote_dir / "manifest.json"
        manifest_path.write_text(json.dumps(manifest_data))
        return str(manifest_path)

    @override_settings(STATICFILES_DIRS=[])
    def test_no_manifest_file_found(self):
        """Test behavior when manifest file doesn't exist."""
        # Don't create any manifest file
        with override_settings(STATICFILES_DIRS=[str(self.static_dir)]):
            result = get_vite_asset("blocknote.js")
            assert result == "django_blocknote/blocknote.js"

    @override_settings(STATICFILES_DIRS=[])
    def test_blocknote_js_with_valid_manifest(self):
        """Test successful lookup of blocknote.js asset."""
        manifest_data = {
            "src/blocknote.js": {"file": "js/blocknote.abc123.js", "isEntry": True},
        }

        with override_settings(STATICFILES_DIRS=[str(self.static_dir)]):
            self.create_manifest(manifest_data)
            result = get_vite_asset("blocknote.js")
            assert result == "django_blocknote/js/blocknote.abc123.js"

    @override_settings(STATICFILES_DIRS=[])
    def test_blocknote_css_with_valid_manifest(self):
        """Test successful lookup of blocknote.css asset."""
        manifest_data = {"style.css": {"file": "css/style.def456.css"}}

        with override_settings(STATICFILES_DIRS=[str(self.static_dir)]):
            self.create_manifest(manifest_data)
            result = get_vite_asset("blocknote.css")
            assert result == "django_blocknote/css/style.def456.css"

    @override_settings(STATICFILES_DIRS=[])
    def test_any_css_file_uses_style_css_entry(self):
        """Test that any .css file uses the style.css manifest entry."""
        manifest_data = {"style.css": {"file": "css/main.xyz789.css"}}

        with override_settings(STATICFILES_DIRS=[str(self.static_dir)]):
            self.create_manifest(manifest_data)
            result = get_vite_asset("custom.css")
            assert result == "django_blocknote/css/main.xyz789.css"

    @override_settings(STATICFILES_DIRS=[])
    def test_unknown_asset_fallback(self):
        """Test fallback for unknown asset types."""
        manifest_data = {"src/blocknote.js": {"file": "js/blocknote.abc123.js"}}

        with override_settings(STATICFILES_DIRS=[str(self.static_dir)]):
            self.create_manifest(manifest_data)
            result = get_vite_asset("unknown.png")
            assert result == "django_blocknote/unknown.png"

    @override_settings(STATICFILES_DIRS=[])
    def test_missing_js_entry_in_manifest(self):
        """Test when JS entry is missing from manifest."""
        manifest_data = {"some/other/file.js": {"file": "js/other.abc123.js"}}

        with override_settings(STATICFILES_DIRS=[str(self.static_dir)]):
            self.create_manifest(manifest_data)
            result = get_vite_asset("blocknote.js")
            assert result == "django_blocknote/js/blocknote.js"

    @override_settings(STATICFILES_DIRS=[])
    def test_missing_css_entry_in_manifest(self):
        """Test when CSS entry is missing from manifest."""
        manifest_data = {"src/blocknote.js": {"file": "js/blocknote.abc123.js"}}

        with override_settings(STATICFILES_DIRS=[str(self.static_dir)]):
            self.create_manifest(manifest_data)
            result = get_vite_asset("blocknote.css")
            assert result == "django_blocknote/blocknote.css"

    @override_settings(STATICFILES_DIRS=[])
    def test_manifest_entry_missing_file_key(self):
        """Test when manifest entry exists but missing 'file' key."""
        manifest_data = {
            "src/blocknote.js": {
                "isEntry": True,
                # Missing 'file' key
            },
        }

        with override_settings(STATICFILES_DIRS=[str(self.static_dir)]):
            self.create_manifest(manifest_data)
            result = get_vite_asset("blocknote.js")
            assert result == "django_blocknote/blocknote.js"

    @override_settings(STATICFILES_DIRS=[])
    def test_manifest_entry_empty_file_value(self):
        """Test when manifest entry has empty 'file' value."""
        manifest_data = {"src/blocknote.js": {"file": "", "isEntry": True}}

        with override_settings(STATICFILES_DIRS=[str(self.static_dir)]):
            self.create_manifest(manifest_data)
            result = get_vite_asset("blocknote.js")
            assert result == "django_blocknote/blocknote.js"

    @override_settings(STATICFILES_DIRS=[])
    def test_invalid_json_manifest(self):
        """Test handling of invalid JSON in manifest file."""
        manifest_path = self.django_blocknote_dir / "manifest.json"
        manifest_path.write_text("{ invalid json }")

        with override_settings(STATICFILES_DIRS=[str(self.static_dir)]):
            result = get_vite_asset("blocknote.js")
            assert result == "django_blocknote/blocknote.js"

    @override_settings(STATICFILES_DIRS=[])
    def test_empty_manifest(self):
        """Test handling of empty manifest file."""
        manifest_data = {}

        with override_settings(STATICFILES_DIRS=[str(self.static_dir)]):
            self.create_manifest(manifest_data)
            result = get_vite_asset("blocknote.js")
            assert result == "django_blocknote/blocknote.js"

    @override_settings(STATICFILES_DIRS=[])
    def test_complex_manifest_structure(self):
        """Test with a more complex, realistic manifest structure."""
        manifest_data = {
            "src/blocknote.js": {
                "file": "assets/blocknote-BwcJof8s.js",
                "name": "blocknote",
                "src": "src/blocknote.js",
                "isEntry": True,
                "imports": ["_commonjsHelpers-BosuxZz1.js"],
                "css": ["assets/blocknote-DfGqMuPF.css"],
            },
            "style.css": {"file": "assets/style-B8nJQq7v.css", "src": "style.css"},
            "_commonjsHelpers-BosuxZz1.js": {
                "file": "assets/_commonjsHelpers-BosuxZz1.js",
            },
        }

        with override_settings(STATICFILES_DIRS=[str(self.static_dir)]):
            self.create_manifest(manifest_data)

            js_result = get_vite_asset("blocknote.js")
            assert js_result == "django_blocknote/assets/blocknote-BwcJof8s.js"

            css_result = get_vite_asset("blocknote.css")
            assert css_result == "django_blocknote/assets/style-B8nJQq7v.css"


# Additional pytest-style tests (if you prefer functions over classes)
@pytest.mark.django_db
def test_get_vite_asset_with_temporary_files():
    """Example of a pytest function-style test."""
    with tempfile.TemporaryDirectory() as temp_dir:
        static_dir = Path(temp_dir) / "static"
        static_dir.mkdir()

        django_blocknote_dir = static_dir / "django_blocknote" / ".vite"
        django_blocknote_dir.mkdir(parents=True)

        manifest_data = {"src/blocknote.js": {"file": "js/test.js"}}

        manifest_path = django_blocknote_dir / "manifest.json"
        manifest_path.write_text(json.dumps(manifest_data))

        with override_settings(STATICFILES_DIRS=[str(static_dir)]):
            result = get_vite_asset("blocknote.js")
            assert result == "django_blocknote/js/test.js"
