# How to Add Template Management to Your Project

This guide shows you how to implement user template management in your Django project using Django BlockNote's `DocumentTemplate` model.

## What You'll Build

By the end of this guide, you'll have:
- Template creation and editing forms
- User-specific template listing
- Template deletion functionality
- Automatic cache management

## Prerequisites

- Django BlockNote installed and configured
- Basic familiarity with Django class-based views
- A Django project with user authentication

## Step 1: Create Your Forms

Create a form that inherits from Django BlockNote's form mixins to handle template creation and editing.

```python
# forms.py
from django import forms
from django_blocknote.models import DocumentTemplate
from django_blocknote.mixins import BlockNoteModelFormMixin
from django_blocknote.widgets import BlockNoteWidget

class DocumentTemplateForm(BlockNoteModelFormMixin):
    class Meta:
        model = DocumentTemplate
        fields = ['title', 'subtext', 'aliases', 'group', 'icon', 'content', 'show_in_menu']
        widgets = {
            'content': BlockNoteWidget(),
            'subtext': forms.TextInput(attrs={'maxlength': 20}),
            'aliases': forms.TextInput(attrs={
                'placeholder': 'meeting, notes, agenda',
                'help_text': 'Enter comma-separated search terms'
            }),
        }

    def clean_title(self):
        """Ensure unique titles per user"""
        title = self.cleaned_data['title']
        # Check for duplicate titles for this user
        if DocumentTemplate.objects.filter(
            user=self.user, 
            title=title
        ).exclude(pk=self.instance.pk if self.instance.pk else None).exists():
            raise forms.ValidationError("You already have a template with this title.")
        return title
```

## Step 2: Create Your Views

Set up views for template management using Django BlockNote's view mixins.

```python
# views.py
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import CreateView, UpdateView, DeleteView, ListView
from django.urls import reverse_lazy
from django.contrib import messages

from django_blocknote.models import DocumentTemplate
from django_blocknote.views.mixins import BlockNoteViewMixin
from .forms import DocumentTemplateForm

class TemplateListView(LoginRequiredMixin, ListView):
    """Display user's templates"""
    model = DocumentTemplate
    template_name = 'templates/template_list.html'
    context_object_name = 'templates'
    paginate_by = 10

    def get_queryset(self):
        """Only show current user's templates"""
        return DocumentTemplate.objects.filter(
            user=self.request.user
        ).order_by('group', 'title')

class TemplateCreateView(LoginRequiredMixin, BlockNoteViewMixin, CreateView):
    """Create a new template"""
    model = DocumentTemplate
    form_class = DocumentTemplateForm
    template_name = 'templates/template_form.html'
    success_url = reverse_lazy('template-list')

    def form_valid(self, form):
        """Set the user before saving"""
        form.instance.user = self.request.user
        messages.success(self.request, f"Template '{form.instance.title}' created successfully!")
        return super().form_valid(form)

class TemplateUpdateView(LoginRequiredMixin, BlockNoteViewMixin, UpdateView):
    """Edit an existing template"""
    model = DocumentTemplate
    form_class = DocumentTemplateForm
    template_name = 'templates/template_form.html'
    success_url = reverse_lazy('template-list')

    def get_queryset(self):
        """Users can only edit their own templates"""
        return DocumentTemplate.objects.filter(user=self.request.user)

    def form_valid(self, form):
        messages.success(self.request, f"Template '{form.instance.title}' updated successfully!")
        return super().form_valid(form)

class TemplateDeleteView(LoginRequiredMixin, DeleteView):
    """Delete a template"""
    model = DocumentTemplate
    template_name = 'templates/template_confirm_delete.html'
    success_url = reverse_lazy('template-list')

    def get_queryset(self):
        """Users can only delete their own templates"""
        return DocumentTemplate.objects.filter(user=self.request.user)

    def delete(self, request, *args, **kwargs):
        template = self.get_object()
        messages.success(request, f"Template '{template.title}' deleted successfully!")
        return super().delete(request, *args, **kwargs)
```

## Step 3: Configure URLs

Add URL patterns for your template views.

```python
# urls.py
from django.urls import path
from . import views

app_name = 'templates'

urlpatterns = [
    path('', views.TemplateListView.as_view(), name='template-list'),
    path('create/', views.TemplateCreateView.as_view(), name='template-create'),
    path('<int:pk>/edit/', views.TemplateUpdateView.as_view(), name='template-edit'),
    path('<int:pk>/delete/', views.TemplateDeleteView.as_view(), name='template-delete'),
]
```

## Step 4: Create Templates

### Template List (`templates/template_list.html`)

