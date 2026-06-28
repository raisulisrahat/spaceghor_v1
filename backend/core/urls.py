from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from shop.views import SitemapView, SitemapXslView
from django.views import View
from django.http import HttpResponse
import os
import re

def _abs_media(image_field) -> str:
    """Return an absolute URL for a model ImageField using MEDIA_DOMAIN."""
    if not image_field:
        return ''
    try:
        media_domain = getattr(settings, 'MEDIA_DOMAIN', 'https://api.qbamart.com').rstrip('/')
        relative = image_field.url  # e.g. /media/products/foo.webp
        return f"{media_domain}{relative}"
    except Exception:
        return ''


# ─────────────────────────────────────────────
#  Helper: build the frontend page URL
#  Always uses SITE_URL (qbamart.com) — NOT the API domain.
# ─────────────────────────────────────────────
def _frontend_url(path: str) -> str:
    """Return an absolute frontend URL for a given path."""
    site_url = getattr(settings, 'SITE_URL', 'https://qbamart.com').rstrip('/')
    return f"{site_url}{path}"


# ─────────────────────────────────────────────
#  Helper: escape HTML special chars safely
# ─────────────────────────────────────────────
def _esc(text: str) -> str:
    return (
        str(text)
        .replace('&', '&amp;')
        .replace('"', '&quot;')
        .replace('<', '&lt;')
        .replace('>', '&gt;')
    )


