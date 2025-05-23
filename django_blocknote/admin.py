from django.contrib import admin
from .models import Document
from .forms import DocumentForm


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    form = DocumentForm
    list_display = ["title", "created_by", "is_published", "created_at", "updated_at"]
    list_filter = ["is_published", "created_at", "updated_at"]
    search_fields = ["title", "created_by__username"]
    readonly_fields = ["created_at", "updated_at"]

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(created_by=request.user)

    def save_model(self, request, obj, form, change):
        if not change:  # Creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
