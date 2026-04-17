from __future__ import annotations

import math
import time
from collections import Counter
from datetime import timedelta
from typing import Any
from urllib.parse import urljoin, urlparse

import requests
from django.conf import settings
from django.db.models import Avg, Sum
from django.utils import timezone

try:
    from bs4 import BeautifulSoup
except Exception:  # pragma: no cover - fallback when bs4 is unavailable.
    BeautifulSoup = None

from .models import (
    ContentAnalysis,
    GoogleAnalyticsData,
    GoogleAnalyticsPageData,
    GoogleSearchConsoleData,
    GoogleSearchConsolePageData,
)

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
except Exception:  # pragma: no cover - fallback when sklearn is unavailable.
    TfidfVectorizer = None
    cosine_similarity = None


REQUEST_HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/124.0.0.0 Safari/537.36'
    ),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
}

_REQUEST_INTERVAL_SECONDS = 0.2
_LAST_REQUEST_AT = 0.0


def _rate_limited_request(method: str, url: str, **kwargs) -> requests.Response:
    global _LAST_REQUEST_AT
    elapsed = time.monotonic() - _LAST_REQUEST_AT
    if elapsed < _REQUEST_INTERVAL_SECONDS:
        time.sleep(_REQUEST_INTERVAL_SECONDS - elapsed)
    response = requests.request(method=method, url=url, **kwargs)
    _LAST_REQUEST_AT = time.monotonic()
    return response


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _extract_text_tokens(text: str, limit: int = 15) -> list[str]:
    words = [w.strip(".,;:!?()[]{}\"'`)./\\").lower() for w in text.split()]
    words = [w for w in words if len(w) > 3 and not w.isdigit()]
    most_common = Counter(words).most_common(limit)
    return [item[0] for item in most_common]


def _parse_html_content(html: str, url: str) -> dict[str, Any]:
    if BeautifulSoup is None:
        text_only = ' '.join(html.replace('<', ' <').replace('>', '> ').split())
        return {
            'url': url,
            'title': '',
            'meta_description': '',
            'headings': {'h1': [], 'h2': [], 'h3': []},
            'paragraphs': [],
            'images': [],
            'internal_links': [],
            'full_text': text_only,
            'word_count': len([w for w in text_only.split() if w.strip()]),
            'h2_count': 0,
            'has_list_or_table': False,
            'has_list': False,
            'has_table': False,
            'top_terms': _extract_text_tokens(text_only),
        }

    soup = BeautifulSoup(html, 'html.parser')
    parsed_url = urlparse(url)
    own_domain = parsed_url.netloc

    title_tag = soup.find('title')
    meta_description_tag = soup.find('meta', attrs={'name': 'description'})

    headings = {
        'h1': [item.get_text(' ', strip=True) for item in soup.find_all('h1')],
        'h2': [item.get_text(' ', strip=True) for item in soup.find_all('h2')],
        'h3': [item.get_text(' ', strip=True) for item in soup.find_all('h3')],
    }
    paragraphs = [p.get_text(' ', strip=True) for p in soup.find_all('p') if p.get_text(' ', strip=True)]

    images = []
    for image in soup.find_all('img'):
        src = (image.get('src') or '').strip()
        if not src:
            continue
        images.append(
            {
                'src': urljoin(url, src),
                'alt': (image.get('alt') or '').strip(),
            }
        )

    internal_links = []
    for anchor in soup.find_all('a'):
        href = (anchor.get('href') or '').strip()
        if not href or href.startswith('#') or href.startswith('mailto:') or href.startswith('tel:'):
            continue
        absolute = urljoin(url, href)
        parsed_link = urlparse(absolute)
        if not parsed_link.scheme.startswith('http'):
            continue
        if parsed_link.netloc == own_domain or not parsed_link.netloc:
            internal_links.append(absolute)

    full_text = ' '.join(paragraphs + headings['h1'] + headings['h2'] + headings['h3']).strip()
    word_count = len([w for w in full_text.split() if w.strip()])

    has_list = bool(soup.find('ul') or soup.find('ol'))
    has_table = bool(soup.find('table'))

    return {
        'url': url,
        'title': title_tag.get_text(' ', strip=True) if title_tag else '',
        'meta_description': (meta_description_tag.get('content') or '').strip() if meta_description_tag else '',
        'headings': headings,
        'paragraphs': paragraphs,
        'images': images,
        'internal_links': sorted(set(internal_links)),
        'full_text': full_text,
        'word_count': word_count,
        'h2_count': len(headings['h2']),
        'has_list_or_table': has_list or has_table,
        'has_list': has_list,
        'has_table': has_table,
        'top_terms': _extract_text_tokens(full_text),
    }


