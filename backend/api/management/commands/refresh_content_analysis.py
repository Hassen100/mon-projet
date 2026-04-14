from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError

from api.content_analyzer import refresh_all_analyses


class Command(BaseCommand):
    help = 'Refresh Content Intelligence analyses for priority URLs.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--urls',
            type=int,
            default=50,
            help='Number of priority URLs to analyze (default: 50)',
        )
        parser.add_argument(
            '--user-id',
            type=int,
            default=None,
            help='Optional user id to scope analysis.',
        )

    def handle(self, *args, **options):
        max_urls = max(1, min(options['urls'], 200))
        user_id = options.get('user_id')

        user = None
        if user_id:
            user = User.objects.filter(id=user_id).first()
            if user is None:
                raise CommandError(f'User with id={user_id} does not exist.')

        self.stdout.write(self.style.NOTICE(f'Starting content analysis refresh (max_urls={max_urls})...'))
        result = refresh_all_analyses(max_urls=max_urls, user=user)

        self.stdout.write(self.style.SUCCESS('Content analysis refresh completed.'))
        self.stdout.write(f"Total analyzed: {result.get('total', 0)}")
        self.stdout.write(f"Created: {result.get('created', 0)}")
        self.stdout.write(f"Updated: {result.get('updated', 0)}")
        self.stdout.write(f"Failed fetches: {result.get('failed', 0)}")
