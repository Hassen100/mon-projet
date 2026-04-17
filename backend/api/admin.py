from django.contrib import admin
from .models import ContentAnalysis


@admin.register(ContentAnalysis)
class ContentAnalysisAdmin(admin.ModelAdmin):
	list_display = ('url', 'user', 'semantic_score', 'technical_score', 'last_updated')
	search_fields = ('url', 'user__username', 'user__email')
	list_filter = ('last_updated',)