def fetch_page_html(url: str) -> dict[str, Any]:
    """Fetch and parse one page with resilient error handling."""
    try:
        response = _rate_limited_request(
            'GET',
            url,
            headers=REQUEST_HEADERS,
            timeout=10,
            allow_redirects=True,
        )
        if response.status_code >= 400:
            return {
                'ok': False,
                'url': url,
                'status_code': response.status_code,
                'error': f'HTTP {response.status_code}',
                'content': {},
            }

        parsed = _parse_html_content(response.text, response.url)
        return {
            'ok': True,
            'url': response.url,
            'status_code': response.status_code,
            'error': '',
            'content': parsed,
        }
    except requests.RequestException as exc:
        return {
            'ok': False,
            'url': url,
            'status_code': 0,
            'error': str(exc),
            'content': {},
        }


def _build_base_site_url(user) -> str:
    first_page = (
        GoogleSearchConsolePageData.objects.filter(user=user)
        .values_list('page_url', flat=True)
        .first()
    )
    if first_page:
        parsed = urlparse(first_page)
        return f'{parsed.scheme}://{parsed.netloc}'

    site_url = getattr(settings, 'GSC_SITE_URL', '').strip()
    if site_url:
        parsed = urlparse(site_url)
        if parsed.scheme and parsed.netloc:
            return f'{parsed.scheme}://{parsed.netloc}'

    return 'http://127.0.0.1:4200'


def _to_absolute_url(path_or_url: str, base_site_url: str) -> str:
    if not path_or_url:
        return base_site_url
    if path_or_url.startswith('http://') or path_or_url.startswith('https://'):
        return path_or_url
    return urljoin(base_site_url.rstrip('/') + '/', path_or_url.lstrip('/'))


def _keywords_for_url(user, days: int = 30, limit: int = 10) -> list[dict[str, Any]]:
    start_date = timezone.now().date() - timedelta(days=days)
    keywords = (
        GoogleSearchConsoleData.objects.filter(user=user, date__gte=start_date)
        .values('query')
        .annotate(
            total_clicks=Sum('clicks'),
            total_impressions=Sum('impressions'),
            avg_position=Avg('position'),
        )
        .order_by('-total_impressions', 'avg_position')[:limit]
    )

    return [
        {
            'query': item['query'],
            'clicks': _safe_int(item['total_clicks']),
            'impressions': _safe_int(item['total_impressions']),
            'position': round(_safe_float(item['avg_position']), 2),
        }
        for item in keywords
        if item['query']
    ]