# ─────────────────────────────────────────────
#  Smart SEO-Injecting Index View
# ─────────────────────────────────────────────
class IndexView(View):
    """
    Serves the Vite-built index.html for every frontend route.

    For /product/<slug>, /blog/<slug>, and configured static pages,
    it fetches SEO metadata from the database and INSERTS the meta tags
    before </head>. index.html has NO static default meta tags.

    og:url / canonical always use SITE_URL (qbamart.com).
    og:image tags always use MEDIA_DOMAIN (api.qbamart.com).
    Products emit multiple og:image tags (one per gallery image) for
    Facebook/LinkedIn carousel previews.
    """

    _cached_html: str | None = None
    _cached_mtime: float | None = None

    # Patterns that trigger dynamic SEO injection
    PRODUCT_RE = re.compile(r'^/product/(?P<slug>[^/]+)/?$')
    BLOG_RE    = re.compile(r'^/blog/(?P<slug>[^/]+)/?$')
    OFFER_RE   = re.compile(r'^/offer/(?P<slug>[^/]+)/?$')
    STEP_RE    = re.compile(r'^/step/(?P<slug>[^/]+)/?$')

    # ── Static-file cache ──────────────────────────────────
    @classmethod
    def _get_raw_html(cls) -> str:
        index_path = os.path.join(settings.FRONTEND_DIST_DIR, 'index.html')
        try:
            mtime = os.path.getmtime(index_path)
            if cls._cached_mtime != mtime:
                with open(index_path, 'r', encoding='utf-8') as f:
                    cls._cached_html = f.read()
                cls._cached_mtime = mtime
            return cls._cached_html  # type: ignore[return-value]
        except FileNotFoundError:
            pass

        # If not found locally, fetch it from the live site (cPanel separation fallback)
        import urllib.request
        import time

        current_time = time.time()
        # Cache the fetched HTML for 5 minutes (300 seconds)
        if cls._cached_html and cls._cached_mtime and (current_time - cls._cached_mtime < 300):
            return cls._cached_html

        site_url = getattr(settings, 'SITE_URL', 'https://qbamart.com').rstrip('/')
        index_url = f"{site_url}/index.html"
        
        try:
            # Use a custom user agent to avoid bot rewrite loops in .htaccess
            req = urllib.request.Request(
                index_url,
                headers={'User-Agent': 'Qbamart-Internal-Fetcher'}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                cls._cached_html = response.read().decode('utf-8')
                cls._cached_mtime = current_time
                return cls._cached_html
        except Exception as e:
            return f'<html><head></head><body><p>Frontend not found locally, and fetch failed: {e}</p></body></html>'

    # ── Inject meta tags into HTML string ─────────────────
    @staticmethod
    def _inject_meta(html: str, meta: dict) -> str:
        """
        Insert a full SEO block directly before </head>.
        meta dict keys:
          title, desc, keywords, url (frontend URL), image (primary),
          images (list of all gallery image URLs for og:image carousel)
        """
        title    = _esc(meta.get('title', ''))
        desc     = _esc(meta.get('description', ''))
        url      = _esc(meta.get('url', ''))
        keywords = _esc(meta.get('keywords', ''))
        # images: list of absolute URLs; first is primary
        images   = [_esc(img) for img in meta.get('images', []) if img]
        # Fall back to legacy single 'image' key
        if not images and meta.get('image'):
            images = [_esc(meta['image'])]

        lines = [
            f'  <meta name="description" content="{desc}" />',
            f'  <meta name="robots" content="index, follow" />',
        ]
        if keywords:
            lines.append(f'  <meta name="keywords" content="{keywords}" />')
        if url:
            lines.append(f'  <link rel="canonical" href="{url}" />')

        # Open Graph
        lines += [
            f'  <meta property="og:site_name" content="Qbamart" />',
            f'  <meta property="og:title" content="{title}" />',
            f'  <meta property="og:description" content="{desc}" />',
            f'  <meta property="og:url" content="{url}" />',
        ]
        
        try:
            from shop.models import SiteSettings
            site_settings = SiteSettings.objects.only('facebook_app_id').first()
            fb_app_id = site_settings.facebook_app_id if site_settings and site_settings.facebook_app_id else ""
        except Exception:
            fb_app_id = ""
            
        if fb_app_id:
            lines.append(f'  <meta property="fb:app_id" content="{fb_app_id}" />')
        else:
            lines.append(f'  <meta property="fb:app_id" content="" />')
            
        # Emit one og:image tag per gallery image (carousel support)
        for img_url in images:
            lines += [
                f'  <meta property="og:image" content="{img_url}" />',
                f'  <meta property="og:image:width" content="1200" />',
                f'  <meta property="og:image:height" content="630" />',
                f'  <meta property="og:image:alt" content="{title}" />',
            ]

        # Twitter — use first image only
        primary_image = images[0] if images else ''
        lines += [
            f'  <meta name="twitter:title" content="{title}" />',
            f'  <meta name="twitter:description" content="{desc}" />',
        ]
        if primary_image:
            lines.append(f'  <meta name="twitter:image" content="{primary_image}" />')

        block = '\n'.join(lines) + '\n'
        return html.replace('</head>', block + '</head>', 1)

    # ── Fetch product SEO data ─────────────────────────────
    def _product_meta(self, request, slug: str) -> dict | None:
        try:
            from shop.models import Product, SiteSettings
            product = (
                Product.objects
                .prefetch_related('images')
                .only('name', 'slug', 'seo_title', 'seo_description',
                      'seo_keywords', 'short_description', 'image')
                .get(slug=slug, is_active=True)
            )

            site = SiteSettings.objects.only('site_title').first()
            site_title = site.site_title if site else 'Qbamart'

            title = (product.seo_title or product.name).strip()
            full_title = f'{title}'

            raw_desc = (
                product.seo_description
                or product.short_description
                or ''
            )
            description = raw_desc[:160].strip()

            # Build image list: main image first, then gallery images
            all_images = []
            if product.image:
                all_images.append(_abs_media(product.image))
            for gallery_img in product.images.all():
                url = _abs_media(gallery_img.image)
                if url and url not in all_images:
                    all_images.append(url)

            return {
                'title':       full_title,
                'description': description,
                'keywords':    product.seo_keywords or '',
                'images':      all_images,
                'url':         _frontend_url(request.path),
            }
        except Exception:
            return None

    # ── Fetch funnel SEO data ──────────────────────────────
    def _funnel_meta(self, request, slug: str) -> dict | None:
        try:
            from shop.models import Funnel, SiteSettings
            funnel = Funnel.objects.select_related('product').get(slug=slug, is_active=True)
            product = funnel.product

            site = SiteSettings.objects.only('site_title').first()
            site_title = site.site_title if site else 'Qbamart'

            # Funnel uses its linked product's SEO data
            title = (product.seo_title or product.name).strip()
            full_title = f'{title} '

            raw_desc = (
                product.seo_description
                or product.short_description
                or ''
            )
            description = raw_desc[:160].strip()

            # Build image list from product: main image first, then gallery images
            all_images = []
            if product.image:
                all_images.append(_abs_media(product.image))
            for gallery_img in product.images.all():
                url = _abs_media(gallery_img.image)
                if url and url not in all_images:
                    all_images.append(url)

            return {
                'title':       full_title,
                'description': description,
                'keywords':    product.seo_keywords or '',
                'images':      all_images,
                'url':         _frontend_url(request.path),
            }
        except Exception:
            return None

    # ── Fetch blog SEO data ────────────────────────────────
    def _blog_meta(self, request, slug: str) -> dict | None:
        try:
            from shop.models import BlogPost, SiteSettings
            post = BlogPost.objects.only(
                'title', 'slug', 'seo_title', 'seo_description',
                'seo_keywords', 'image'
            ).get(slug=slug, is_published=True)

            site = SiteSettings.objects.only('site_title').first()
            site_title = site.site_title if site else 'Qbamart'

            title = (post.seo_title or post.title).strip()
            full_title = f'{title} '
            description = (post.seo_description or '').strip()[:160]

            images = [_abs_media(post.image)] if post.image else []

            return {
                'title':       full_title,
                'description': description,
                'keywords':    post.seo_keywords or '',
                'images':      images,
                'url':         _frontend_url(request.path),
            }
        except Exception:
            return None

    # ── Fetch static page SEO data ─────────────────────────
    def _page_meta(self, request, path: str) -> dict | None:
        try:
            from shop.models import PageSeo, SiteSettings
            page = PageSeo.objects.only(
                'seo_title', 'seo_description', 'seo_keywords', 'page_label', 'page_path'
            ).get(page_path=path)

            if not (page.seo_title or page.seo_description or page.seo_keywords):
                return None  # No custom SEO set yet

            site = SiteSettings.objects.only('site_title').first()
            site_title = site.site_title if site else 'Qbamart'

            title = page.seo_title.strip() if page.seo_title else page.page_label
            full_title = f'{title} '
            description = (page.seo_description or '').strip()[:160]

            return {
                'title':       full_title,
                'description': description,
                'keywords':    page.seo_keywords or '',
                'images':      [],
                'url':         _frontend_url(request.path),
            }
        except Exception:
            return None

    # ── Global fallback SEO from SiteSettings ──────────────
    def _global_meta(self, request) -> dict:
        """
        Always returns a meta dict using the global SiteSettings values.
        This is the final fallback — ensures <head> is never empty.
        These are the same values edited in SEO Manager → Global Settings.
        """
        try:
            from shop.models import SiteSettings
            site = SiteSettings.objects.only(
                'site_title', 'meta_description', 'meta_keywords', 'site_logo'
            ).first()
        except Exception:
            site = None

        site_title   = (site.site_title   if site else None) or 'Qbamart'
        description  = (site.meta_description if site else None) or f'{site_title} - Premium Shopping in Bangladesh'
        keywords     = (site.meta_keywords    if site else None) or 'ecommerce, bangladesh, shopping'
        logo_url     = _abs_media(site.site_logo) if (site and site.site_logo) else ''

        return {
            'title':       site_title,
            'description': description[:160],
            'keywords':    keywords,
            'images':      [logo_url] if logo_url else [],
            'url':         _frontend_url(request.path),
        }

    # ── Main handler ───────────────────────────────────────
    def get(self, request, *args, **kwargs):
        html = self._get_raw_html()
        path = request.path

        meta = None

        m = self.PRODUCT_RE.match(path)
        if m:
            meta = self._product_meta(request, m.group('slug'))

        if meta is None:
            m = self.OFFER_RE.match(path)
            if m:
                meta = self._funnel_meta(request, m.group('slug'))

        if meta is None:
            m = self.STEP_RE.match(path)
            if m:
                meta = self._funnel_meta(request, m.group('slug'))

        if meta is None:
            m = self.BLOG_RE.match(path)
            if m:
                meta = self._blog_meta(request, m.group('slug'))

        # Static page SEO (home, /products, /about-us, etc.)
        if meta is None:
            meta = self._page_meta(request, path)

        # Global fallback — always inject something from SiteSettings
        if meta is None:
            meta = self._global_meta(request)

        html = self._inject_meta(html, meta)
        return HttpResponse(html, content_type='text/html; charset=utf-8')



urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('shop.urls')),
    path('sitemap.xml', SitemapView.as_view(), name='sitemap'),
    path('sitemap.xsl', SitemapXslView.as_view(), name='sitemap-xsl'),

    # Catch-all: serve the React SPA with dynamic SEO injection
    re_path(r'^(?!api/|admin/|static/|media/|sitemap).*$', IndexView.as_view(), name='index'),
]