```html
{% extends 'base.html' %}
{% load static %}

{% block title %}My Templates{% endblock %}

{% block content %}
<div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">My Templates</h1>
        <a href="{% url 'templates:template-create' %}" 
           class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Create Template
        </a>
    </div>

    {% if templates %}
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {% for template in templates %}
            <div class="bg-white rounded-lg shadow-md p-6 border">
                <div class="flex items-center mb-2">
                    <span class="text-2xl mr-2">
                        {% if template.icon == 'meeting' %}📅
                        {% elif template.icon == 'document' %}📄
                        {% elif template.icon == 'checklist' %}✅
                        {% else %}📝{% endif %}
                    </span>
                    <h3 class="text-lg font-semibold">{{ template.title }}</h3>
                </div>
                
                {% if template.subtext %}
                <p class="text-gray-600 text-sm mb-2">{{ template.subtext }}</p>
                {% endif %}
                
                {% if template.group %}
                <span class="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mb-3">
                    {{ template.group }}
                </span>
                {% endif %}
                
                <div class="flex space-x-2">
                    <a href="{% url 'templates:template-edit' template.pk %}" 
                       class="text-blue-500 hover:text-blue-700 text-sm">Edit</a>
                    <a href="{% url 'templates:template-delete' template.pk %}" 
                       class="text-red-500 hover:text-red-700 text-sm">Delete</a>
                </div>
                
                <div class="text-xs text-gray-500 mt-2">
                    {% if template.show_in_menu %}
                        <span class="text-green-600">✓ Visible in menu</span>
                    {% else %}
                        <span class="text-gray-400">Hidden from menu</span>
                    {% endif %}
                </div>
            </div>
            {% endfor %}
        </div>

        {% if is_paginated %}
        <div class="mt-6 flex justify-center">
            <div class="flex space-x-2">
                {% if page_obj.has_previous %}
                <a href="?page={{ page_obj.previous_page_number }}" class="px-3 py-1 border rounded">Previous</a>
                {% endif %}
                
                <span class="px-3 py-1">Page {{ page_obj.number }} of {{ page_obj.paginator.num_pages }}</span>
                
                {% if page_obj.has_next %}
                <a href="?page={{ page_obj.next_page_number }}" class="px-3 py-1 border rounded">Next</a>
                {% endif %}
            </div>
        </div>
        {% endif %}
    {% else %}
        <div class="text-center py-12">
            <h3 class="text-xl text-gray-600 mb-4">No templates yet</h3>
            <p class="text-gray-500 mb-6">Create your first template to get started.</p>
            <a href="{% url 'templates:template-create' %}" 
               class="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600">
                Create Your First Template
            </a>
        </div>
    {% endif %}
</div>
{% endblock %}
```

### Template Form (`templates/template_form.html`)

```html
{% extends 'base.html' %}
{% load static %}

{% block title %}
{% if object %}Edit Template{% else %}Create Template{% endif %}
{% endblock %}

{% block content %}
<div class="container mx-auto px-4 py-8 max-w-4xl">
    <h1 class="text-3xl font-bold mb-6">
        {% if object %}Edit Template: {{ object.title }}{% else %}Create New Template{% endif %}
    </h1>

    <form method="post" class="space-y-6">
        {% csrf_token %}
        
        <div class="grid md:grid-cols-2 gap-6">
            <div>
                <label for="{{ form.title.id_for_label }}" class="block text-sm font-medium mb-2">
                    Template Title
                </label>
                {{ form.title }}
                {% if form.title.errors %}
                <p class="text-red-500 text-sm mt-1">{{ form.title.errors.0 }}</p>
                {% endif %}
            </div>

            <div>
                <label for="{{ form.subtext.id_for_label }}" class="block text-sm font-medium mb-2">
                    Subtext (max 20 chars)
                </label>
                {{ form.subtext }}
                {% if form.subtext.errors %}
                <p class="text-red-500 text-sm mt-1">{{ form.subtext.errors.0 }}</p>
                {% endif %}
            </div>
        </div>

        <div class="grid md:grid-cols-2 gap-6">
            <div>
                <label for="{{ form.group.id_for_label }}" class="block text-sm font-medium mb-2">
                    Group
                </label>
                {{ form.group }}
                <p class="text-gray-500 text-sm mt-1">Organize templates by category</p>
            </div>

            <div>
                <label for="{{ form.icon.id_for_label }}" class="block text-sm font-medium mb-2">
                    Icon
                </label>
                {{ form.icon }}
            </div>
        </div>

        <div>
            <label for="{{ form.aliases.id_for_label }}" class="block text-sm font-medium mb-2">
                Search Aliases
            </label>
            {{ form.aliases }}
            <p class="text-gray-500 text-sm mt-1">Comma-separated search terms (e.g., "meeting, notes, agenda")</p>
            {% if form.aliases.errors %}
            <p class="text-red-500 text-sm mt-1">{{ form.aliases.errors.0 }}</p>
            {% endif %}
        </div>

        <div>
            <label class="flex items-center">
                {{ form.show_in_menu }}
                <span class="ml-2 text-sm font-medium">Show in BlockNote menu</span>
            </label>
        </div>

        <div>
            <label for="{{ form.content.id_for_label }}" class="block text-sm font-medium mb-2">
                Template Content
            </label>
            {{ form.content }}
            {% if form.content.errors %}
            <p class="text-red-500 text-sm mt-1">{{ form.content.errors.0 }}</p>
            {% endif %}
        </div>

        <div class="flex space-x-4">
            <button type="submit" class="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
                {% if object %}Update Template{% else %}Create Template{% endif %}
            </button>
            <a href="{% url 'templates:template-list' %}" 
               class="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400">
                Cancel
            </a>
        </div>
    </form>
</div>
{% endblock %}
```