def get_priority_urls(user, max_urls: int = 50, days: int = 30) -> list[dict[str, Any]]:
    """Return priority URLs based on GA page traffic and engagement signals."""
    start_date = timezone.now().date() - timedelta(days=days)

    base_site_url = _build_base_site_url(user)
    ga_daily = GoogleAnalyticsData.objects.filter(user=user, date__gte=start_date)
    avg_bounce_rate = _safe_float(ga_daily.aggregate(value=Avg('bounce_rate'))['value'])

    page_rows = (
        GoogleAnalyticsPageData.objects.filter(user=user, date__gte=start_date)
        .values('page_path')
        .annotate(total_sessions=Sum('sessions'), total_views=Sum('screen_page_views'))
        .order_by('-total_sessions', '-total_views')
    )

    keywords = _keywords_for_url(user, days=days, limit=12)
    selected: list[dict[str, Any]] = []

    for row in page_rows[: max_urls * 2]:
        sessions = _safe_int(row['total_sessions'])
        views = _safe_int(row['total_views'])
        if sessions <= 0 and views <= 0:
            continue

        # Approximation when page-level GA engagement fields are unavailable.
        avg_session_duration = round(max(10.0, min(240.0, (views / max(sessions, 1)) * 45.0)), 1)
        engagement_flag = avg_bounce_rate > 70.0 or avg_session_duration < 30.0

        selected.append(
            {
                'url': _to_absolute_url(row['page_path'], base_site_url),
                'page_path': row['page_path'],
                'sessions': sessions,
                'views': views,
                'bounce_rate': round(avg_bounce_rate, 2),
                'avg_session_duration': avg_session_duration,
                'engagement_flag': engagement_flag,
                'keywords': keywords,
            }
        )

    # Fallback 1: if GA page-level data is missing, use Search Console page URLs.
    if not selected:
        gsc_rows = (
            GoogleSearchConsolePageData.objects.filter(user=user, date__gte=start_date)
            .values('page_url')
            .annotate(total_clicks=Sum('clicks'), total_impressions=Sum('impressions'))
            .order_by('-total_clicks', '-total_impressions')
        )

        # If recent data is empty, fallback to all-time GSC pages for bootstrap.
        if not gsc_rows:
            gsc_rows = (
                GoogleSearchConsolePageData.objects.filter(user=user)
                .values('page_url')
                .annotate(total_clicks=Sum('clicks'), total_impressions=Sum('impressions'))
                .order_by('-total_clicks', '-total_impressions')
            )

        for row in gsc_rows[: max_urls * 2]:
            page_url = (row.get('page_url') or '').strip()
            if not page_url:
                continue

            impressions = _safe_int(row.get('total_impressions'))
            clicks = _safe_int(row.get('total_clicks'))
            estimated_sessions = max(clicks, math.floor(impressions * 0.12))

            selected.append(
                {
                    'url': page_url,
                    'page_path': page_url,
                    'sessions': estimated_sessions,
                    'views': max(estimated_sessions, clicks),
                    'bounce_rate': round(avg_bounce_rate, 2),
                    'avg_session_duration': 75.0,
                    'engagement_flag': avg_bounce_rate > 70.0,
                    'keywords': keywords,
                }
            )

    # Fallback 2: if no GA/GSC page rows exist, analyze the site root as a bootstrap target.
    if not selected:
        selected.append(
            {
                'url': base_site_url.rstrip('/') + '/',
                'page_path': '/',
                'sessions': 1,
                'views': 1,
                'bounce_rate': round(avg_bounce_rate, 2),
                'avg_session_duration': 60.0,
                'engagement_flag': True,
                'keywords': keywords,
            }
        )

    selected.sort(key=lambda item: (item['engagement_flag'], item['sessions'], item['views']), reverse=True)
    return selected[:max_urls]


def _pick_primary_keyword(keywords: list[dict[str, Any]]) -> str:
    if not keywords:
        return ''

    sorted_keywords = sorted(
        keywords,
        key=lambda k: (-_safe_int(k.get('impressions')), _safe_float(k.get('position'), 999.0), -_safe_int(k.get('clicks'))),
    )
    return sorted_keywords[0].get('query', '')


def _serp_results_google_cse(keyword: str, limit: int = 3) -> list[dict[str, str]]:
    api_key = getattr(settings, 'GOOGLE_CSE_API_KEY', '')
    cx = getattr(settings, 'GOOGLE_CSE_CX', '')
    if not api_key or not cx:
        return []

    try:
        response = _rate_limited_request(
            'GET',
            'https://www.googleapis.com/customsearch/v1',
            params={'key': api_key, 'cx': cx, 'q': keyword, 'num': limit},
            timeout=10,
        )
        if response.status_code >= 400:
            return []
        payload = response.json()
        items = payload.get('items', [])
        return [
            {
                'title': item.get('title', ''),
                'url': item.get('link', ''),
                'snippet': item.get('snippet', ''),
            }
            for item in items
            if item.get('link')
        ][:limit]
    except Exception:
        return []


