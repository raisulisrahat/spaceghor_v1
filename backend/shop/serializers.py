from rest_framework import serializers
import json
from .models import (
    Category, Brand, Tag, Color, Size, Product, ProductImage, ProductFunnelSection, 
    Order, OrderItem, OrderNote, Banner, SiteSettings, Notice, FlashSale, FlashSaleItem,
    Review, ReviewImage, District, Upazila, Profile, Wishlist, PaymentMethod,
    Notification, BlogCategory, BlogPost, Funnel, ProductVideo, ShippingZone, OTP, FunnelReviewImage
)
from django.contrib.auth.models import User

class HybridImageField(serializers.ImageField):
    def to_internal_value(self, data):
        if isinstance(data, str) and data:
            from django.conf import settings
            media_url = settings.MEDIA_URL # usually '/media/'
            
            # Remove protocol and domain if present
            path = data
            if '://' in path:
                path = path.split('://', 1)[1]
                path = path.split('/', 1)[1] # remove domain part
            
            if path.startswith('/'):
                path = path[1:]
                
            if media_url.startswith('/'):
                media_url_clean = media_url[1:]
            else:
                media_url_clean = media_url
                
            if path.startswith(media_url_clean):
                path = path[len(media_url_clean):]
                
            return path
        return super().to_internal_value(data)

class HybridFileField(serializers.FileField):
    def to_internal_value(self, data):
        if isinstance(data, str) and data:
            from django.conf import settings
            media_url = settings.MEDIA_URL # usually '/media/'
            
            # Remove protocol and domain if present
            path = data
            if '://' in path:
                path = path.split('://', 1)[1]
                path = path.split('/', 1)[1] # remove domain part
            
            if path.startswith('/'):
                path = path[1:]
                
            if media_url.startswith('/'):
                media_url_clean = media_url[1:]
            else:
                media_url_clean = media_url
                
            if path.startswith(media_url_clean):
                path = path[len(media_url_clean):]
                
            return path
        return super().to_internal_value(data)

class DistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = ['id', 'name']

class UpazilaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Upazila
        fields = ['id', 'district', 'name']

class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = ['id', 'name', 'provider', 'is_active']

class ShippingZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingZone
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = '__all__'

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = '__all__'

class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = '__all__'

class SizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = '__all__'

class ProductImageSerializer(serializers.ModelSerializer):
    color_details = ColorSerializer(source='color', read_only=True)
    image = HybridImageField(required=False, allow_null=True)
    class Meta:
        model = ProductImage
        fields = ['id', 'product', 'color', 'color_details', 'image', 'created_at']

class ProductVideoSerializer(serializers.ModelSerializer):
    video = HybridFileField(required=False, allow_null=True)
    class Meta:
        model = ProductVideo
        fields = ['id', 'product', 'video', 'created_at']

class ProductFunnelSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductFunnelSection
        fields = '__all__'

class ReviewImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewImage
        fields = ['id', 'image', 'created_at']

class ReviewSerializer(serializers.ModelSerializer):
    images = ReviewImageSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_initial = serializers.SerializerMethodField()
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'product', 'product_name', 'user_name', 'user_initial', 'rating', 'headline', 'comment', 'is_verified', 'is_approved', 'images', 'created_at']
        read_only_fields = ['is_verified']

    def get_user_initial(self, obj):
        name = obj.user.get_full_name() or obj.user.username
        return name[0].upper() if name else 'U'

