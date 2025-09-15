from __future__ import absolute_import, unicode_literals
import os
from celery import Celery

# Default Django settings module for 'celery' command-line program
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'djapp.settings')

app = Celery('djapp')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# Namespace ensures all celery-related settings keys have `CELERY_` prefix in Django settings.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all registered Django app configs.
app.autodiscover_tasks()


@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