def _serp_results_serpapi(keyword: str, limit: int = 3) -> list[dict[str, str]]:
    api_key = getattr(settings, 'SERPAPI_API_KEY', '')
    if not api_key:
        return []

    try:
        response = _rate_limited_request(
            'GET',
            'https://serpapi.com/search.json',
            params={'engine': 'google', 'q': keyword, 'api_key': api_key, 'num': limit},
            timeout=10,
        )
        if response.status_code >= 400:
            return []
        payload = response.json()
        items = payload.get('organic_results', [])
        return [
            {
                'title': item.get('title', ''),
                'url': item.get('link', ''),
                'snippet': item.get('snippet', ''),
            }
            for item in items
            if item.get('link')
        ][:limit]
    except Exception:
        return []


def _mock_serp_results(keyword: str, limit: int = 3) -> list[dict[str, str]]:
    slug = '-'.join(keyword.lower().split()[:4]) or 'guide-seo'
    urls = [
        f'https://www.semrush.com/blog/{slug}/',
        f'https://ahrefs.com/blog/{slug}/',
        f'https://www.searchenginejournal.com/{slug}/',
    ]
    return [
        {
            'title': f'Resultat concurrent {index + 1} - {keyword}',
            'url': urls[index],
            'snippet': f'Contenu concurrent pour {keyword}.',
        }
        for index in range(min(limit, len(urls)))
    ]


def _search_serp(keyword: str, limit: int = 3) -> list[dict[str, str]]:
    provider = getattr(settings, 'SERP_PROVIDER', 'google_cse').lower()
    if provider == 'serpapi':
        rows = _serp_results_serpapi(keyword, limit)
    else:
        rows = _serp_results_google_cse(keyword, limit)
    return rows or _mock_serp_results(keyword, limit)


def _cosine_similarity_pair(text_a: str, text_b: str) -> float:
    if not text_a.strip() or not text_b.strip():
        return 0.0

    if TfidfVectorizer is None or cosine_similarity is None:
        words_a = set(text_a.lower().split())
        words_b = set(text_b.lower().split())
        if not words_a or not words_b:
            return 0.0
        overlap = len(words_a.intersection(words_b))
        return overlap / max(len(words_a.union(words_b)), 1)

    vectorizer = TfidfVectorizer(stop_words='english', max_features=2500)
    matrix = vectorizer.fit_transform([text_a, text_b])
    return float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0])


def _missing_competitor_terms(own_text: str, competitor_texts: list[str], limit: int = 12) -> list[str]:
    own_tokens = set(_extract_text_tokens(own_text, limit=100))
    competitor_tokens: list[str] = []
    for text in competitor_texts:
        competitor_tokens.extend(_extract_text_tokens(text, limit=30))

    counts = Counter(token for token in competitor_tokens if token not in own_tokens)
    return [word for word, _ in counts.most_common(limit)]


def analyze_competitors(url: str, keyword: str, own_page_content: dict[str, Any] | None = None) -> dict[str, Any]:
    """Collect competitor data from SERP and compare with current page."""
    own_fetch = own_page_content or fetch_page_html(url)
    own_content = own_fetch.get('content', {}) if own_fetch else {}

    if not keyword:
        return {
            'keyword': '',
            'serp_results': [],
            'competitors': [],
            'avg_similarity': 0.0,
            'missing_terms': [],
            'avg_competitor_word_count': 0,
            'comparison': {},
        }

    serp_rows = _search_serp(keyword, limit=3)
    competitors = []
    competitor_texts = []
    similarities = []

    for row in serp_rows:
        competitor_fetch = fetch_page_html(row['url'])
        comp_content = competitor_fetch.get('content', {}) if competitor_fetch else {}

        similarity = _cosine_similarity_pair(
            own_content.get('full_text', ''),
            comp_content.get('full_text', ''),
        )
        similarities.append(similarity)
        competitor_texts.append(comp_content.get('full_text', ''))

        competitors.append(
            {
                'title': row.get('title', ''),
                'url': row.get('url', ''),
                'snippet': row.get('snippet', ''),
                'fetch_ok': competitor_fetch.get('ok', False),
                'word_count': _safe_int(comp_content.get('word_count')),
                'h2_count': _safe_int(comp_content.get('h2_count')),
                'has_list_or_table': bool(comp_content.get('has_list_or_table')),
                'top_terms': comp_content.get('top_terms', []),
                'similarity': round(similarity, 4),
            }
        )

    avg_comp_words = 0
    if competitors:
        avg_comp_words = round(sum(item['word_count'] for item in competitors) / len(competitors))

    missing_terms = _missing_competitor_terms(own_content.get('full_text', ''), competitor_texts)

    return {
        'keyword': keyword,
        'serp_results': serp_rows,
        'competitors': competitors,
        'avg_similarity': round(sum(similarities) / len(similarities), 4) if similarities else 0.0,
        'missing_terms': missing_terms,
        'avg_competitor_word_count': avg_comp_words,
        'comparison': {
            'own_word_count': _safe_int(own_content.get('word_count')),
            'own_h2_count': _safe_int(own_content.get('h2_count')),
            'own_has_list_or_table': bool(own_content.get('has_list_or_table')),
        },
    }


