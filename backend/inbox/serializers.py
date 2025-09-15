from rest_framework import serializers
from .models import InboxItem


class InboxItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InboxItem
        fields = [
            "id",
            "user_id",
            "agent",
            "thread",
            "run",
            "correlation_id",
            "title",
            "body_json",
            "item_type",
            "status",
            "read_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]
