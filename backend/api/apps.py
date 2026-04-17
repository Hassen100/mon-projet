from django.apps import AppConfig
from django.core.management import call_command


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        """Initialize Google credentials from .env file on app startup"""
        # DISABLED: This was causing database connection errors during startup
        # The ready() method is trying to access the database before migrations are run
        # TODO: Move this to a post_migrate signal or management command instead
        pass
