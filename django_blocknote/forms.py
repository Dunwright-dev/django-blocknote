from django import forms
from .widgets import BlockNoteWidget
from .models import Document


class DocumentForm(forms.ModelForm):
    """Example form using BlockNote widget"""

    class Meta:
        model = Document
        fields = ["title", "content", "is_published"]
        widgets = {
            "content": BlockNoteWidget(
                {
                    "toolbar": True,
                    "spellCheck": True,
                    "placeholder": "Start writing your content...",
                }
            )
        }


class BlockNoteForm(forms.Form):
    """Generic form with BlockNote field"""

    content = forms.CharField(
        widget=BlockNoteWidget(
            {"toolbar": ["bold", "italic", "underline", "code", "link"]}
        ),
        required=False,
    )
