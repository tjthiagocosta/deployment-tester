import os

from django.http import HttpResponse, JsonResponse
from django.urls import path


def root(_request):
    return HttpResponse('<h1 id="probe-marker">DJANGO_LIVE</h1>')


def healthz(_request):
    return JsonResponse({"ok": True, "framework": "django", "port": os.environ.get("PORT")})


urlpatterns = [path("", root), path("healthz", healthz)]