def compute_semantic_score(
    own_content: dict[str, Any],
    competitor_data: dict[str, Any],
    bounce_rate: float,
    avg_session_duration: float,
) -> dict[str, Any]:
    similarity = _safe_float(competitor_data.get('avg_similarity'))
    coverage_points = max(0.0, min(1.0, similarity)) * 50.0

    structure_points = 0
    h2_count = _safe_int(own_content.get('h2_count'))
    if h2_count >= 3:
        structure_points += 10

    if own_content.get('has_list_or_table'):
        structure_points += 10

    own_words = _safe_int(own_content.get('word_count'))
    avg_comp_words = _safe_int(competitor_data.get('avg_competitor_word_count'))
    target_words = max(1000, math.floor(avg_comp_words * 0.8)) if avg_comp_words else 1000
    if own_words >= target_words:
        structure_points += 10

    engagement_points = 0
    if bounce_rate < 50:
        engagement_points += 10
    if avg_session_duration > 90:
        engagement_points += 10

    total_score = int(round(coverage_points + structure_points + engagement_points))
    total_score = max(0, min(100, total_score))

    return {
        'total': total_score,
        'breakdown': {
            'coverage_points': round(coverage_points, 2),
            'structure_points': structure_points,
            'engagement_points': engagement_points,
            'h2_count': h2_count,
            'word_count': own_words,
            'target_word_count': target_words,
            'similarity': round(similarity, 4),
            'bounce_rate': round(_safe_float(bounce_rate), 2),
            'avg_session_duration': round(_safe_float(avg_session_duration), 2),
        },
    }


def check_technical_seo(
    page_content: dict[str, Any],
    duplicate_urls: list[str] | None = None,
) -> dict[str, Any]:
    duplicate_urls = duplicate_urls or []

    issues: dict[str, Any] = {
        'title': {'present': bool(page_content.get('title')), 'length_ok': False, 'length': 0},
        'meta_description': {'present': bool(page_content.get('meta_description')), 'length_ok': False, 'length': 0},
        'images_missing_alt': [],
        'broken_internal_links': [],
        'duplicate_pages': duplicate_urls,
    }

    score = 100

    title = page_content.get('title', '') or ''
    title_length = len(title)
    issues['title']['length'] = title_length
    if not title:
        score -= 15
    elif not (30 <= title_length <= 70):
        score -= 10
        issues['title']['length_ok'] = False
    else:
        issues['title']['length_ok'] = True

    meta_description = page_content.get('meta_description', '') or ''
    description_length = len(meta_description)
    issues['meta_description']['length'] = description_length
    if not meta_description:
        score -= 15
    elif not (50 <= description_length <= 160):
        score -= 10
        issues['meta_description']['length_ok'] = False
    else:
        issues['meta_description']['length_ok'] = True

    for image in page_content.get('images', []):
        if not (image.get('alt') or '').strip():
            issues['images_missing_alt'].append(image.get('src', ''))

    score -= min(len(issues['images_missing_alt']) * 5, 25)

    for link in page_content.get('internal_links', [])[:30]:
        try:
            response = _rate_limited_request('HEAD', link, headers=REQUEST_HEADERS, timeout=10, allow_redirects=True)
            if response.status_code >= 400:
                issues['broken_internal_links'].append({'url': link, 'status': response.status_code})
        except requests.RequestException:
            issues['broken_internal_links'].append({'url': link, 'status': 'error'})

    score -= min(len(issues['broken_internal_links']) * 5, 25)

    if duplicate_urls:
        score -= 20

    score = max(0, min(100, score))
    return {'score': score, 'issues': issues}


