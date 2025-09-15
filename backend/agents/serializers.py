from rest_framework import serializers
from .models import Agent, AgentKnowledge, Job


class AgentSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    user_id = serializers.UUIDField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Agent
        fields = [
            "id",
            "user_id",
            "name",
            "description",
            "purpose",
            "system_prompt",
            "model_name",
            "memory",
            "agent_state",
            "toolkits",
            "suggested_task_prompts",
            "suggested_job_prompts",
            "is_public",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("user_id", "created_at", "updated_at")


class AgentKnowledgeSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = AgentKnowledge
        fields = [
            "id",
            "agent",
            "title",
            "tags",
            "nodes_count",
            "relationships_count",
            "documents_count",
            "created_at",
        ]
        read_only_fields = ("nodes_count", "relationships_count", "documents_count", "created_at")


class JobSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Job
        fields = [
            "id",
            "agent",
            "title",
            "description",
            "status",
            "toolkit_slug",
            "trigger_slug",
            "connected_account_id",
            "trigger_config",
            "thread",
            "created_by_user_id",
            "last_run_at",
            "next_run_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = (
            "created_at",
            "updated_at",
            "last_run_at",
            "next_run_at",
            "toolkit_slug",
            "trigger_slug",
            "connected_account_id",
        )
