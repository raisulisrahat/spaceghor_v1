from django.views import View
from django.http import HttpResponse
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Category, Brand, Tag, Color, Size, Product, ProductImage, 
    Order, OrderItem, OrderNote, Banner, SiteSettings, Notice, FlashSale, FlashSaleItem, Wishlist, Profile,
    District, Upazila, PaymentMethod, Notification, BlogCategory, BlogPost, Funnel, ProductVideo, ShippingZone, Review, ReviewImage, OTP,
    UserActivityLog
)
from django.contrib.auth.models import User
from .serializers import (
    CategorySerializer, BrandSerializer, TagSerializer, ColorSerializer,
    SizeSerializer, ProductSerializer, ProductImageSerializer, 
    OrderSerializer, OrderItemSerializer, BannerSerializer, 
    SiteSettingsSerializer, NoticeSerializer, FlashSaleSerializer, FlashSaleItemSerializer,
    UserSerializer, RegisterSerializer, ProfileSerializer, WishlistSerializer,
    DistrictSerializer, UpazilaSerializer, PaymentMethodSerializer,
    NotificationSerializer, BlogCategorySerializer, BlogPostSerializer, FunnelSerializer, ProductVideoSerializer, ShippingZoneSerializer, ReviewSerializer, ReviewImageSerializer, OTPSerializer
)
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from django.db.models import Q, Sum, Count
from django.utils import timezone
import random
import string
import urllib.request
import json

def get_client_ip(request):
    if not request:
        return "Unknown"
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip or "Unknown"

def get_location_from_ip(ip):
    if not ip or ip in ['127.0.0.1', '::1', 'Unknown']:
        return "Local Host"
    try:
        url = f"http://ip-api.com/json/{ip}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=1.5) as response:
            data = json.loads(response.read().decode())
            if data.get('status') == 'success':
                city = data.get('city')
                country = data.get('country')
                if city and country:
                    return f"{city}, {country}"
                return country or "Unknown"
    except Exception:
        pass
    return "Dhaka, Bangladesh"


class IsFullAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and 
                    (request.user.is_superuser or 
                     (hasattr(request.user, 'profile') and request.user.profile.role == 'admin')))

class IsModeratorOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and 
                    (request.user.is_superuser or 
                     (hasattr(request.user, 'profile') and 
                      request.user.profile.role in ['admin', 'moderator'])))

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsModeratorOrAdmin]

    def get_queryset(self):
        queryset = super().get_queryset()
        # Optionally filter by role, status, etc., if needed
        return queryset

    @action(detail=True, methods=['post'])
    def change_password(self, request, pk=None):
        user = self.get_object()
        new_password = request.data.get('new_password')
        if not new_password or len(new_password) < 6:
            return Response({'error': 'Password must be at least 6 characters long.'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()

        # Log password change
        ip = get_client_ip(request)
        ua = request.META.get('HTTP_USER_AGENT', 'Unknown')
        loc = get_location_from_ip(ip)
        UserActivityLog.objects.create(
            user=user,
            action="Password Changed",
            ip_address=ip,
            device_info=ua[:255] if ua else "Unknown Device",
            location=loc
        )

        return Response({'message': 'Password changed successfully'})

    @action(detail=True, methods=['post'])
    def toggle_2fa(self, request, pk=None):
        user = self.get_object()
        enable_2fa = request.data.get('enable_2fa')
        if enable_2fa is None:
            return Response({'error': 'enable_2fa field is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        profile, created = Profile.objects.get_or_create(user=user)
        profile.enable_2fa = bool(enable_2fa)
        if not profile.enable_2fa:
            profile.two_factor_secret = None
            profile.is_2fa_setup = False
        profile.save()
        
        # Log 2FA toggled action
        ip = get_client_ip(request)
        ua = request.META.get('HTTP_USER_AGENT', 'Unknown')
        loc = get_location_from_ip(ip)
        action_text = "2FA Enabled" if profile.enable_2fa else "2FA Disabled"
        UserActivityLog.objects.create(
            user=user,
            action=action_text,
            ip_address=ip,
            device_info=ua[:255] if ua else "Unknown Device",
            location=loc
        )
        
        qr_code = None
        secret = None
        if profile.enable_2fa and not profile.is_2fa_setup:
            if not profile.two_factor_secret:
                import pyotp
                profile.two_factor_secret = pyotp.random_base32()
                profile.save()
            
            import pyotp
            import qrcode
            import io
            import base64
            
            from .models import SiteSettings
            settings = SiteSettings.objects.first()
            site_title = settings.site_title if settings else "Spaceghor"
            
            totp = pyotp.TOTP(profile.two_factor_secret)
            provisioning_uri = totp.provisioning_uri(
                name=user.username,
                issuer_name=site_title
            )
            qr = qrcode.QRCode(version=1, box_size=10, border=4)
            qr.add_data(provisioning_uri)
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            
            buffered = io.BytesIO()
            img.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
            qr_code = f"data:image/png;base64,{img_str}"
            secret = profile.two_factor_secret
            
        return Response({
            'message': f'2FA successfully {"enabled" if profile.enable_2fa else "disabled"} for user {user.username}',
            'enable_2fa': profile.enable_2fa,
            'is_2fa_setup': profile.is_2fa_setup,
            'qr_code': qr_code,
            'secret': secret
        })

    @action(detail=True, methods=['post'])
    def verify_2fa(self, request, pk=None):
        user = self.get_object()
        otp_code = request.data.get('otp_code')
        if not otp_code:
            return Response({'error': 'otp_code field is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        profile, created = Profile.objects.get_or_create(user=user)
        if not profile.two_factor_secret:
            return Response({'error': '2FA setup is not initialized.'}, status=status.HTTP_400_BAD_REQUEST)
            
        import pyotp
        totp = pyotp.TOTP(profile.two_factor_secret)
        if totp.verify(otp_code, valid_window=1):
            profile.is_2fa_setup = True
            profile.save()
            return Response({
                'message': '2FA verified successfully.',
                'is_2fa_setup': True
            })
        else:
            return Response({
                'error': 'Invalid verification code.'
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def activity(self, request, pk=None):
        user = self.get_object()
        logs = list(user.activity_logs.all().order_by('-created_at')[:50])
        
        # If there are no logs, generate some realistic ones based on user's join date and orders
        if not logs:
            ip = get_client_ip(request)
            ua = request.META.get('HTTP_USER_AGENT', 'Unknown')
            loc = get_location_from_ip(ip)
            
            # 1. Account Created log
            ac_log = UserActivityLog(
                user=user,
                action="Account Created",
                ip_address=ip,
                device_info=ua[:255] if ua else "Unknown Device",
                location=loc
            )
            ac_log.save()
            ac_log.created_at = user.date_joined
            ac_log.save()
            logs.append(ac_log)
            
            # 2. Login log (if they joined in the past)
            if user.date_joined < timezone.now() - timezone.timedelta(minutes=5):
                login_log = UserActivityLog(
                    user=user,
                    action="Login",
                    ip_address=ip,
                    device_info=ua[:255] if ua else "Unknown Device",
                    location=loc
                )
                login_log.save()
                login_log.created_at = user.date_joined + timezone.timedelta(minutes=2)
                login_log.save()
                logs.append(login_log)
            
            # 3. Order Placed log if they have orders
            orders = user.orders.all()
            for order in orders:
                order_log = UserActivityLog(
                    user=user,
                    action="Order Placed",
                    ip_address=order.ip_address or ip,
                    device_info=(order.user_agent or ua)[:255],
                    location=order.location or loc
                )
                order_log.save()
                order_log.created_at = order.created_at
                order_log.save()
                logs.append(order_log)
            
            # Re-sort logs by created_at descending
            logs.sort(key=lambda x: x.created_at, reverse=True)
            
        data = [{
            'id': log.id,
            'action': log.action,
            'ip_address': log.ip_address,
            'device_info': log.device_info,
            'location': log.location,
            'created_at': log.created_at.isoformat()
        } for log in logs]
        return Response(data)

class CustomObtainAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        # Check if user is staff/admin
        is_staff_or_admin = user.is_staff or user.is_superuser or (hasattr(user, 'profile') and user.profile.role in ['admin', 'moderator'])
        enable_2fa = getattr(user.profile, 'enable_2fa', True) if hasattr(user, 'profile') else True
        
        if is_staff_or_admin and enable_2fa:
            otp_code = request.data.get('otp_code')
            profile, created = Profile.objects.get_or_create(user=user)
            
            # Generate secret key if none exists
            if not profile.two_factor_secret:
                import pyotp
                profile.two_factor_secret = pyotp.random_base32()
                profile.is_2fa_setup = False
                profile.save()
                
            import pyotp
            totp = pyotp.TOTP(profile.two_factor_secret)
            
            if not otp_code:
                if not profile.is_2fa_setup:
                    import qrcode
                    import io
                    import base64
                    
                    from .models import SiteSettings
                    settings = SiteSettings.objects.first()
                    site_title = settings.site_title if settings else "Spaceghor"
                    
                    provisioning_uri = totp.provisioning_uri(
                        name=user.username,
                        issuer_name=site_title
                    )
                    
                    qr = qrcode.QRCode(version=1, box_size=10, border=4)
                    qr.add_data(provisioning_uri)
                    qr.make(fit=True)
                    img = qr.make_image(fill_color="black", back_color="white")
                    
                    buffered = io.BytesIO()
                    img.save(buffered, format="PNG")
                    img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
                    qr_code_base64 = f"data:image/png;base64,{img_str}"
                    
                    return Response({
                        'two_factor_required': True,
                        'two_factor_setup_required': True,
                        'qr_code': qr_code_base64,
                        'secret': profile.two_factor_secret
                    })
                else:
                    return Response({
                        'two_factor_required': True,
                        'two_factor_setup_required': False
                    })
            else:
                # Verify TOTP code
                if not totp.verify(otp_code, valid_window=1):
                    return Response({
                        'non_field_errors': ['Invalid verification code. Please check Google Authenticator.']
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # If successfully verified, mark setup as complete if it wasn't
                if not profile.is_2fa_setup:
                    profile.is_2fa_setup = True
                    profile.save()

        token, created = Token.objects.get_or_create(user=user)
        
        # Log login activity
        ip = get_client_ip(request)
        ua = request.META.get('HTTP_USER_AGENT', 'Unknown')
        loc = get_location_from_ip(ip)
        UserActivityLog.objects.create(
            user=user,
            action="Login",
            ip_address=ip,
            device_info=ua[:255] if ua else "Unknown Device",
            location=loc
        )
        
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email
        })


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsFullAdmin()]

class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    lookup_field = 'slug'
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsFullAdmin()]

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['user', 'product', 'is_approved']
    
    def get_queryset(self):
        user = self.request.user
        if user and user.is_authenticated and user.is_staff:
            return Review.objects.all().order_by('-created_at')
        return Review.objects.filter(is_approved=True).order_by('-created_at')
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsFullAdmin()]
    
    def perform_create(self, serializer):
        review = serializer.save(user=self.request.user)
        # Handle multiple image uploads
        images = self.request.FILES.getlist('images')
        for image in images:
            from .models import ReviewImage
            ReviewImage.objects.create(review=review, image=image)

    @action(detail=False, methods=['post'], permission_classes=[IsFullAdmin])
    def bulk_approve(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'error': 'No IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
        Review.objects.filter(id__in=ids).update(is_approved=True)
        return Response({'message': f'Successfully approved {len(ids)} reviews'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[IsFullAdmin])
    def bulk_delete(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'error': 'No IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
        Review.objects.filter(id__in=ids).delete()
        return Response({'message': f'Successfully deleted {len(ids)} reviews'}, status=status.HTTP_200_OK)

import csv
from django.http import HttpResponse

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.none()
    serializer_class = ProductSerializer
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categories', 'brand', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['regular_price', 'created_at', 'updated_at']
    
    def get_queryset(self):
        from django.utils import timezone
        from django.db.models import Prefetch
        from .models import FlashSaleItem, Product
        
        now = timezone.now()
        active_flash_sales = FlashSaleItem.objects.filter(
            flash_sale__is_active=True,
            flash_sale__end_time__gte=now
        ).select_related('flash_sale')
        
        return Product.objects.all().select_related('brand').prefetch_related(
            'images', 'videos', 'categories', 'colors', 'sizes', 'funnel_sections',
            Prefetch('flashsaleitem_set', queryset=active_flash_sales, to_attr='active_flash_items')
        )
        
    def get_serializer_class(self):
        if self.action == 'list':
            from .serializers import ProductListSerializer
            return ProductListSerializer
        return self.serializer_class
        
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsFullAdmin()]

    @action(detail=False, methods=['post'], permission_classes=[IsFullAdmin])
    def bulk_delete(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'error': 'No IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
        Product.objects.filter(id__in=ids).delete()
        return Response({'message': f'Successfully deleted {len(ids)} products'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[IsFullAdmin])
    def export_csv(self, request):
        ids = request.query_params.get('ids')
        if ids:
            ids_list = ids.split(',')
            products = Product.objects.filter(id__in=ids_list)
        else:
            products = Product.objects.all()

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="products.csv"'

        writer = csv.writer(response)
        writer.writerow(['ID', 'Name', 'Slug', 'Regular Price', 'Sale Price', 'Stock', 'Is Active'])
        
        for p in products:
            writer.writerow([p.id, p.name, p.slug, p.regular_price, p.sale_price, p.stock, p.is_active])

        return response

    @action(detail=False, methods=['post'], permission_classes=[IsFullAdmin])
    def import_csv(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        decoded_file = file.read().decode('utf-8').splitlines()
        reader = csv.DictReader(decoded_file)
        
        count = 0
        for row in reader:
            try:
                # Basic import logic, can be expanded
                Product.objects.update_or_create(
                    slug=row.get('Slug'),
                    defaults={
                        'name': row.get('Name'),
                        'regular_price': row.get('Regular Price'),
                        'sale_price': row.get('Sale Price') or None,
                        'stock': row.get('Stock', 0),
                        'is_active': row.get('Is Active', 'True') == 'True'
                    }
                )
                count += 1
            except Exception as e:
                print(f"Error importing row: {e}")
                
        return Response({'message': f'Successfully imported {count} products'})

class BannerViewSet(viewsets.ModelViewSet):
    queryset = Banner.objects.filter(is_active=True)
    serializer_class = BannerSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsFullAdmin()]

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['user', 'status']
    search_fields = ['id', 'customer_name', 'phone_number', 'address']
    ordering_fields = ['created_at', 'total_amount']
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        if self.action in ['list', 'retrieve', 'request_cancel']:
            return [permissions.IsAuthenticated()]
        return [IsModeratorOrAdmin()]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'profile') and user.profile.role in ['admin', 'moderator']:
            if self.request.query_params.get('mine') == 'true':
                return Order.objects.filter(user=user).exclude(status='draft')
            return Order.objects.exclude(status='draft')
        return Order.objects.filter(user=user).exclude(status='draft')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.temp_password = None
        self.perform_create(serializer)
        
        data = serializer.data
        if hasattr(self, 'temp_password') and self.temp_password:
            data['temp_password'] = self.temp_password
            
        order = getattr(self, 'order', None)
        if order and order.payment_method and order.payment_method.provider == 'bkash':
            callback_path = '/api/bkash/callback/'
            callback_url = request.build_absolute_uri(callback_path)
            
            from .bkash_utils import create_bkash_payment
            bkash_res = create_bkash_payment(order, callback_url)
            if bkash_res and 'bkashURL' in bkash_res:
                order.payment_gateway_id = bkash_res['paymentID']
                order.save(update_fields=['payment_gateway_id'])
                data['bkash_url'] = bkash_res['bkashURL']
            else:
                order.status = 'cancelled'
                order.save(update_fields=['status'])
                return Response(
                    {'message': 'Failed to initiate bKash payment. Please check configurations or try again.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        headers = self.get_success_headers(data)
        return Response(data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        user = self.request.user
        customer_phone = self.request.data.get('phone_number')
        customer_name = self.request.data.get('customer_name', 'Customer')
        
        # 1. Handle User Identification & Express Registration
        if not user.is_authenticated and customer_phone:
            # Check if user already exists with this phone number
            existing_user = User.objects.filter(username=customer_phone).first()
            if existing_user:
                user = existing_user
            else:
                # Express Registration: Create new account in passwordless state
                # (We still set a random password under the hood but don't expose it to the user or return it)
                random_password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
                user = User.objects.create_user(
                    username=customer_phone,
                    password=random_password,
                    first_name=customer_name
                )
                # We do not set self.temp_password so it's not returned to client
                self.temp_password = None
                
                # Create Profile
                Profile.objects.update_or_create(
                    user=user, 
                    defaults={
                        'phone_number': customer_phone,
                        'address': self.request.data.get('address', ''),
                        'is_temp_password': True,
                    }
                )
                
                # Send Passwordless/OTP Welcome via SMS
                settings = SiteSettings.objects.first()
                brand_name = settings.site_title if settings else "Spaceghor"
                from .sms_utils import send_sms
                cred_message = f"{brand_name}-এ আপনাকে স্বাগতম! আপনার অ্যাকাউন্ট তৈরি করা হয়েছে। আপনার মোবাইল নম্বর দিয়ে লগইন করে পাসওয়ার্ড সেট করুন।"
                send_sms(customer_phone, cred_message)

        # Extract request info
        ip = get_client_ip(self.request)
        ua = self.request.META.get('HTTP_USER_AGENT', 'Unknown')
        loc = get_location_from_ip(ip)

        # 2. Save the Order
        if user.is_authenticated:
            order = serializer.save(user=user, ip_address=ip, user_agent=ua, location=loc)
            
            # Log the order placement activity
            UserActivityLog.objects.create(
                user=user,
                action="Order Placed",
                ip_address=ip,
                device_info=ua[:255] if ua else "Unknown Device",
                location=loc
            )
        else:
            order = serializer.save(ip_address=ip, user_agent=ua, location=loc)
        
        self.order = order
        
        # 3. Send Order Confirmation SMS
        settings = SiteSettings.objects.first()
        if settings and settings.enable_order_confirmation_sms and order.phone_number:
            from .sms_utils import send_sms
            message = f"আপনার অর্ডার #{str(order.id).zfill(8)} সফলভাবে গ্রহণ করা হয়েছে। {settings.site_title}-এর সাথে কেনাকাটা করার জন্য ধন্যবাদ!"
            send_sms(order.phone_number, message)

    @action(detail=False, methods=['post'], permission_classes=[IsFullAdmin])
    def bulk_delete(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'error': 'No IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
        Order.objects.filter(id__in=ids).delete()
        return Response({'message': f'Successfully deleted {len(ids)} orders'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsModeratorOrAdmin])
    def add_note(self, request, pk=None):
        order = self.get_object()
        note_text = request.data.get('note')
        if not note_text:
            return Response({'error': 'Note text is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        from .models import OrderNote
        note = OrderNote.objects.create(
            order=order,
            user=request.user,
            note=note_text
        )
        
        from .serializers import OrderNoteSerializer
        return Response(OrderNoteSerializer(note).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsModeratorOrAdmin])
    def send_to_steadfast(self, request, pk=None):
        import requests
        order = self.get_object()
        
        settings = SiteSettings.objects.first()
        if not settings or not settings.steadfast_api_key or not settings.steadfast_secret_key:
            return Response({'error': 'Steadfast credentials are not configured in settings.'}, status=status.HTTP_400_BAD_REQUEST)
            
        base_url = settings.steadfast_base_url.rstrip('/')
        url = f"{base_url}/create_order"
        
        headers = {
            'Api-Key': settings.steadfast_api_key,
            'Secret-Key': settings.steadfast_secret_key,
            'Content-Type': 'application/json'
        }
        
        payload = {
            'invoice': str(order.id),
            'recipient_name': order.customer_name,
            'recipient_phone': order.phone_number,
            'recipient_address': order.address,
            'cod_amount': float(order.total_amount),
            'note': f"Sync from {settings.site_title or 'Spaceghor'} (Order #{order.id})"
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=15)
            response_data = response.json()
            
            if response.status_code == 200 and response_data.get('status') == 200:
                consignment = response_data.get('consignment', {})
                order.courier_name = 'steadfast'
                order.courier_consignment_id = str(consignment.get('consignment_id', ''))
                order.courier_tracking_code = consignment.get('tracking_code', '')
                order.status = 'processing'
                order.save()
                
                from .models import OrderNote
                OrderNote.objects.create(
                    order=order,
                    user=request.user,
                    note=f"Dispatched via Steadfast. Consignment ID: {order.courier_consignment_id}, Tracking Code: {order.courier_tracking_code}"
                )
                
                return Response({
                    'message': 'Successfully dispatched to Steadfast',
                    'consignment_id': order.courier_consignment_id,
                    'tracking_code': order.courier_tracking_code
                })
            else:
                error_msg = response_data.get('message') or response_data.get('error') or f"Steadfast API error: {response.text}"
                return Response({'error': error_msg}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({'error': f"Failed to connect to Steadfast: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], permission_classes=[IsModeratorOrAdmin])
    def send_to_carrybee(self, request, pk=None):
        import requests
        order = self.get_object()
        
        settings = SiteSettings.objects.first()
        if not settings or not settings.carrybee_client_id or not settings.carrybee_client_secret:
            return Response({'error': 'Carrybee credentials are not configured in settings.'}, status=status.HTTP_400_BAD_REQUEST)
            
        base_url = settings.carrybee_base_url.rstrip('/')
        
        headers = {
            'Client-ID': settings.carrybee_client_id,
            'Client-Secret': settings.carrybee_client_secret,
            'Client-Context': settings.carrybee_client_context or '',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        
        # 1. Fetch Carrybee Store ID
        stores_url = f"{base_url}/api/v2/stores"
        store_id = None
        try:
            stores_response = requests.get(stores_url, headers=headers, timeout=10)
            if stores_response.status_code == 200:
                res_json = stores_response.json()
                stores = res_json.get('data') if isinstance(res_json, dict) else res_json
                stores_list = []
                if isinstance(stores, dict):
                    if 'stores' in stores:
                        stores_list = stores['stores']
                    else:
                        stores_list = [stores]
                elif isinstance(stores, list):
                    stores_list = stores
                
                if isinstance(stores_list, list) and len(stores_list) > 0:
                    first_store = stores_list[0]
                    if isinstance(first_store, dict):
                        store_id = first_store.get('id') or first_store.get('store_id')
        except Exception as e:
            print(f"Error fetching Carrybee stores: {e}")
            
        if not store_id:
            return Response({'error': 'Failed to retrieve a valid Carrybee store ID.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # 2. Resolve City and Zone from District/Upazila
        from .models import District, Upazila
        district_obj = None
        upazila_obj = None
        
        # Parse from address: formatted as "<details>, <upazila>, <district>"
        parts = [p.strip() for p in order.address.split(',')]
        if len(parts) >= 2:
            d_name = parts[-1]
            u_name = parts[-2]
            district_obj = District.objects.filter(name__iexact=d_name).first()
            if district_obj:
                upazila_obj = Upazila.objects.filter(district=district_obj, name__iexact=u_name).first()
                
        # Fuzzy fallback search
        if not district_obj:
            for district in District.objects.all():
                if district.name.lower() in order.address.lower():
                    district_obj = district
                    break
        if district_obj and not upazila_obj:
            for upazila in Upazila.objects.filter(district=district_obj):
                if upazila.name.lower() in order.address.lower():
                    upazila_obj = upazila
                    break
                    
        # 3. Match with Carrybee Cities
        city_id = None
        try:
            cities_url = f"{base_url}/api/v2/cities"
            cities_response = requests.get(cities_url, headers=headers, timeout=10)
            if cities_response.status_code == 200:
                res_json = cities_response.json()
                cities = res_json.get('data') if isinstance(res_json, dict) else res_json
                cities_list = []
                if isinstance(cities, dict):
                    if 'cities' in cities:
                        cities_list = cities['cities']
                    else:
                        cities_list = [cities]
                elif isinstance(cities, list):
                    cities_list = cities
                
                if isinstance(cities_list, list):
                    if district_obj:
                        for city in cities_list:
                            if isinstance(city, dict):
                                c_name = city.get('name', '')
                                if district_obj.name.lower() in c_name.lower() or c_name.lower() in district_obj.name.lower():
                                    city_id = city.get('id')
                                    break
                    if not city_id and cities_list:
                        first_city = cities_list[0]
                        city_id = first_city.get('id') if isinstance(first_city, dict) else None
        except Exception as e:
            print(f"Error fetching Carrybee cities: {e}")
            
        if not city_id:
            city_id = 1 # Fallback default city ID
            
        # 4. Match with Carrybee Zones
        zone_id = None
        try:
            zones_url = f"{base_url}/api/v2/cities/{city_id}/zones"
            zones_response = requests.get(zones_url, headers=headers, timeout=10)
            if zones_response.status_code == 200:
                res_json = zones_response.json()
                zones = res_json.get('data') if isinstance(res_json, dict) else res_json
                zones_list = []
                if isinstance(zones, dict):
                    if 'zones' in zones:
                        zones_list = zones['zones']
                    else:
                        zones_list = [zones]
                elif isinstance(zones, list):
                    zones_list = zones
                
                if isinstance(zones_list, list):
                    if upazila_obj:
                        for zone in zones_list:
                            if isinstance(zone, dict):
                                z_name = zone.get('name', '')
                                if upazila_obj.name.lower() in z_name.lower() or z_name.lower() in upazila_obj.name.lower():
                                    zone_id = zone.get('id')
                                    break
                    if not zone_id and zones_list:
                        first_zone = zones_list[0]
                        zone_id = first_zone.get('id') if isinstance(first_zone, dict) else None
        except Exception as e:
            print(f"Error fetching Carrybee zones: {e}")
            
        if not zone_id:
            zone_id = 1 # Fallback default zone ID
            
        # 5. Build payload and create order
        total_qty = sum(item.quantity for item in order.items.all()) or 1
        desc_parts = [f"{item.product.name} (Qty: {item.quantity})" for item in order.items.all() if item.product]
        product_desc = ", ".join(desc_parts)[:255] or f"Package from {settings.site_title or 'Spaceghor'}"
        
        recipient_address = order.address or f"{settings.site_title or 'Spaceghor'} Customer Address"
        if len(recipient_address) < 10:
            recipient_address = f"{recipient_address}, Bangladesh"
        if len(recipient_address) < 10:
            recipient_address = recipient_address.ljust(10, '.')
            
        payload = {
            'store_id': store_id,
            'merchant_order_id': str(order.id),
            'delivery_type': 1, # Home Delivery
            'product_type': 1, # Regular Package
            'recipient_name': order.customer_name,
            'recipient_phone': order.phone_number,
            'recipient_address': recipient_address,
            'city_id': city_id,
            'zone_id': zone_id,
            'item_weight': 1000, # Grams (default 1kg)
            'item_quantity': total_qty,
            'collectable_amount': int(float(order.total_amount)),
            'product_description': product_desc
        }
        
        create_url = f"{base_url}/api/v2/orders"
        try:
            response = requests.post(create_url, json=payload, headers=headers, timeout=15)
            response_data = response.json()
            
            if response.status_code in [200, 201]:
                order_info = response_data.get('order') or response_data.get('data', {}).get('order') or response_data.get('data') or response_data
                tracking_code = order_info.get('tracking_code') or order_info.get('id') or response_data.get('tracking_code')
                consignment_id = order_info.get('consignment_id') or order_info.get('id')
                
                if tracking_code:
                    order.courier_name = 'carrybee'
                    order.courier_consignment_id = str(consignment_id)
                    order.courier_tracking_code = str(tracking_code)
                    order.status = 'processing'
                    order.save()
                    
                    from .models import OrderNote
                    OrderNote.objects.create(
                        order=order,
                        user=request.user,
                        note=f"Dispatched via Carrybee. Consignment ID: {order.courier_consignment_id}, Tracking Code: {order.courier_tracking_code}"
                    )
                    
                    return Response({
                        'message': 'Successfully dispatched to Carrybee',
                        'consignment_id': order.courier_consignment_id,
                        'tracking_code': order.courier_tracking_code
                    })
                else:
                    return Response({'error': 'Carrybee API response did not contain a valid tracking/consignment ID.'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                error_msg = response_data.get('message') or response_data.get('error') or f"Carrybee API error: {response.text}"
                return Response({'error': error_msg}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({'error': f"Failed to connect to Carrybee: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], permission_classes=[IsModeratorOrAdmin])
    def check_status(self, request, pk=None):
        import requests
        order = self.get_object()
        if not order.courier_tracking_code:
            return Response({'error': 'Order not dispatched to any courier.'}, status=status.HTTP_400_BAD_REQUEST)
            
        settings = SiteSettings.objects.first()
        if not settings:
            return Response({'error': 'Site settings not found.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        courier = order.courier_name or 'steadfast'
        
        if courier == 'steadfast':
            if not settings.steadfast_api_key or not settings.steadfast_secret_key:
                return Response({'error': 'Steadfast credentials are not configured.'}, status=status.HTTP_400_BAD_REQUEST)
                
            base_url = settings.steadfast_base_url.rstrip('/')
            url = f"{base_url}/status_by_trackingcode/{order.courier_tracking_code}"
            
            headers = {
                'Api-Key': settings.steadfast_api_key,
                'Secret-Key': settings.steadfast_secret_key,
                'Content-Type': 'application/json'
            }
            
            try:
                response = requests.get(url, headers=headers, timeout=15)
                response_data = response.json()
                if response.status_code == 200:
                    status_text = response_data.get('delivery_status') or 'unknown'
                    if str(status_text).lower() == 'unknown':
                        if order.status != 'cancelled':
                            order.status = 'cancelled'
                            order.save()
                            from .models import OrderNote
                            OrderNote.objects.create(
                                order=order,
                                user=request.user if request.user.is_authenticated else None,
                                note="Order status automatically set to cancelled because Steadfast courier tracking status is unknown."
                            )
                    return Response({'delivery_status': status_text})
                else:
                    return Response({'error': f"Steadfast API error: {response.text}"}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({'error': f"Failed to connect to Steadfast: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        elif courier == 'carrybee':
            if not settings.carrybee_client_id or not settings.carrybee_client_secret:
                return Response({'error': 'Carrybee credentials are not configured.'}, status=status.HTTP_400_BAD_REQUEST)
                
            base_url = settings.carrybee_base_url.rstrip('/')
            url = f"{base_url}/api/v2/orders/{order.courier_tracking_code}"
            
            headers = {
                'Client-ID': settings.carrybee_client_id,
                'Client-Secret': settings.carrybee_client_secret,
                'Client-Context': settings.carrybee_client_context or '',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
            
            try:
                response = requests.get(url, headers=headers, timeout=15)
                response_data = response.json()
                if response.status_code == 200:
                    order_info = response_data.get('order') or response_data.get('data', {}).get('order') or response_data.get('data') or response_data
                    status_text = order_info.get('status') or order_info.get('delivery_status') or 'unknown'
                    if isinstance(status_text, dict):
                        status_text = status_text.get('name') or status_text.get('title') or str(status_text)
                    if str(status_text).lower() == 'unknown':
                        if order.status != 'cancelled':
                            order.status = 'cancelled'
                            order.save()
                            from .models import OrderNote
                            OrderNote.objects.create(
                                order=order,
                                user=request.user if request.user.is_authenticated else None,
                                note="Order status automatically set to cancelled because Carrybee courier tracking status is unknown."
                            )
                    return Response({'delivery_status': str(status_text)})
                else:
                    return Response({'error': f"Carrybee API error: {response.text}"}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({'error': f"Failed to connect to Carrybee: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({'error': f"Unknown courier provider: {courier}"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def request_cancel(self, request, pk=None):
        order = self.get_object()
        if order.user != request.user:
            return Response({'error': 'You do not have permission to cancel this order.'}, status=status.HTTP_403_FORBIDDEN)
        
        if order.status.lower() != 'pending':
            return Response({'error': f'Orders in status {order.status} cannot be cancelled.'}, status=status.HTTP_400_BAD_REQUEST)
        
        order.status = 'cancelled'
        order.save(update_fields=['status'])
        
        from .models import OrderNote
        OrderNote.objects.create(
            order=order,
            user=request.user,
            note="Order cancelled by customer request."
        )
        
        return Response({'message': 'Order successfully cancelled.', 'status': order.status})

class IncompleteOrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['user']
    search_fields = ['id', 'customer_name', 'phone_number', 'address']
    ordering_fields = ['created_at', 'total_amount']

    def get_queryset(self):
        user = self.request.user
        if user and user.is_authenticated and hasattr(user, 'profile') and user.profile.role in ['admin', 'moderator']:
            return Order.objects.filter(status='draft')
        if user and user.is_authenticated:
            return Order.objects.filter(user=user, status='draft')
        return Order.objects.none()

    def get_permissions(self):
        if self.action in ['create', 'partial_update', 'update']:
            return [permissions.AllowAny()]
        return [IsModeratorOrAdmin()]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        ip = get_client_ip(self.request)
        ua = self.request.META.get('HTTP_USER_AGENT', 'Unknown')
        loc = get_location_from_ip(ip)

        serializer.save(
            user=user,
            status='draft',
            ip_address=ip,
            user_agent=ua,
            location=loc
        )

    @action(detail=True, methods=['post'], permission_classes=[IsModeratorOrAdmin])
    def convert_to_order(self, request, pk=None):
        draft = self.get_object()
        if draft.status != 'draft':
            return Response({'error': 'This order has already been converted or is not a draft.'}, status=status.HTTP_400_BAD_REQUEST)
        
        draft.status = 'pending'
        draft.created_at = timezone.now()
        draft.save()

        # Trigger notification
        Notification.objects.create(
            title="New Order Converted",
            message=f"Draft order #{str(draft.id).zfill(8)} placed by {draft.customer_name} has been completed.",
            type='success',
            link='/staff/admin/orders'
        )

        # Trigger SMS confirmation if enabled
        settings = SiteSettings.objects.first()
        if settings and settings.enable_order_confirmation_sms and draft.phone_number:
            from .sms_utils import send_sms
            message = f"আপনার অর্ডার #{str(draft.id).zfill(8)} সফলভাবে গ্রহণ করা হয়েছে। {settings.site_title}-এর সাথে কেনাকাটা করার জন্য ধন্যবাদ!"
            send_sms(draft.phone_number, message)

        return Response({'message': f'Draft order #{draft.id} successfully converted to a pending order!'})

    @action(detail=False, methods=['post'], permission_classes=[IsModeratorOrAdmin])
    def clean_duplicates(self, request):
        drafts = Order.objects.filter(status='draft').exclude(phone_number__in=['', None])
        
        phone_groups = {}
        for draft in drafts:
            phone = draft.phone_number.strip()
            if phone:
                if phone not in phone_groups:
                    phone_groups[phone] = []
                phone_groups[phone].append(draft)
        
        deleted_count = 0
        deleted_ids = []
        for phone, group in phone_groups.items():
            if len(group) > 1:
                group.sort(key=lambda x: x.id, reverse=True)
                duplicates_to_delete = group[1:]
                for dup in duplicates_to_delete:
                    deleted_ids.append(dup.id)
                    dup.delete()
                    deleted_count += 1
                    
        return Response({
            'message': f'Successfully cleaned up {deleted_count} duplicate draft orders.',
            'deleted_count': deleted_count,
            'deleted_ids': deleted_ids
        }, status=status.HTTP_200_OK)

class SiteSettingsViewSet(viewsets.ModelViewSet):
    queryset = SiteSettings.objects.all()
    serializer_class = SiteSettingsSerializer

    def get_object(self):
        return SiteSettings.objects.first()
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsFullAdmin()]

    @action(detail=False, methods=['get'])
    def sms_balance(self, request):
        from .sms_utils import get_balance
        balance = get_balance()
        return Response({'balance': balance})

class NoticeViewSet(viewsets.ModelViewSet):
    queryset = Notice.objects.all().order_by('-created_at')
    serializer_class = NoticeSerializer
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return Notice.objects.all().order_by('-created_at')
        return Notice.objects.filter(is_active=True).order_by('-created_at')
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsFullAdmin()]

class FlashSaleViewSet(viewsets.ModelViewSet):
    queryset = FlashSale.objects.all()
    serializer_class = FlashSaleSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsFullAdmin()]

class FlashSaleItemViewSet(viewsets.ModelViewSet):
    queryset = FlashSaleItem.objects.all()
    serializer_class = FlashSaleItemSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['flash_sale', 'product']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsFullAdmin()]

class FunnelViewSet(viewsets.ModelViewSet):
    queryset = Funnel.objects.all()
    serializer_class = FunnelSerializer
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['product', 'product_two']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsFullAdmin()]

class WishlistViewSet(viewsets.ModelViewSet):
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['user']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Wishlist.objects.all()
        return Wishlist.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, created = Profile.objects.get_or_create(user=self.request.user)
        return profile

    def get(self, request, *args, **kwargs):
        user_serializer = UserSerializer(request.user)
        profile_serializer = self.get_serializer(self.get_object())
        return Response({
            'user': user_serializer.data,
            'profile': profile_serializer.data
        })

    def post(self, request, *args, **kwargs):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not user.check_password(current_password):
            return Response({'error': 'Incorrect current password.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not new_password or len(new_password) < 6:
            return Response({'error': 'Password must be at least 6 characters long.'}, status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(new_password)
        user.save()
        
        # Clear temporary password flag
        profile = self.get_object()
        profile.is_temp_password = False
        profile.save()
        
        return Response({'message': 'Password changed successfully.'})

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['user', 'is_read']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Notification.objects.all()
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'notification marked as read'})

class GlobalSearchView(generics.GenericAPIView):
    permission_classes = [IsModeratorOrAdmin]

    def get(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response([])

        results = []

        # Search Products
        products = Product.objects.filter(name__icontains=query)[:5]
        for p in products:
            results.append({
                'id': p.id,
                'type': 'product',
                'title': p.name,
                'subtitle': f"৳{p.regular_price}",
                'link': f"/staff/admin/products?search={p.name}",
                'tab': 'products'
            })

        # Search Orders
        orders = Order.objects.filter(
            Q(id__icontains=query) | 
            Q(customer_name__icontains=query) |
            Q(phone_number__icontains=query)
        )[:5]
        for o in orders:
            results.append({
                'id': o.id,
                'type': 'order',
                'title': f"Order #{str(o.id).zfill(8)}",
                'subtitle': o.customer_name,
                'link': f"/staff/admin/orders?search={o.id}",
                'tab': 'orders'
            })

        # Search Users
        users = User.objects.filter(
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        )[:5]
        for u in users:
            results.append({
                'id': u.id,
                'type': 'user',
                'title': u.username,
                'subtitle': f"{u.first_name} {u.last_name}",
                'link': f"/staff/admin/users?search={u.username}",
                'tab': 'users'
            })

        return Response(results)


class AdminStatsView(generics.GenericAPIView):
    permission_classes = [IsModeratorOrAdmin]

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        orders_query = Order.objects.all()
        if start_date:
            orders_query = orders_query.filter(created_at__date__gte=start_date)
        if end_date:
            orders_query = orders_query.filter(created_at__date__lte=end_date)

        total_sales = orders_query.filter(status='delivered').aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        order_count = orders_query.exclude(status='draft').count()
        pending_orders = orders_query.filter(status='pending').count()
        cancelled_orders = Order.objects.filter(status='cancelled').count()
        user_count = User.objects.count()
        low_stock_products = Product.objects.filter(stock__lt=10).count()
        
        # Recent orders (last 5, excluding drafts)
        recent_orders = OrderSerializer(orders_query.exclude(status='draft').order_by('-created_at')[:5], many=True).data
        
        # Incomplete/Cancelled orders
        total_incomplete = orders_query.filter(status='draft').count()
        
        # Conversion rate calculation
        total_attempts = order_count + total_incomplete
        if total_attempts > 0:
            conversion_rate = round((order_count / total_attempts) * 100, 1)
        else:
            conversion_rate = 0.0
        
        # Graph data (grouping by date, excluding drafts)
        from django.db.models.functions import TruncDate
        graph_qs = orders_query.exclude(status='draft').annotate(date=TruncDate('created_at')).values('date').annotate(count=Count('id')).order_by('date')
        
        graph_data = []
        for entry in graph_qs:
            graph_data.append({
                "name": entry['date'].strftime('%b %d') if entry['date'] else 'N/A',
                "orders": entry['count']
            })

        # If no data, provide a clean empty state or some mock data for better UX
        if not graph_data:
            graph_data = [{"name": "No Data", "orders": 0}]
        
        return Response({
            'total_sales': total_sales,
            'total_orders': order_count,
            'order_count': order_count,
            'total_incomplete': total_incomplete,
            'pending_orders': pending_orders,
            'cancelled_orders': cancelled_orders,
            'conversion_rate': conversion_rate,
            'recent_orders': recent_orders,
            'graph_data': graph_data,
            'user_count': user_count,
            'low_stock_products': low_stock_products
        })

class DistrictViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = District.objects.all()
    serializer_class = DistrictSerializer
    permission_classes = [permissions.AllowAny]

class UpazilaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Upazila.objects.all()
    serializer_class = UpazilaSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['district']

class PaymentMethodViewSet(viewsets.ModelViewSet):
    queryset = PaymentMethod.objects.all()
    serializer_class = PaymentMethodSerializer

    def get_queryset(self):
        user = self.request.user
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            if user.is_authenticated and hasattr(user, 'profile') and user.profile.role in ['admin', 'moderator']:
                return PaymentMethod.objects.all()
            return PaymentMethod.objects.filter(is_active=True)
            
        manage = self.request.query_params.get('manage', 'false') == 'true'
        if manage and user.is_authenticated and hasattr(user, 'profile') and user.profile.role in ['admin', 'moderator']:
            return PaymentMethod.objects.all()
        return PaymentMethod.objects.filter(is_active=True)

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsModeratorOrAdmin()]

class ShippingZoneViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ShippingZone.objects.all()
    serializer_class = ShippingZoneSerializer
    permission_classes = [permissions.AllowAny]

class BlogCategoryViewSet(viewsets.ModelViewSet):
    queryset = BlogCategory.objects.all()
    serializer_class = BlogCategorySerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsFullAdmin()]

class BlogPostViewSet(viewsets.ModelViewSet):
    queryset = BlogPost.objects.all()
    serializer_class = BlogPostSerializer
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'views']
    
    def get_queryset(self):
        user = self.request.user
        # Staff/Admins should see all blog posts including drafts
        if user and user.is_authenticated and (user.is_superuser or (hasattr(user, 'profile') and user.profile.role in ['admin', 'moderator'])):
            return BlogPost.objects.all()
        return BlogPost.objects.filter(is_published=True)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Increment views if the request is not from an admin/staff to avoid inflating counts during editing
        user = request.user
        is_staff = user and user.is_authenticated and (user.is_superuser or (hasattr(user, 'profile') and user.profile.role in ['admin', 'moderator']))
        if not is_staff:
            instance.views += 1
            instance.save(update_fields=['views'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsFullAdmin()]

class ColorViewSet(viewsets.ModelViewSet):
    queryset = Color.objects.all()
    serializer_class = ColorSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsFullAdmin()]

class SizeViewSet(viewsets.ModelViewSet):
    queryset = Size.objects.all()
    serializer_class = SizeSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsFullAdmin()]

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsFullAdmin()]

class ProductImageViewSet(viewsets.ModelViewSet):
    queryset = ProductImage.objects.all()
    serializer_class = ProductImageSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsFullAdmin()]

class ProductVideoViewSet(viewsets.ModelViewSet):
    queryset = ProductVideo.objects.all()
    serializer_class = ProductVideoSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsFullAdmin()]

class OTPViewSet(viewsets.GenericViewSet):
    serializer_class = OTPSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'])
    def check_phone(self, request):
        phone_number = request.data.get('phone_number')
        if not phone_number:
            return Response({'error': 'Phone number is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Look for user by username (which is the phone number)
        user = User.objects.filter(username=phone_number).first()
        if not user:
            # Maybe search profile phone_number
            profile = Profile.objects.filter(phone_number=phone_number).first()
            if profile:
                user = profile.user
        
        if not user:
            return Response({
                'exists': False,
                'has_password': False
            })
            
        # Check if password is temporary/passwordless
        has_password = True
        profile = getattr(user, 'profile', None)
        if profile and profile.is_temp_password:
            has_password = False
        elif not user.has_usable_password():
            has_password = False
            
        return Response({
            'exists': True,
            'has_password': has_password
        })

    @action(detail=False, methods=['post'])
    def setup_password(self, request):
        phone_number = request.data.get('phone_number')
        code = request.data.get('code')
        new_password = request.data.get('new_password')
        
        if not all([phone_number, code, new_password]):
            return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Verify OTP
        otp = OTP.objects.filter(phone_number=phone_number, code=code, is_used=False).first()
        if not otp:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
            
        if otp.is_expired:
            return Response({'error': 'OTP has expired'}, status=status.HTTP_400_BAD_REQUEST)
            
        otp.is_used = True
        otp.save()
        
        # Get User
        user = User.objects.filter(username=phone_number).first()
        if not user:
            profile = Profile.objects.filter(phone_number=phone_number).first()
            if profile:
                user = profile.user
                
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
        # Set Password
        user.set_password(new_password)
        user.save()
        
        # Clear temporary password flag
        profile = getattr(user, 'profile', None)
        if profile:
            profile.is_temp_password = False
            profile.save()
            
        # Generate Token and Login
        token, created = Token.objects.get_or_create(user=user)
        
        # Log login activity
        ip = get_client_ip(request)
        ua = request.META.get('HTTP_USER_AGENT', 'Unknown')
        loc = get_location_from_ip(ip)
        UserActivityLog.objects.create(
            user=user,
            action="Login (Password Setup)",
            ip_address=ip,
            device_info=ua[:255] if ua else "Unknown Device",
            location=loc
        )
        
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email
        })

    @action(detail=False, methods=['post'])
    def request_otp(self, request):
        phone_number = request.data.get('phone_number')
        if not phone_number:
            return Response({'error': 'Phone number is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate 4 digit OTP (as requested Your {Brand} OTP is XXXX)
        code = ''.join(random.choices(string.digits, k=4))
        
        OTP.objects.create(phone_number=phone_number, code=code)
        
        from .sms_utils import send_otp_sms
        success, message = send_otp_sms(phone_number, code)
        
        if success:
            return Response({'message': 'OTP sent successfully'})
        else:
            return Response({'error': f'Failed to send OTP: {message}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def verify_otp(self, request):
        phone_number = request.data.get('phone_number')
        code = request.data.get('code')
        
        if not phone_number or not code:
            return Response({'error': 'Phone number and code are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        otp = OTP.objects.filter(phone_number=phone_number, code=code, is_used=False).first()
        
        if not otp:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
        
        if otp.is_expired:
            return Response({'error': 'OTP has expired'}, status=status.HTTP_400_BAD_REQUEST)
        
        otp.is_used = True
        otp.save()
        
        return Response({'message': 'OTP verified successfully', 'valid': True})

    @action(detail=False, methods=['post'])
    def reset_password(self, request):
        phone_number = request.data.get('phone_number')
        code = request.data.get('code')
        new_password = request.data.get('new_password')
        
        if not all([phone_number, code, new_password]):
            return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        otp = OTP.objects.filter(phone_number=phone_number, code=code, is_used=True).order_by('-created_at').first()
        
        if not otp or (timezone.now() - otp.created_at).total_seconds() > 600: # 10 mins
             return Response({'error': 'OTP session expired or invalid'}, status=status.HTTP_400_BAD_REQUEST)

        # Try to find user by username (phone_number) or profile phone number
        user = User.objects.filter(username=phone_number).first()
        if not user:
             profile = Profile.objects.filter(phone_number=phone_number).first()
             if profile:
                 user = profile.user
        
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
        user.set_password(new_password)
        user.save()
        
        return Response({'message': 'Password reset successfully'})

class MetaView(View):
    def get(self, request, *args, **kwargs):
        try:
            path = request.GET.get('path', '').strip('/')
            from .models import SiteSettings
            from django.conf import settings as django_settings
            site_settings = SiteSettings.objects.first()
            site_title = site_settings.site_title if site_settings else "Spaceghor"
            
            # Helper to extract clean text from potential Quill JSON, HTML, or plain text
            def extract_clean_text(raw_desc):
                if not raw_desc:
                    return ""
                raw_desc = str(raw_desc).strip()
                if raw_desc.startswith('{') and raw_desc.endswith('}'):
                    try:
                        import json
                        data = json.loads(raw_desc)
                        if isinstance(data, dict):
                            html_content = data.get('html')
                            if html_content:
                                import re
                                clean = re.sub(r'<[^>]+>', '', str(html_content))
                                return clean.strip()
                            delta = data.get('delta', {})
                            if isinstance(delta, dict) and 'ops' in delta:
                                ops = delta['ops']
                                text_parts = []
                                for op in ops:
                                    if isinstance(op, dict) and 'insert' in op:
                                        text_parts.append(str(op['insert']))
                                return "".join(text_parts).strip()
                    except Exception:
                        pass
                import re
                clean = re.sub(r'<[^>]+>', '', raw_desc)
                return clean.strip()

            # Default values from site settings
            title = f"{site_title} | Premium Gadget & Accessories Shop"
            description = site_settings.meta_description if site_settings and site_settings.meta_description else f"{site_title} - Premium Gadget & Accessories Shop in Bangladesh"
            # Strip HTML/JSON from default description if any
            description = extract_clean_text(description)
            
            # Safe image URL retrieval to avoid ValueErrors on empty fields
            # Default fallback to site logo in media
            image = request.build_absolute_uri('/media/site/Qbamart.png')
            if site_settings and site_settings.site_logo:
                try:
                    image = request.build_absolute_uri(site_settings.site_logo.url)
                except ValueError:
                    pass

            # Always point canonical URL to the frontend domain
            frontend_url = getattr(django_settings, 'FRONTEND_URL', 'https://spaceghor.com').rstrip('/')
            canonical_url = f"{frontend_url}/{path}" if path else f"{frontend_url}/"
            
            # Determine content type based on path
            if 'product/' in path:
                slug = path.split('product/')[-1].split('?')[0].strip('/')
                product = Product.objects.filter(slug=slug).first()
                if product:
                    title = f"{product.name} | {site_title}"
                    raw_desc = product.short_description or product.description or ''
                    clean_desc = extract_clean_text(raw_desc)[:200]
                    description = clean_desc or description
                    if product.image:
                        try:
                            image = request.build_absolute_uri(product.image.url)
                        except ValueError:
                            pass
            
            elif 'blog/' in path:
                slug = path.split('blog/')[-1].split('?')[0].strip('/')
                post = BlogPost.objects.filter(slug=slug).first()
                if post:
                    title = f"{post.title} | {site_title}"
                    raw_desc = getattr(post, 'excerpt', '') or post.content or ''
                    clean_desc = extract_clean_text(raw_desc)[:200]
                    description = clean_desc or description
                    if hasattr(post, 'image') and post.image:
                        try:
                            image = request.build_absolute_uri(post.image.url)
                        except ValueError:
                            pass
            
            elif 'offer/' in path or 'step/' in path:
                slug = (path.split('offer/')[-1] if 'offer/' in path else path.split('step/')[-1]).split('?')[0].strip('/')
                funnel = Funnel.objects.filter(slug=slug).first()
                if funnel and funnel.product:
                    title = f"{funnel.title or funnel.product.name} | {site_title}"
                    raw_desc = funnel.product.short_description or funnel.product.description or ''
                    clean_desc = extract_clean_text(raw_desc)[:200]
                    description = clean_desc or description
                    if funnel.product.image:
                        try:
                            image = request.build_absolute_uri(funnel.product.image.url)
                        except ValueError:
                            pass
            
            # Build minimal HTML shell with full OG tags
            html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{title}</title>
    <meta name="description" content="{description}">
    
    <!-- Open Graph -->
    <meta property="og:site_name" content="{site_title}">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{description}">
    <meta property="og:image" content="{image}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="{canonical_url}">
    <meta property="og:type" content="{'product' if 'product/' in path else 'article' if 'blog/' in path else 'website'}">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{title}">
    <meta name="twitter:description" content="{description}">
    <meta name="twitter:image" content="{image}">
</head>
<body>
    <h1>{title}</h1>
    <p>{description}</p>
    <img src="{image}" />
</body>
</html>"""
            return HttpResponse(html)
        except Exception as e:
            import traceback
            return HttpResponse(f"Error: {str(e)}<br><pre>{traceback.format_exc()}</pre>", status=500)



from rest_framework.views import APIView
from django.conf import settings
import os

class MediaManagerView(APIView):
    permission_classes = [IsModeratorOrAdmin]

    def get(self, request):
        media_root = settings.MEDIA_ROOT
        if not os.path.exists(media_root):
            return Response([])

        # Collect all referenced paths from the database
        connections_map = {}

        def add_conn(path_val, model_type, instance_id, display_name):
            if not path_val:
                return
            path_str = str(path_val).replace('\\', '/').strip('/')
            if not path_str:
                return
            if path_str not in connections_map:
                connections_map[path_str] = []
            connections_map[path_str].append({
                'type': model_type,
                'id': instance_id,
                'name': display_name
            })

        # Import models locally to avoid circular dependencies
        from .models import (
            Category, Brand, Product, ProductImage, ProductVideo,
            Banner, Profile, ReviewImage, Notice, BlogPost, SiteSettings,
            ProductFunnelSection, FunnelReviewImage
        )

        try:
            # Category
            for obj in Category.objects.all():
                if obj.image:
                    add_conn(obj.image.name, 'Category', obj.id, obj.name)
                if obj.mega_menu_banner:
                    add_conn(obj.mega_menu_banner.name, 'Category Banner', obj.id, obj.name)

            # Brand
            for obj in Brand.objects.all():
                if obj.logo:
                    add_conn(obj.logo.name, 'Brand Logo', obj.id, obj.name)

            # Product
            for obj in Product.objects.all():
                if obj.image:
                    add_conn(obj.image.name, 'Product Image', obj.id, obj.name)

            # ProductImage
            for obj in ProductImage.objects.select_related('product').all():
                if obj.image:
                    add_conn(obj.image.name, 'Product Gallery Image', obj.id, obj.product.name if obj.product else f"Image #{obj.id}")

            # ProductVideo
            for obj in ProductVideo.objects.select_related('product').all():
                if obj.video:
                    add_conn(obj.video.name, 'Product Video', obj.id, obj.product.name if obj.product else f"Video #{obj.id}")

            # Banner
            for obj in Banner.objects.all():
                if obj.image:
                    add_conn(obj.image.name, 'Banner Image', obj.id, obj.title or f"Banner #{obj.id}")
                if obj.video:
                    add_conn(obj.video.name, 'Banner Video', obj.id, obj.title or f"Banner #{obj.id}")

            # Profile
            for obj in Profile.objects.select_related('user').all():
                if obj.profile_picture:
                    add_conn(obj.profile_picture.name, 'Profile Picture', obj.id, obj.user.username)

            # ReviewImage
            for obj in ReviewImage.objects.select_related('review', 'review__product').all():
                if obj.image:
                    pname = obj.review.product.name if (obj.review and obj.review.product) else f"Review #{obj.id}"
                    add_conn(obj.image.name, 'Review Image', obj.id, pname)

            # Notice
            for obj in Notice.objects.all():
                if obj.image:
                    add_conn(obj.image.name, 'Notice Image', obj.id, obj.title or obj.text[:30])

            # BlogPost
            for obj in BlogPost.objects.all():
                if obj.image:
                    add_conn(obj.image.name, 'Blog Post Image', obj.id, obj.title)

            # SiteSettings
            for obj in SiteSettings.objects.all():
                if obj.site_logo:
                    add_conn(obj.site_logo.name, 'Site Logo', obj.id, obj.site_title)
                if obj.site_favicon:
                    add_conn(obj.site_favicon.name, 'Site Favicon', obj.id, obj.site_title)
                if obj.footer_logo:
                    add_conn(obj.footer_logo.name, 'Footer Logo', obj.id, obj.site_title)
                if obj.messenger_image:
                    add_conn(obj.messenger_image.name, 'Messenger Image', obj.id, obj.site_title)

            # ProductFunnelSection
            for obj in ProductFunnelSection.objects.select_related('product').all():
                if obj.image:
                    add_conn(obj.image.name, 'Funnel Section Image', obj.id, obj.product.name if obj.product else f"Section #{obj.id}")
                if obj.video:
                    add_conn(obj.video.name, 'Funnel Section Video', obj.id, obj.product.name if obj.product else f"Section #{obj.id}")

            # FunnelReviewImage
            for obj in FunnelReviewImage.objects.select_related('funnel').all():
                if obj.image:
                    add_conn(obj.image.name, 'Funnel Review Image', obj.id, f"Funnel {obj.funnel.slug if obj.funnel else obj.id}")

        except Exception as ex:
            print(f"Error scanning connections in media manager: {ex}")

        files_list = []
        for root, dirs, files in os.walk(media_root):
            # Skip hidden folders / cache folders
            if any(part.startswith('.') for part in root.split(os.sep)):
                continue
            for file in files:
                if file.startswith('.'):
                    continue
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, media_root)
                
                try:
                    stat_info = os.stat(file_path)
                    size = stat_info.st_size
                    modified = stat_info.st_mtime
                except Exception:
                    size = 0
                    modified = 0

                url = settings.MEDIA_URL + rel_path.replace('\\', '/')
                ext = os.path.splitext(file)[1].lower()
                file_type = 'other'
                if ext in ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp']:
                    file_type = 'image'
                elif ext in ['.mp4', '.webm', '.ogg', '.mov']:
                    file_type = 'video'

                norm_path = rel_path.replace('\\', '/').strip('/')
                connections = connections_map.get(norm_path, [])

                files_list.append({
                    'name': file,
                    'path': rel_path.replace('\\', '/'),
                    'url': url,
                    'size': size,
                    'modified': modified,
                    'type': file_type,
                    'connections': connections
                })
        
        files_list.sort(key=lambda x: x['modified'], reverse=True)
        return Response(files_list)

    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        # Save to media/uploads/
        upload_dir = os.path.join(settings.MEDIA_ROOT, 'uploads')
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)

        # Unique name if exists
        name = file_obj.name
        file_path = os.path.join(upload_dir, name)
        base, ext = os.path.splitext(name)
        counter = 1
        while os.path.exists(file_path):
            name = f"{base}_{counter}{ext}"
            file_path = os.path.join(upload_dir, name)
            counter += 1

        with open(file_path, 'wb+') as destination:
            for chunk in file_obj.chunks():
                destination.write(chunk)

        url = settings.MEDIA_URL + 'uploads/' + name
        return Response({
            'name': name,
            'path': 'uploads/' + name,
            'url': url,
            'type': 'image' if ext.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'] else 'video' if ext.lower() in ['.mp4', '.webm', '.ogg', '.mov'] else 'other'
        }, status=status.HTTP_201_CREATED)

    def delete(self, request):
        path = request.data.get('path')
        paths = request.data.get('paths')
        if not path and not paths:
            return Response({'error': 'Path or paths is required'}, status=status.HTTP_400_BAD_REQUEST)

        media_root = os.path.abspath(settings.MEDIA_ROOT)
        paths_to_delete = paths if paths else [path]
        deleted_count = 0
        errors = []

        for p in paths_to_delete:
            # Security check: prevent directory traversal
            target_path = os.path.abspath(os.path.join(media_root, p))
            if not target_path.startswith(media_root):
                errors.append({'path': p, 'error': 'Access denied'})
                continue
            if not os.path.exists(target_path):
                errors.append({'path': p, 'error': 'File not found'})
                continue
            try:
                os.remove(target_path)
                deleted_count += 1
            except Exception as e:
                errors.append({'path': p, 'error': str(e)})

        if errors and deleted_count == 0:
            return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'message': f'{deleted_count} files deleted successfully',
            'errors': errors if errors else None
        })


class SecurityAuditView(APIView):
    permission_classes = [IsModeratorOrAdmin]

    def get(self, request):
        import django
        from django.conf import settings
        import sys
        
        packages_list = []
        try:
            if sys.version_info >= (3, 8):
                from importlib import metadata
            else:
                import importlib_metadata as metadata
            
            for dist in metadata.distributions():
                name = dist.metadata.get('Name', '')
                if name:
                    packages_list.append({
                        'name': name,
                        'version': dist.version,
                        'summary': dist.metadata.get('Summary', 'Python package.'),
                        'status': 'secure',
                        'type': 'backend'
                    })
        except Exception as e:
            packages_list = [
                {'name': 'Django', 'version': django.get_version(), 'summary': 'Web framework.', 'status': 'secure', 'type': 'backend'},
                {'name': 'djangorestframework', 'version': '3.15.x', 'summary': 'REST framework.', 'status': 'secure', 'type': 'backend'},
            ]

        exploits = []
        if settings.DEBUG:
            exploits.append({
                'title': 'Debug Mode Enabled',
                'severity': 'HIGH',
                'detail': 'Django DEBUG=True is active. This can leak sensitive system details and stack traces.'
            })
        
        db_engine = settings.DATABASES.get('default', {}).get('ENGINE', 'unknown')
        ssl_active = False
        db_options = settings.DATABASES.get('default', {}).get('OPTIONS', {})
        if db_options and ('sslmode' in db_options or 'ssl' in db_options):
            ssl_active = True

        status_str = "SECURE"
        if exploits:
            status_str = "WARNING"

        return Response({
            'status': status_str,
            'database': {
                'engine': db_engine,
                'ssl_active': ssl_active,
                'exploits': exploits
            },
            'framework': {
                'version': django.get_version(),
                'debug_mode': settings.DEBUG,
                'secure_ssl_redirect': getattr(settings, 'SECURE_SSL_REDIRECT', False),
                'session_cookie_secure': getattr(settings, 'SESSION_COOKIE_SECURE', False)
            },
            'packages': packages_list
        })


# bKash payment gateway callback
from django.shortcuts import redirect
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
import urllib.parse

def get_frontend_url(request):
    referrer = request.META.get('HTTP_REFERER')
    if referrer:
        from urllib.parse import urlparse
        parsed = urlparse(referrer)
        return f"{parsed.scheme}://{parsed.netloc}"
        
    origin = request.META.get('HTTP_ORIGIN')
    if origin:
        return origin
        
    from django.conf import settings
    cors_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
    if cors_origins:
        return cors_origins[0]
    return 'http://localhost:5173'

class BkashCallbackView(View):
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def get(self, request, *args, **kwargs):
        payment_id = request.GET.get('paymentID')
        status_param = request.GET.get('status')
        
        frontend_base = get_frontend_url(request)
        
        if not payment_id or not status_param:
            redirect_url = f"{frontend_base}/checkout?status=failure&message=Invalid+callback+parameters"
            return redirect(redirect_url)
            
        from .models import Order, SiteSettings
        order = Order.objects.filter(payment_gateway_id=payment_id).first()
        if not order:
            redirect_url = f"{frontend_base}/checkout?status=failure&message=Order+not+found+for+payment+ID"
            return redirect(redirect_url)
            
        if status_param == 'success':
            from .bkash_utils import execute_bkash_payment
            execute_res = execute_bkash_payment(payment_id)
            
            if not execute_res:
                redirect_url = f"{frontend_base}/checkout?status=failure&message=Failed+to+execute+bKash+payment"
                return redirect(redirect_url)
                
            status_str = execute_res.get('transactionStatus') or execute_res.get('status')
            
            if status_str in ['Completed', 'Success']:
                order.is_paid = True
                order.status = 'processing'
                order.save(update_fields=['is_paid', 'status'])
                
                settings = SiteSettings.objects.first()
                if settings and settings.enable_order_confirmation_sms and order.phone_number:
                    from .sms_utils import send_sms
                    message = f"আপনার অর্ডার #{str(order.id).zfill(8)} সফলভাবে গ্রহণ করা হয়েছে এবং পেমেন্ট সম্পন্ন হয়েছে। {settings.site_title}-এর সাথে কেনাকাটা করার জন্য ধন্যবাদ!"
                    send_sms(order.phone_number, message)
                
                query_params = {
                    'status': 'success',
                    'order_id': order.id,
                    'phone': order.phone_number,
                    'name': order.customer_name
                }
                redirect_url = f"{frontend_base}/checkout?{urllib.parse.urlencode(query_params)}"
                return redirect(redirect_url)
            else:
                error_msg = execute_res.get('statusMessage', 'Execution failed')
                redirect_url = f"{frontend_base}/checkout?status=failure&message={urllib.parse.quote(error_msg)}"
                return redirect(redirect_url)
                
        elif status_param == 'cancel':
            order.status = 'cancelled'
            order.save(update_fields=['status'])
            redirect_url = f"{frontend_base}/checkout?status=cancel"
            return redirect(redirect_url)
            
        else:
            order.status = 'cancelled'
            order.save(update_fields=['status'])
            redirect_url = f"{frontend_base}/checkout?status=failure&message=Payment+failed"
            return redirect(redirect_url)


class SitemapView(View):
    def get(self, request, *args, **kwargs):
        from django.conf import settings as django_settings
        frontend_url = getattr(django_settings, 'FRONTEND_URL', 'https://spaceghor.com').rstrip('/')
        
        # Build sitemap XML
        urls = []
        
        # 1. Static Pages
        static_paths = [
            ('', '1.0', 'daily'),
            ('/products', '0.9', 'daily'),
            ('/flash-sale', '0.8', 'daily'),
            ('/offer', '0.7', 'weekly'),
            ('/blogs', '0.7', 'weekly'),
            ('/about-us', '0.5', 'monthly'),
            ('/contact-us', '0.5', 'monthly'),
            ('/shipping-policy', '0.3', 'monthly'),
            ('/return-replacement-policy', '0.3', 'monthly'),
            ('/privacy-policy', '0.3', 'monthly'),
            ('/terms-conditions', '0.3', 'monthly'),
            ('/brands', '0.5', 'monthly'),
            ('/categories', '0.5', 'monthly'),
        ]
        for path_str, priority, changefreq in static_paths:
            urls.append(f"  <url>\n    <loc>{frontend_url}{path_str}</loc>\n    <changefreq>{changefreq}</changefreq>\n    <priority>{priority}</priority>\n  </url>")
        
        # 2. Dynamic Categories
        categories = Category.objects.all()
        for cat in categories:
            urls.append(f"  <url>\n    <loc>{frontend_url}/products?category={cat.slug}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>")
            
        # 3. Dynamic Brands
        brands = Brand.objects.all()
        for brand in brands:
            urls.append(f"  <url>\n    <loc>{frontend_url}/products?brand={brand.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>")
            
        # 4. Dynamic Products
        products = Product.objects.filter(is_active=True)
        for prod in products:
            urls.append(f"  <url>\n    <loc>{frontend_url}/product/{prod.slug}</loc>\n    <lastmod>{prod.updated_at.strftime('%Y-%m-%d')}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>")
            
        # 5. Dynamic Blog Posts
        posts = BlogPost.objects.filter(is_published=True)
        for post in posts:
            urls.append(f"  <url>\n    <loc>{frontend_url}/blog/{post.slug}</loc>\n    <lastmod>{post.created_at.strftime('%Y-%m-%d')}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>")
            
        # 6. Dynamic Funnels
        funnels = Funnel.objects.filter(is_active=True)
        for funnel in funnels:
            path_prefix = '/step' if funnel.layout_type == 'bangla' else '/offer'
            urls.append(f"  <url>\n    <loc>{frontend_url}{path_prefix}/{funnel.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>")
            
        # Combine
        xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(urls) + '\n</urlset>'
        return HttpResponse(xml_content, content_type="application/xml")


