from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages
import json
from .models import Document
from .forms import DocumentForm


def document_list(request):
    """List all documents"""
    documents = (
        Document.objects.filter(created_by=request.user)
        if request.user.is_authenticated
        else []
    )
    return render(
        request, "django_blocknote/document_list.html", {"documents": documents}
    )


@login_required
def document_create(request):
    """Create a new document"""
    if request.method == "POST":
        form = DocumentForm(request.POST)
        if form.is_valid():
            document = form.save(commit=False)
            document.created_by = request.user
            document.save()
            messages.success(request, "Document created successfully!")
            return redirect("django_blocknote:document_edit", doc_id=document.id)
    else:
        form = DocumentForm()

    return render(
        request,
        "django_blocknote/document_form.html",
        {"form": form, "title": "Create Document"},
    )


@login_required
def document_edit(request, doc_id):
    """Edit document"""
    document = get_object_or_404(Document, id=doc_id, created_by=request.user)

    if request.method == "POST":
        form = DocumentForm(request.POST, instance=document)
        if form.is_valid():
            form.save()
            messages.success(request, "Document saved successfully!")
            return redirect("django_blocknote:document_edit", doc_id=document.id)
    else:
        form = DocumentForm(instance=document)

    return render(
        request,
        "django_blocknote/document_form.html",
        {"form": form, "document": document, "title": f"Edit: {document.title}"},
    )


def document_view(request, doc_id):
    """View document (read-only)"""
    document = get_object_or_404(Document, id=doc_id)
    return render(
        request, "django_blocknote/document_view.html", {"document": document}
    )


@require_http_methods(["POST"])
@csrf_exempt
def document_autosave(request, doc_id):
    """Auto-save document content via AJAX"""
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)

    document = get_object_or_404(Document, id=doc_id, created_by=request.user)

    try:
        data = json.loads(request.body)
        document.content = data.get("content", [])
        document.save(update_fields=["content", "updated_at"])
        return JsonResponse(
            {
                "status": "success",
                "message": "Document auto-saved",
                "updated_at": document.updated_at.isoformat(),
            }
        )
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
