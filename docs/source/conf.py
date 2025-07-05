# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information
import os
import sys

sys.path.insert(0, os.path.abspath(".."))

__version__ = "2025.07.05.2"

project = "django-blocknote"
copyright = "2025, Ryan Sevelj & Mark Sevelj"
author = "Mark Sevelj"
release = __version__

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = [
    "myst_parser",
    "sphinx.ext.autodoc",
    "sphinx.ext.autosummary",
    "sphinx_copybutton",
    "sphinx_inline_tabs",
    "sphinx.ext.todo",
    "sphinxcontrib.mermaid",
]
mermaid_output_format = "raw"  # or 'png'
mermaid_params = ["--theme", "default"]

myst_enable_extensions = [
    "colon_fence",
    "html_admonition",
]

source_suffix = {
    ".rst": "restructuredtext",
    ".md": "markdown",
}


"""
The colon fence syntax is particularly useful because:

Cleaner nesting - Easier to nest directives inside each other
Better readability - The ::: stands out more than backticks
Compatibility - Works well with tools that might get confused by nested backticks
Flexibility - You can use different numbers of colons (:::, ::::, etc.) for nesting levels


## without colon_fence
```{note}
This is a note block
```

```{warning}
This is a warning
```
## with colon_fence
:::{note}
This is a note block
:::

:::{warning}
This is a warning
:::

::::{grid} 2
:::{card} Card 1
Content here
:::
:::{card} Card 2
More content
:::
::::

"""


templates_path = ["_templates"]
exclude_patterns = [
    "_build",
    "build",
    "Thumbs.db",
    ".DS_Store",
]


# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output
pygments_style = "monokai"
pygments_dark_style = "monokai"

html_theme = "furo"
html_static_path = ["_static"]

copybutton_prompt_text = (
    r"^\d{1,4}|^.\d{1,4}|>>> |\.\.\. |\s{2,6}|\$ |In \[\d*\]: | {2,5}\.\.\.: | {5,8}:"
)
copybutton_prompt_is_regexp = True

"""
# detailed download-url
# http://www.tldp.org/LDP/Bash-Beginners-Guide/Bash-Beginners-Guide.pdf \
# --dataset . \
# -m "add beginners guide on bash" \
# -O books/bash_guide.pdf
# is correctly pasted with the following setting
"""
copybutton_line_continuation_character = "\\"