### Delete Confirmation (`templates/template_confirm_delete.html`)

```html
{% extends 'base.html' %}

{% block title %}Delete Template{% endblock %}

{% block content %}
<div class="container mx-auto px-4 py-8 max-w-2xl">
    <h1 class="text-3xl font-bold mb-6 text-red-600">Delete Template</h1>
    
    <div class="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <h2 class="text-lg font-semibold mb-2">Are you sure you want to delete "{{ object.title }}"?</h2>
        <p class="text-gray-700 mb-4">This action cannot be undone. The template will be permanently removed from your account and will no longer appear in the BlockNote menu.</p>
        
        {% if object.subtext %}
        <p class="text-sm text-gray-600 mb-2"><strong>Description:</strong> {{ object.subtext }}</p>
        {% endif %}
        
        {% if object.group %}
        <p class="text-sm text-gray-600 mb-2"><strong>Group:</strong> {{ object.group }}</p>
        {% endif %}
    </div>

    <form method="post" class="flex space-x-4">
        {% csrf_token %}
        <button type="submit" class="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600">
            Yes, Delete Template
        </button>
        <a href="{% url 'templates:template-list' %}" 
           class="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400">
            Cancel
        </a>
    </form>
</div>
{% endblock %}
```

## Step 5: Add Navigation Links

Add links to your template management in your base template or navigation.

```html
<!-- In your navigation menu -->
<a href="{% url 'templates:template-list' %}" class="nav-link">
    My Templates
</a>
```

## Implementation Flow

```{mermaid}
graph TD
    A[User visits template list] --> B[TemplateListView]
    B --> C[Filter by current user]
    C --> D[Display templates]
    
    E[User clicks Create] --> F[TemplateCreateView]
    F --> G[BlockNoteViewMixin injects user]
    G --> H[DocumentTemplateForm]
    H --> I[clean_aliases converts CSV to JSON]
    I --> J[Save template with user]
    J --> K[Cache automatically refreshed]
    
    L[User clicks Edit] --> M[TemplateUpdateView]
    M --> N[Check ownership]
    N --> O[Pre-populate form]
    O --> P[Save changes]
    P --> K
    
    Q[User clicks Delete] --> R[TemplateDeleteView]
    R --> S[Check ownership]
    S --> T[Confirm deletion]
    T --> U[Delete template]
    U --> K
    
    style K fill:#c8e6c9
    style G fill:#fff3e0
    style I fill:#e3f2fd
```

## What Happens Behind the Scenes

1. **Form Processing**: The `BlockNoteViewMixin` automatically injects the current user into forms
2. **Alias Conversion**: The `clean_aliases()` method converts CSV input to JSON strings for efficient storage
3. **Cache Management**: Django BlockNote automatically refreshes the user's template cache when templates are saved or deleted
4. **Security**: Views automatically filter templates by the current user to prevent unauthorized access

## Testing Your Implementation

1. **Create a template**: Visit `/templates/create/` and fill out the form
2. **Check the menu**: The template should appear in BlockNote's slash menu
3. **Edit templates**: Click edit from the template list
4. **Delete templates**: Use the delete confirmation flow
5. **Test aliases**: Add comma-separated aliases and verify they work in the slash menu search

## Next Steps

- Add template categories with custom icons
- Implement template sharing between users
- Add template import/export functionality
- Create template usage analytics

Your users can now create, edit, and manage their own BlockNote templates with automatic cache management and a clean, intuitive interface!
