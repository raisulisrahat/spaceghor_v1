from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, BrandViewSet, ProductViewSet, BannerViewSet, 
    OrderViewSet, IncompleteOrderViewSet, SiteSettingsViewSet, NoticeViewSet, FlashSaleViewSet, FlashSaleItemViewSet,
    WishlistViewSet, RegisterView, ProfileView, AdminStatsView,
    DistrictViewSet, UpazilaViewSet, PaymentMethodViewSet, ShippingZoneViewSet,
    NotificationViewSet, GlobalSearchView,
    BlogCategoryViewSet, BlogPostViewSet, FunnelViewSet,
    ColorViewSet, SizeViewSet, TagViewSet, ProductImageViewSet, ProductVideoViewSet,
    UserViewSet, ReviewViewSet, OTPViewSet, MetaView, CustomObtainAuthToken,
    MediaManagerView, SecurityAuditView, BkashCallbackView
)
from rest_framework.authtoken.views import obtain_auth_token

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'categories', CategoryViewSet)
router.register(r'brands', BrandViewSet)
router.register(r'products', ProductViewSet)
router.register(r'banners', BannerViewSet)
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'incomplete-orders', IncompleteOrderViewSet, basename='incomplete-order')
router.register(r'site-settings', SiteSettingsViewSet, basename='site-settings')
router.register(r'notice', NoticeViewSet)
router.register(r'flash-sales', FlashSaleViewSet)
router.register(r'flash-sale-items', FlashSaleItemViewSet)
router.register(r'wishlist', WishlistViewSet, basename='wishlist')
router.register(r'districts', DistrictViewSet)
router.register(r'upazilas', UpazilaViewSet)
router.register(r'payment-methods', PaymentMethodViewSet)
router.register(r'shipping-zones', ShippingZoneViewSet)
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'blog-categories', BlogCategoryViewSet)
router.register(r'blog-posts', BlogPostViewSet)
router.register(r'funnels', FunnelViewSet)
router.register(r'colors', ColorViewSet)
router.register(r'sizes', SizeViewSet)
router.register(r'tags', TagViewSet)
router.register(r'product-images', ProductImageViewSet)
router.register(r'product-videos', ProductVideoViewSet)
router.register(r'otp', OTPViewSet, basename='otp')

urlpatterns = [
    path('', include(router.urls)),
    path('bkash/callback/', BkashCallbackView.as_view(), name='bkash-callback'),
    path('courier/<int:pk>/check_status/', OrderViewSet.as_view({'get': 'check_status'}), name='courier-check-status'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomObtainAuthToken.as_view(), name='login'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('admin-stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('admin/global-search/', GlobalSearchView.as_view(), name='global-search'),
    path('seo-proxy/', MetaView.as_view(), name='seo-proxy'),
    path('media-manager/', MediaManagerView.as_view(), name='media-manager'),
    path('admin/security/audit/', SecurityAuditView.as_view(), name='security-audit'),
]
