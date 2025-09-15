from __future__ import annotations
from channels.generic.websocket import AsyncJsonWebsocketConsumer


class ThreadConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.thread_id = self.scope['url_route']['kwargs'].get('thread_id')
        self.group_name = f"thread_{self.thread_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        # Echo or ignore; server pushes events primarily
        pass

    # ---- Event handlers (names must match 'type') ----
    async def run_status(self, event):
        await self.send_json({"type": "run_status", **{k: v for k, v in event.items() if k != 'type'}})

    async def message_delta(self, event):
        await self.send_json({"type": "message_delta", **{k: v for k, v in event.items() if k != 'type'}})

    async def interrupt_request(self, event):
        await self.send_json({"type": "interrupt_request", **{k: v for k, v in event.items() if k != 'type'}})


class InboxConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs'].get('user_id')
        self.group_name = f"inbox_{self.user_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        pass

    async def inbox_item_new(self, event):
        await self.send_json({"type": "inbox_item_new", **{k: v for k, v in event.items() if k != 'type'}})

    async def inbox_item_updated(self, event):
        await self.send_json({"type": "inbox_item_updated", **{k: v for k, v in event.items() if k != 'type'}})


