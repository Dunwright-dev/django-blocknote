# mixins.py
from django import forms

from .widgets import BlockNoteWidget


class BlockNoteUserViewMixin:
    """
    Pure view mixin to automatically pass user to forms with BlockNote widgets.
    Handles both regular forms and formsets/inlines.

    Works with any Django view that has get_form method.
    No inheritance conflicts - can be used with any generic view.

    Usage:
        class MyCreateView(BlockNoteUserViewMixin, CreateView):
            model = MyModel
            form_class = MyForm
    """

    def get_form_kwargs(self):
        """Add user to form kwargs for BlockNote widgets (fallback method)"""
        kwargs = super().get_form_kwargs()
        if hasattr(self.request, "user") and self.request.user.is_authenticated:
            kwargs["user"] = self.request.user
        return kwargs

    def get_form(self, form_class=None):
        """
        Enhanced form creation with BlockNote-specific validation and context.
        Provides better error messages and conditional user injection.
        """
        if form_class is None:
            form_class = self.get_form_class()

        # Validate that form supports BlockNote functionality
        # if not issubclass(form_class, BlockNoteUserFormMixin):
        #     raise ImproperlyConfigured(
        #         f"Form {form_class} must inherit from BlockNoteUserFormMixin "
        #         f"to use BlockNote user templates."
        #     )

        form_kwargs = self.get_form_kwargs()

        # Only add user if not already present (plays nice with other mixins)
        if (
            "user" not in form_kwargs
            and hasattr(self.request, "user")
            and self.request.user.is_authenticated
        ):
            form_kwargs["user"] = self.request.user

        # Future: Add other BlockNote-specific context here
        # form_kwargs["editor_permissions"] = self.get_editor_permissions()
        # form_kwargs["template_context"] = self.get_template_context()

        return form_class(**form_kwargs)

    def get_formset_kwargs(self):
        """Add user to formset kwargs for inline forms with BlockNote widgets"""
        kwargs = super().get_formset_kwargs()
        if hasattr(self.request, "user") and self.request.user.is_authenticated:
            kwargs["user"] = self.request.user
        return kwargs


class BlockNoteUserFormMixin:
    """
    Form mixin to automatically configure BlockNote widgets with user templates.
    Automatically detects BlockNote widgets and passes user context via widget attrs.

    Usage:
        class MyForm(BlockNoteUserFormMixin, forms.ModelForm):
            content = forms.CharField(widget=BlockNoteWidget())

            class Meta:
                model = MyModel
                fields = ['content']
    """

    def __init__(self, *args, **kwargs):
        """Initialize form and configure BlockNote widgets with user"""
        # Extract user from kwargs BEFORE calling super() to avoid TypeError
        self.user = kwargs.pop("user", None)
        super().__init__(*args, **kwargs)

        # Configure all BlockNote widgets with user context
        self._configure_blocknote_widgets()

    def _configure_blocknote_widgets(self):
        """Find and configure all BlockNote widgets with user context via attrs"""
        if not self.user:
            return

        configured_count = 0
        for field_name, field in self.fields.items():
            if isinstance(field.widget, BlockNoteWidget):
                # Use widget.attrs pattern (standard Django approach)
                field.widget.attrs.update(
                    {
                        "user": self.user,
                        "field_name": field_name,  # Could be useful for field-specific logic
                    },
                )
                configured_count += 1

                # Debug logging in development
                if hasattr(self, "_debug_widget_config"):
                    print(
                        f"✅ Configured BlockNote widget '{field_name}' for user {self.user.username}",
                    )

        # Optional debug output
        if configured_count > 0 and hasattr(self, "_debug_widget_config"):
            print(
                f"🎯 Configured {configured_count} BlockNote widget(s) for user {self.user.username}",
            )


class BlockNoteUserFormsetMixin:
    """
    Formset mixin to handle user context for forms containing BlockNote widgets.
    Use this with Django formsets that contain forms with BlockNote widgets.

    Usage:
        MyFormSet = formset_factory(MyForm, formset=BlockNoteUserFormsetMixin)
        formset = MyFormSet(user=request.user)
    """

    def __init__(self, *args, **kwargs):
        """Initialize formset and pass user to all forms"""
        # Extract user from kwargs BEFORE calling super()
        self.user = kwargs.pop("user", None)
        super().__init__(*args, **kwargs)

    def get_form_kwargs(self, index):
        """Pass user to individual forms in the formset"""
        kwargs = (
            super().get_form_kwargs(index)
            if hasattr(super(), "get_form_kwargs")
            else {}
        )
        if self.user:
            kwargs["user"] = self.user
        return kwargs

    def _construct_form(self, i, **kwargs):
        """Ensure user is passed when constructing forms"""
        if self.user and "user" not in kwargs:
            kwargs["user"] = self.user
        return super()._construct_form(i, **kwargs)


# Optional: Combined mixin for most common use case
class BlockNoteFormMixin(BlockNoteUserFormMixin, forms.Form):
    """
    Complete form mixin combining BlockNote functionality.
    Use this as a drop-in replacement for forms.Form or forms.ModelForm.

    Usage:
        class MyForm(BlockNoteFormMixin):
            content = forms.CharField(widget=BlockNoteWidget())
    """


class BlockNoteModelFormMixin(BlockNoteUserFormMixin, forms.ModelForm):
    """
    Complete ModelForm mixin combining BlockNote functionality.
    Use this as a drop-in replacement for forms.ModelForm.

    Usage:
        class MyModelForm(BlockNoteModelFormMixin):
            class Meta:
                model = MyModel
                fields = ['content']
                widgets = {
                    'content': BlockNoteWidget()
                }
    """


# Usage examples and documentation
"""
COMPLETE USAGE EXAMPLES:

1. Simple View + Form:
    
    class BlogPostForm(BlockNoteModelFormMixin):
        class Meta:
            model = BlogPost
            fields = ['title', 'content']
            widgets = {
                'content': BlockNoteWidget()
            }
    
    class BlogPostCreateView(BlockNoteUserViewMixin, CreateView):
        model = BlogPost
        form_class = BlogPostForm

2. Multiple BlockNote fields:
    
    class ArticleForm(BlockNoteModelFormMixin):
        intro = forms.CharField(widget=BlockNoteWidget())
        content = forms.CharField(widget=BlockNoteWidget())
        conclusion = forms.CharField(widget=BlockNoteWidget())
        
        class Meta:
            model = Article
            fields = ['title', 'intro', 'content', 'conclusion']

3. Inline formsets:
    
    class SectionForm(BlockNoteFormMixin):
        content = forms.CharField(widget=BlockNoteWidget())
    
    SectionFormSet = inlineformset_factory(
        Article, Section, 
        form=SectionForm,
        formset=BlockNoteUserFormsetMixin
    )
    
    class ArticleUpdateView(BlockNoteUserViewMixin, UpdateView):
        model = Article
        
        def get_context_data(self, **kwargs):
            context = super().get_context_data(**kwargs)
            context['section_formset'] = SectionFormSet(
                instance=self.object,
                user=self.request.user
            )
            return context

4. Function-based views:
    
    def create_post(request):
        if request.method == 'POST':
            form = BlogPostForm(request.POST, user=request.user)
            if form.is_valid():
                form.save()
                return redirect('success')
        else:
            form = BlogPostForm(user=request.user)
        return render(request, 'create.html', {'form': form})

DEBUGGING:
Add _debug_widget_config = True to your form class to see configuration debug output.

    class MyForm(BlockNoteModelFormMixin):
        _debug_widget_config = True  # Enable debug output
        
        class Meta:
            model = MyModel
            fields = ['content']
"""