class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    videos = ProductVideoSerializer(many=True, read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    brand = BrandSerializer(read_only=True)
    colors = ColorSerializer(many=True, read_only=True)
    sizes = SizeSerializer(many=True, read_only=True)
    funnel_sections = ProductFunnelSectionSerializer(many=True, read_only=True)
    reviews = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()
    
    description_html = serializers.SerializerMethodField()
    short_description_html = serializers.SerializerMethodField()
    additional_info_html = serializers.SerializerMethodField()
    image = HybridImageField(required=False, allow_null=True)
    regular_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    sale_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    
    average_rating = serializers.ReadOnlyField()
    rating_count = serializers.ReadOnlyField()
    rating_breakdown = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = '__all__'

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Apply regular_price representation logic
        if instance.stock is not None and instance.stock <= 0:
            data['regular_price'] = "To be announced"
        else:
            data['regular_price'] = str(instance.regular_price) if instance.regular_price is not None else None
            
        # Apply sale_price representation logic
        if instance.stock is not None and instance.stock <= 0:
            data['sale_price'] = "To be announced"
        else:
            from django.utils import timezone
            now = timezone.now()
            
            # Check prefetched items to avoid N+1 queries
            prefetched_items = getattr(instance, 'active_flash_items', None)
            if prefetched_items is not None:
                active_flash_item = prefetched_items[0] if prefetched_items else None
            else:
                active_flash_item = FlashSaleItem.objects.filter(
                    product=instance,
                    flash_sale__is_active=True,
                    flash_sale__end_time__gte=now
                ).select_related('flash_sale').first()
            
            if active_flash_item:
                discount = active_flash_item.discount_percentage or active_flash_item.flash_sale.discount_percentage
                if discount:
                    if instance.regular_price is not None:
                        regular_price = float(instance.regular_price)
                        flash_price = regular_price * (1 - float(discount) / 100)
                        data['sale_price'] = f"{flash_price:.2f}"
                    else:
                        data['sale_price'] = None
            else:
                data['sale_price'] = str(instance.sale_price) if instance.sale_price is not None else None
                
        return data

    def get_thumbnail(self, obj):
        return obj.image.url if obj.image else None

    def get_reviews(self, obj):
        reviews = obj.reviews.filter(is_approved=True)
        return ReviewSerializer(reviews, many=True).data

    def get_description_html(self, obj):
        if not obj.description: return ""
        return obj.description.html if hasattr(obj.description, 'html') else str(obj.description)

    def get_short_description_html(self, obj):
        if not obj.short_description: return ""
        return obj.short_description.html if hasattr(obj.short_description, 'html') else str(obj.short_description)

    def get_additional_info_html(self, obj):
        if not obj.additional_info: return ""
        return obj.additional_info.html if hasattr(obj.additional_info, 'html') else str(obj.additional_info)

    def create(self, validated_data):
        request = self.context.get('request')
        uploaded_images = request.FILES.getlist('uploaded_images')
        uploaded_videos = request.FILES.getlist('uploaded_videos')
        
        # Pop M2M fields to avoid direct assignment error
        categories_data = validated_data.pop('categories', [])
        colors_data = validated_data.pop('colors', [])
        sizes_data = validated_data.pop('sizes', [])
        tags_data = validated_data.pop('tags', [])
        
        product = Product.objects.create(**validated_data)
        
        # Set M2M fields from validated_data
        if categories_data: product.categories.set(categories_data)
        if colors_data: product.colors.set(colors_data)
        if sizes_data: product.sizes.set(sizes_data)
        if tags_data: product.tags.set(tags_data)
        
        def get_list(data, key):
            if hasattr(data, 'getlist'):
                return data.getlist(key)
            val = data.get(key)
            if isinstance(val, list):
                return val
            return [val] if val else []

        if 'brand' in request.data:
            brand_id = request.data.get('brand')
            product.brand_id = brand_id if brand_id else None
            product.save()

        # Handle manual overrides from request.data if provided (existing logic)
        if 'categories' in request.data:
            product.categories.set(get_list(request.data, 'categories'))
            
        if 'colors' in request.data:
            product.colors.set(get_list(request.data, 'colors'))
            
        if 'sizes' in request.data:
            product.sizes.set(get_list(request.data, 'sizes'))
        
        for image in uploaded_images:
            ProductImage.objects.create(product=product, image=image)
            
        for video in uploaded_videos:
            ProductVideo.objects.create(product=product, video=video)
            
        # Handle Funnel Sections
        funnel_sections_json = request.data.get('funnel_sections')
        if funnel_sections_json:
            try:
                sections_data = json.loads(funnel_sections_json)
                for i, section_data in enumerate(sections_data):
                    image = request.FILES.get(f'funnel_section_image_{i}')
                    video = request.FILES.get(f'funnel_section_video_{i}')
                    ProductFunnelSection.objects.create(
                        product=product,
                        title=section_data.get('title'),
                        text=section_data.get('text'),
                        image=image,
                        video=video,
                        video_url=section_data.get('video_url'),
                        order=section_data.get('order', i)
                    )
            except Exception as e:
                print(f"Error saving funnel sections: {e}")

        return product

    def update(self, instance, validated_data):
        request = self.context.get('request')
        uploaded_images = request.FILES.getlist('uploaded_images')
        uploaded_videos = request.FILES.getlist('uploaded_videos')
        
        # Pop M2M fields to avoid direct assignment error
        categories_data = validated_data.pop('categories', None)
        colors_data = validated_data.pop('colors', None)
        sizes_data = validated_data.pop('sizes', None)
        tags_data = validated_data.pop('tags', None)
        
        instance = super().update(instance, validated_data)
        
        # Set M2M fields if they were in validated_data
        if categories_data is not None: instance.categories.set(categories_data)
        if colors_data is not None: instance.colors.set(colors_data)
        if sizes_data is not None: instance.sizes.set(sizes_data)
        if tags_data is not None: instance.tags.set(tags_data)
        
        def get_list(data, key):
            if hasattr(data, 'getlist'):
                return data.getlist(key)
            val = data.get(key)
            if isinstance(val, list):
                return val
            return [val] if val else []

        if 'brand' in request.data:
            brand_id = request.data.get('brand')
            instance.brand_id = brand_id if brand_id else None

        if 'categories' in request.data:
            instance.categories.set(get_list(request.data, 'categories'))
            
        if 'colors' in request.data:
            instance.colors.set(get_list(request.data, 'colors'))
            
        if 'sizes' in request.data:
            instance.sizes.set(get_list(request.data, 'sizes'))
        
        for image in uploaded_images:
            ProductImage.objects.create(product=instance, image=image)
            
        for video in uploaded_videos:
            ProductVideo.objects.create(product=instance, video=video)

        # Handle Funnel Sections
        funnel_sections_json = request.data.get('funnel_sections')
        if funnel_sections_json:
            try:
                sections_data = json.loads(funnel_sections_json)
                keep_ids = []
                for i, section_data in enumerate(sections_data):
                    section_id = section_data.get('id')
                    image = request.FILES.get(f'funnel_section_image_{i}')
                    video = request.FILES.get(f'funnel_section_video_{i}')
                    
                    if section_id:
                        try:
                            section = ProductFunnelSection.objects.get(id=section_id, product=instance)
                            section.title = section_data.get('title')
                            section.text = section_data.get('text')
                            section.video_url = section_data.get('video_url')
                            section.order = section_data.get('order', i)
                            if image:
                                section.image = image
                            if video:
                                section.video = video
                            section.save()
                            keep_ids.append(section.id)
                        except ProductFunnelSection.DoesNotExist:
                            section = ProductFunnelSection.objects.create(
                                product=instance,
                                title=section_data.get('title'),
                                text=section_data.get('text'),
                                image=image,
                                video=video,
                                video_url=section_data.get('video_url'),
                                order=section_data.get('order', i)
                            )
                            keep_ids.append(section.id)
                    else:
                        section = ProductFunnelSection.objects.create(
                            product=instance,
                            title=section_data.get('title'),
                            text=section_data.get('text'),
                            image=image,
                            video=video,
                            video_url=section_data.get('video_url'),
                            order=section_data.get('order', i)
                        )
                        keep_ids.append(section.id)
                
                # Delete sections not in keep_ids
                instance.funnel_sections.exclude(id__in=keep_ids).delete()
            except Exception as e:
                print(f"Error saving funnel sections: {e}")
            
        return super().update(instance, validated_data)

class ProductListSerializer(ProductSerializer):
    reviews = serializers.SerializerMethodField()

    def get_reviews(self, obj):
        return []

class BannerSerializer(serializers.ModelSerializer):
    image = HybridImageField(required=False, allow_null=True)
    video = HybridFileField(required=False, allow_null=True)
    class Meta:
        model = Banner
        fields = '__all__'

class OrderNoteSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = OrderNote
        fields = ['id', 'username', 'note', 'created_at']

class OrderItemSerializer(serializers.ModelSerializer):
    product_details = serializers.SerializerMethodField()
    product_name = serializers.ReadOnlyField(source='product.name')
    product_image = serializers.SerializerMethodField()
    color_name = serializers.ReadOnlyField(source='color.name')
    size_name = serializers.ReadOnlyField(source='size.name')
    color_details = ColorSerializer(source='color', read_only=True)
    size_details = SizeSerializer(source='size', read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id', 'order', 'product', 'product_details', 'product_name', 'product_image', 
            'quantity', 'price', 'color', 'size', 'color_name', 'size_name', 
            'color_details', 'size_details'
        ]

    def get_product_image(self, obj):
        if not obj.product:
            return None
        
        # Use color-specific image if available
        if obj.color:
            color_image = obj.product.images.filter(color=obj.color).first()
            if color_image:
                return color_image.image.url
        
        return obj.product.image.url if obj.product.image else None

    def get_product_details(self, obj):
        if not obj.product:
            return {"name": "Unknown Product", "thumbnail": None}
        
        # Default image
        image_url = self.get_product_image(obj)
        
        return {
            "name": obj.product.name,
            "thumbnail": image_url
        }

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    notes = OrderNoteSerializer(many=True, read_only=True)
    is_duplicate = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = '__all__'

    def get_is_duplicate(self, obj):
        from datetime import timedelta
        from django.db.models import Q
        
        if not obj.phone_number:
            return False
            
        # Look for other orders with same phone number within 72h window
        time_threshold = obj.created_at - timedelta(hours=72)
        
        # Optimization: Only check if there's at least one other order
        other_orders = Order.objects.filter(
            phone_number=obj.phone_number,
            created_at__range=(time_threshold, obj.created_at + timedelta(seconds=1))
        ).exclude(id=obj.id)
        
        if not other_orders.exists():
            return False
            
        # Check if any product in the current order exists in any of the other orders
        current_product_ids = list(obj.items.values_list('product_id', flat=True))
        
        duplicate_exists = OrderItem.objects.filter(
            order__in=other_orders,
            product_id__in=current_product_ids
        ).exists()
        
        return duplicate_exists

    def create(self, validated_data):
        # Extract items data from the request
        request = self.context.get('request')
        items_data = request.data.get('items', [])
        
        # Ensure default payment method is COD if not specified
        if not validated_data.get('payment_method'):
            from .models import PaymentMethod
            cod_method = PaymentMethod.objects.filter(provider='cod').first()
            if cod_method:
                validated_data['payment_method'] = cod_method
                
        # Create the order
        order = Order.objects.create(**validated_data)
        
        # Create each order item
        for item_data in items_data:
            product_id = item_data.pop('product', None)
            color_id = item_data.pop('color', None)
            size_id = item_data.pop('size', None)
            
            if product_id:
                try:
                    product = Product.objects.get(id=product_id)
                    OrderItem.objects.create(
                        order=order, 
                        product=product,
                        color_id=color_id,
                        size_id=size_id,
                        **item_data
                    )
                except Product.DoesNotExist:
                    pass
        
        return order

    def update(self, instance, validated_data):
        # Extract items data if provided
        request = self.context.get('request')
        items_data = request.data.get('items', [])

        # Update order fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update items if provided in request data
        if 'items' in request.data:
            # Delete existing items for this order and recreate them
            instance.items.all().delete()
            for item_data in items_data:
                product_id = item_data.pop('product', None)
                color_id = item_data.pop('color', None)
                size_id = item_data.pop('size', None)
                
                if product_id:
                    try:
                        product = Product.objects.get(id=product_id)
                        OrderItem.objects.create(
                            order=instance,
                            product=product,
                            color_id=color_id,
                            size_id=size_id,
                            **item_data
                        )
                    except Product.DoesNotExist:
                        pass

        return instance

class SiteSettingsSerializer(serializers.ModelSerializer):
    site_logo = HybridImageField(required=False, allow_null=True)
    site_favicon = HybridImageField(required=False, allow_null=True)
    footer_logo = HybridImageField(required=False, allow_null=True)
    messenger_image = HybridImageField(required=False, allow_null=True)

    class Meta:
        model = SiteSettings
        fields = '__all__'

class NoticeSerializer(serializers.ModelSerializer):
    image = HybridImageField(required=False, allow_null=True)
    class Meta:
        model = Notice
        fields = '__all__'

class FlashSaleItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )
    class Meta:
        model = FlashSaleItem
        fields = '__all__'

