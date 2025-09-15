from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AgentViewSet, finalize_setup_view, ambient_test_view, upload_knowledge_view, jobs_collection, job_detail

router = DefaultRouter()
router.register(r"", AgentViewSet, basename="agent")

urlpatterns = [
    # DRF router for AgentViewSet (list/create at '', detail at '/<pk>/')
    path("", include(router.urls)),
    # Wizard support endpoints
    path("finalize-setup", finalize_setup_view, name="agents_finalize_setup"),
    path("<uuid:agent_id>/ambient-test", ambient_test_view, name="agents_ambient_test"),
    path("<uuid:agent_id>/knowledge/upload", upload_knowledge_view, name="agents_knowledge_upload"),
    # Jobs API
    path("<uuid:agent_id>/jobs/", jobs_collection, name="agents_jobs_collection"),
    path("jobs/<uuid:id>", job_detail, name="agents_job_detail"),
]