def _build_recommendations(
    page_url: str,
    own_content: dict[str, Any],
    competitor_data: dict[str, Any],
    semantic_breakdown: dict[str, Any],
    technical_issues: dict[str, Any],
) -> list[dict[str, str]]:
    recs: list[dict[str, str]] = []

    own_words = _safe_int(own_content.get('word_count'))
    avg_comp_words = _safe_int(competitor_data.get('avg_competitor_word_count'))
    if avg_comp_words > own_words + 250:
        gap = avg_comp_words - own_words
        recs.append(
            {
                'priority': 'haute',
                'title': 'Longueur insuffisante',
                'message': (
                    f'Votre contenu compte environ {own_words} mots contre {avg_comp_words} en moyenne chez les concurrents. '
                    f'Ajoutez environ {gap} mots sur les sous-themes prioritaires.'
                ),
            }
        )

    if _safe_int(own_content.get('h2_count')) < 3:
        recs.append(
            {
                'priority': 'haute',
                'title': 'Structure a renforcer',
                'message': 'Ajoutez davantage de sous-titres H2 pour clarifier les sections et ameliorer la lisibilite.',
            }
        )

    if not own_content.get('has_list_or_table'):
        recs.append(
            {
                'priority': 'moyenne',
                'title': 'Intention de recherche partielle',
                'message': 'Integrez une liste ou un tableau comparatif pour mieux couvrir les intentions informationnelles.',
            }
        )

    missing_terms = competitor_data.get('missing_terms', [])
    if missing_terms:
        terms = ', '.join(missing_terms[:6])
        recs.append(
            {
                'priority': 'haute',
                'title': 'Sous-themes manquants',
                'message': f'Les concurrents couvrent des termes absents: {terms}. Ajoutez un paragraphe dedie a ces sujets.',
            }
        )

    if semantic_breakdown.get('bounce_rate', 0) >= 50:
        recs.append(
            {
                'priority': 'moyenne',
                'title': 'Engagement a optimiser',
                'message': 'Le taux de rebond est eleve. Ajoutez une FAQ et des appels a action pour retenir les utilisateurs.',
            }
        )

    if semantic_breakdown.get('avg_session_duration', 0) <= 90:
        recs.append(
            {
                'priority': 'moyenne',
                'title': 'Duree de session faible',
                'message': 'Ajoutez des exemples concrets, captures et liens internes pour augmenter le temps de lecture.',
            }
        )

    if len(own_content.get('internal_links', [])) < 3:
        recs.append(
            {
                'priority': 'basse',
                'title': 'Maillage interne insuffisant',
                'message': 'Ajoutez des liens internes vers des contenus connexes pour renforcer la navigation SEO.',
            }
        )

    if technical_issues.get('broken_internal_links'):
        recs.append(
            {
                'priority': 'haute',
                'title': 'Liens internes casses',
                'message': 'Corrigez en priorite les liens internes en erreur 404 ou indisponibles.',
            }
        )

    if not recs:
        recs.append(
            {
                'priority': 'basse',
                'title': 'Contenu globalement aligne',
                'message': f'La page {page_url} couvre bien le sujet. Continuez avec un suivi mensuel.',
            }
        )

    order = {'haute': 0, 'moyenne': 1, 'basse': 2}
    recs.sort(key=lambda item: order.get(item['priority'], 99))
    return recs


def _duplicate_map_by_similarity(page_texts: dict[str, str], threshold: float = 0.8) -> dict[str, list[str]]:
    urls = list(page_texts.keys())
    duplicates: dict[str, list[str]] = {url: [] for url in urls}

    for index, url_a in enumerate(urls):
        for url_b in urls[index + 1 :]:
            similarity = _cosine_similarity_pair(page_texts.get(url_a, ''), page_texts.get(url_b, ''))
            if similarity > threshold:
                duplicates[url_a].append(url_b)
                duplicates[url_b].append(url_a)

    return duplicates