class FlashSaleSerializer(serializers.ModelSerializer):
    items = FlashSaleItemSerializer(many=True, read_only=True)
    class Meta:
        model = FlashSale
        fields = '__all__'

class ProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.first_name', required=False)
    district = DistrictSerializer(read_only=True)
    upazila = UpazilaSerializer(read_only=True)
    qr_code = serializers.SerializerMethodField()
    secret = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ['id', 'user', 'role', 'phone_number', 'full_name', 'address', 'city', 'zip_code', 'profile_picture', 'is_temp_password', 'district', 'upazila', 'enable_2fa', 'is_2fa_setup', 'qr_code', 'secret']
        read_only_fields = ['user', 'phone_number', 'is_2fa_setup', 'qr_code', 'secret']

    def get_qr_code(self, obj):
        request = self.context.get('request')
        if request and (request.user == obj.user or request.user.is_staff or request.user.is_superuser):
            if obj.enable_2fa and not obj.is_2fa_setup:
                if not obj.two_factor_secret:
                    import pyotp
                    obj.two_factor_secret = pyotp.random_base32()
                    obj.save()
                
                import pyotp
                import qrcode
                import io
                import base64
                
                from .models import SiteSettings
                settings = SiteSettings.objects.first()
                site_title = settings.site_title if settings else "Spaceghor"
                
                totp = pyotp.TOTP(obj.two_factor_secret)
                provisioning_uri = totp.provisioning_uri(
                    name=obj.user.username,
                    issuer_name=site_title
                )
                
                qr = qrcode.QRCode(version=1, box_size=10, border=4)
                qr.add_data(provisioning_uri)
                qr.make(fit=True)
                img = qr.make_image(fill_color="black", back_color="white")
                
                buffered = io.BytesIO()
                img.save(buffered, format="PNG")
                img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
                return f"data:image/png;base64,{img_str}"
        return None

    def get_secret(self, obj):
        request = self.context.get('request')
        if request and (request.user == obj.user or request.user.is_staff or request.user.is_superuser):
            if obj.enable_2fa and not obj.is_2fa_setup:
                return obj.two_factor_secret
        return None

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        full_name = user_data.get('first_name')
        
        if full_name:
            instance.user.first_name = full_name
            instance.user.save()
            
        enable_2fa = validated_data.get('enable_2fa', None)
        if enable_2fa is False:
            instance.two_factor_secret = None
            instance.is_2fa_setup = False
            
        request = self.context.get('request')
        if request and 'otp_code' in request.data:
            otp_code = request.data.get('otp_code')
            if not instance.two_factor_secret:
                raise serializers.ValidationError({"otp_code": "2FA setup is not initialized."})
            
            import pyotp
            totp = pyotp.TOTP(instance.two_factor_secret)
            if totp.verify(otp_code, valid_window=1):
                instance.is_2fa_setup = True
            else:
                raise serializers.ValidationError({"otp_code": "Invalid verification code. Please try again."})

        return super().update(instance, validated_data)

