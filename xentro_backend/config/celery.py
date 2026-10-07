"""
Celery Task Queue Setup for Xentro
"""
import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("xentro_backend")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.conf.broker_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
app.conf.result_backend = os.getenv("REDIS_URL", "redis://localhost:6379/0")
app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