def _normalize_target_url(value: str) -> str:
    raw = (value or '').strip()
    if not raw:
        return ''

    if not raw.startswith('http://') and not raw.startswith('https://'):
        raw = f'https://{raw}'

    parsed = urlparse(raw)
    if not parsed.netloc:
        return ''

    path = parsed.path or '/'
    return f'{parsed.scheme}://{parsed.netloc}{path}'


def refresh_all_analyses(max_urls: int = 50, user=None, target_url: str = '') -> dict[str, Any]:
    if user is None:
        user = ContentAnalysis.objects.order_by('id').values_list('user', flat=True).first()
        if user:
            from django.contrib.auth.models import User

            user = User.objects.filter(id=user).first()

    if user is None:
        from django.contrib.auth.models import User

        user = User.objects.order_by('id').first()

    if user is None:
        return {'created': 0, 'updated': 0, 'failed': 0, 'total': 0, 'details': []}

    targets = get_priority_urls(user, max_urls=max_urls)
    forced_url = _normalize_target_url(target_url)

    if forced_url:
        forced_item = {
            'url': forced_url,
            'page_path': forced_url,
            'sessions': 1,
            'views': 1,
            'bounce_rate': 55.0,
            'avg_session_duration': 60.0,
            'engagement_flag': True,
            'keywords': _keywords_for_url(user, days=30, limit=12),
        }
        targets = [forced_item] + [item for item in targets if item.get('url') != forced_url]

    targets = targets[:max_urls]
    own_fetches: dict[str, dict[str, Any]] = {}
    page_texts: dict[str, str] = {}

    for item in targets:
        fetch_result = fetch_page_html(item['url'])
        own_fetches[item['url']] = fetch_result
        if fetch_result.get('ok'):
            page_texts[item['url']] = fetch_result.get('content', {}).get('full_text', '')

    duplicates_by_url = _duplicate_map_by_similarity(page_texts)

    created = 0
    updated = 0
    failed = 0
    details = []

    for item in targets:
        page_url = item['url']
        fetch_result = own_fetches.get(page_url, {})
        own_content = fetch_result.get('content', {}) if fetch_result.get('ok') else {}

        keyword = _pick_primary_keyword(item.get('keywords', []))
        competitor_data = analyze_competitors(page_url, keyword, own_page_content=fetch_result)

        semantic_result = compute_semantic_score(
            own_content,
            competitor_data,
            bounce_rate=_safe_float(item.get('bounce_rate')),
            avg_session_duration=_safe_float(item.get('avg_session_duration')),
        )

        technical_result = check_technical_seo(own_content, duplicates_by_url.get(page_url, []))
        recommendations = _build_recommendations(
            page_url,
            own_content,
            competitor_data,
            semantic_result.get('breakdown', {}),
            technical_result.get('issues', {}),
        )

        if not fetch_result.get('ok'):
            failed += 1
            technical_result['issues']['fetch_error'] = fetch_result.get('error', 'Unknown error')

        defaults = {
            'semantic_score': semantic_result['total'],
            'technical_score': technical_result['score'],
            'recommendations': recommendations,
            'technical_issues': technical_result['issues'],
            'competitor_data': {
                **competitor_data,
                'semantic_breakdown': semantic_result.get('breakdown', {}),
                'ga_signals': {
                    'sessions': _safe_int(item.get('sessions')),
                    'views': _safe_int(item.get('views')),
                    'bounce_rate': _safe_float(item.get('bounce_rate')),
                    'avg_session_duration': _safe_float(item.get('avg_session_duration')),
                },
                'keywords': item.get('keywords', []),
            },
        }

        analysis, was_created = ContentAnalysis.objects.update_or_create(
            user=user,
            url=page_url,
            defaults=defaults,
        )

        if was_created:
            created += 1
        else:
            updated += 1

        details.append(
            {
                'id': analysis.id,
                'url': page_url,
                'semantic_score': defaults['semantic_score'],
                'technical_score': defaults['technical_score'],
                'created': was_created,
                'fetch_ok': fetch_result.get('ok', False),
            }
        )

    return {
        'created': created,
        'updated': updated,
        'failed': failed,
        'total': len(targets),
        'details': details,
    }