class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', read_only=True)
    phone_number = serializers.CharField(source='profile.phone_number', read_only=True)
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'is_active', 'role', 'phone_number', 'profile']

class RegisterSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(write_only=True)
    full_name = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['phone_number', 'full_name', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['phone_number'],
            first_name=validated_data['full_name'],
            password=validated_data['password']
        )
        # Profile is created via signals or manually here if needed
        # Assuming we need to ensure profile has the phone number
        Profile.objects.update_or_create(user=user, defaults={'phone_number': validated_data['phone_number']})
        return user

class WishlistSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )

    class Meta:
        model = Wishlist
        fields = ['id', 'product', 'product_id', 'created_at']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class BlogCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogCategory
        fields = '__all__'

class BlogPostSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    image = HybridImageField(required=False, allow_null=True)
    class Meta:
        model = BlogPost
        fields = ['id', 'title', 'slug', 'category', 'category_name', 'content', 'image', 'created_at', 'is_published', 'views']

class FunnelReviewImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = FunnelReviewImage
        fields = '__all__'

class FunnelSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)
    product_two_details = ProductSerializer(source='product_two', read_only=True)
    total_sales = serializers.SerializerMethodField()
    successful_delivery_amount = serializers.SerializerMethodField()
    review_images = FunnelReviewImageSerializer(many=True, read_only=True)

    class Meta:
        model = Funnel
        fields = '__all__'

    def to_internal_value(self, data):
        # Handle empty string or 'null' string for product_two in FormData
        if 'product_two' in data and (data['product_two'] == '' or data['product_two'] == 'null'):
            data = data.copy()
            data['product_two'] = None
        return super().to_internal_value(data)

    def get_total_sales(self, obj):
        from django.db.models import Sum
        total = obj.orders.aggregate(total=Sum('total_amount'))['total']
        return total or 0

    def get_successful_delivery_amount(self, obj):
        from django.db.models import Sum
        total = obj.orders.filter(status='delivered').aggregate(total=Sum('total_amount'))['total']
        return total or 0

    def create(self, validated_data):
        request = self.context.get('request')
        funnel = Funnel.objects.create(**validated_data)
        if request:
            uploaded_images = request.FILES.getlist('uploaded_review_images')
            for idx, img in enumerate(uploaded_images):
                FunnelReviewImage.objects.create(funnel=funnel, image=img, order=idx)
        return funnel

    def update(self, instance, validated_data):
        request = self.context.get('request')
        instance = super().update(instance, validated_data)
        if request:
            if hasattr(request.data, 'getlist'):
                keep_ids = request.data.getlist('keep_review_images')
            else:
                keep_ids = request.data.get('keep_review_images', [])
                if not isinstance(keep_ids, list):
                    keep_ids = [keep_ids] if keep_ids is not None else []
            if len(keep_ids) == 1 and isinstance(keep_ids[0], str) and keep_ids[0].startswith('['):
                try:
                    keep_ids = json.loads(keep_ids[0])
                except:
                    pass
            elif not keep_ids and 'keep_review_images' in request.data:
                try:
                    keep_ids = json.loads(request.data.get('keep_review_images'))
                except:
                    pass
            
            clean_keep_ids = []
            if isinstance(keep_ids, list):
                for x in keep_ids:
                    try:
                        clean_keep_ids.append(int(x))
                    except (ValueError, TypeError):
                        pass
            
            instance.review_images.exclude(id__in=clean_keep_ids).delete()
            
            uploaded_images = request.FILES.getlist('uploaded_review_images')
            current_count = instance.review_images.count()
            for idx, img in enumerate(uploaded_images):
                FunnelReviewImage.objects.create(funnel=instance, image=img, order=current_count + idx)
                
        return instance

class OTPSerializer(serializers.ModelSerializer):
    class Meta:
        model = OTP
        fields = ['phone_number', 'code', 'created_at', 'expires_at']
        read_only_fields = ['code', 'created_at', 'expires_at']
