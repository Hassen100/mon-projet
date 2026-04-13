from django.urls import path

from .views import (
    api_root,
    auth_users,
    health,
    debug_config,
    login,
    register,
    set_google_config,
    get_analytics_summary,
    get_top_pages,
    get_analytics_graph_data,
    get_search_summary,
    get_top_queries,
    get_search_pages,
    get_search_graph_data,
    get_analytics_data,
    pagespeed_insights,
    analyze_url,
    get_url_history,
    recommend_page,
)

urlpatterns = [
    path('', api_root, name='api-root'),
    path('health/', health, name='health'),
    path('debug-config/', debug_config, name='debug-config'),
    path('register/', register, name='register'),
    path('login/', login, name='login'),
    path('auth-users/', auth_users, name='auth-users'),
    
    # Google Analytics endpoints
    path('google-config/', set_google_config, name='set-google-config'),
    path('analytics/', get_analytics_data, name='analytics-data'),
    path('analytics/summary/', get_analytics_summary, name='analytics-summary'),
    path('analytics/top-pages/', get_top_pages, name='analytics-top-pages'),
    path('analytics/graph/', get_analytics_graph_data, name='analytics-graph'),
    
    # Google Search Console endpoints
    path('search/summary/', get_search_summary, name='search-summary'),
    path('search/top-queries/', get_top_queries, name='search-top-queries'),
    path('search/pages/', get_search_pages, name='search-pages'),
    path('search/graph/', get_search_graph_data, name='search-graph'),

    # PageSpeed endpoint
    path('pagespeed/', pagespeed_insights, name='pagespeed-insights'),
    
    # URL Analysis endpoints
    path('analyze-url/', analyze_url, name='analyze-url'),
    path('url-history/', get_url_history, name='url-history'),

    # AI recommendation endpoints
    path('ai/recommend/page/', recommend_page, name='recommend-page'),
]
