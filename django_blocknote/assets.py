import json  # noqa: I001
from django.conf import settings
from django.contrib.staticfiles import finders


def get_vite_asset(asset_name):
    """
    Get the actual filename of a Vite asset from the manifest.
    Handles hashed filenames for cache busting.

    Args:
        asset_name (str): The original asset name (e.g., 'blocknote.js', 'style.css')

    Returns:
        str: The actual filename with hash (e.g., 'js/blocknote.abc123.js')
    """
    try:
        # Find the manifest file
        manifest_path = finders.find("django_blocknote/.vite/manifest.json")
        if not manifest_path:
            # Fallback to original filename if no manifest
            return f"django_blocknote/{asset_name}"

        # Read the manifest
        with open(manifest_path) as f:
            manifest = json.load(f)
            print(f"\n**************\nLooking for {asset_name}")
            print(f"JS entry found: {manifest.get('src/blocknote.js')}\n**********")

        # Handle specific asset lookups based on your manifest structure
        if asset_name == "blocknote.js":
            # Look for the JS entry
            js_entry = manifest.get("src/blocknote.js")
            if js_entry and "file" in js_entry:
                return f"django_blocknote/{js_entry['file']}"

        elif asset_name == "blocknote.css" or asset_name.endswith(".css"):
            # Look for the CSS entry (shows up as "style.css" in manifest)
            css_entry = manifest.get("style.css")
            if css_entry and "file" in css_entry:
                return f"django_blocknote/{css_entry['file']}"

        # Final fallback: return original path
        return f"django_blocknote/{asset_name}"

    except (FileNotFoundError, json.JSONDecodeError, KeyError) as e:
        # If anything goes wrong, fallback to original filename
        if getattr(settings, "DEBUG", False):
            print(f"Warning: Could not read Vite manifest for {asset_name}: {e}")
        return f"django_blocknote/{asset_name}"

