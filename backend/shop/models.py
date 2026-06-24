from django.db import models
from django.contrib.auth.models import User
from django_quill.fields import QuillField
from django.utils.text import slugify
from django.utils import timezone
from datetime import timedelta
import sys
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
from PIL import Image as PilImage
import random
import string


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subcategories')
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    mega_menu_banner = models.ImageField(upload_to='categories/banners/', blank=True, null=True)
    brands = models.ManyToManyField('Brand', blank=True, related_name='categories')
    colors = models.ManyToManyField('Color', blank=True, related_name='categories')
    sizes = models.ManyToManyField('Size', blank=True, related_name='categories')
    tags = models.ManyToManyField('Tag', blank=True, related_name='categories')

    class Meta:
        verbose_name_plural = "Categories"

    def save(self, *args, **kwargs):
        if not self.slug:
            if self.parent:
                self.slug = slugify(f"{self.parent.slug}-{self.name}")
            else:
                self.slug = slugify(self.name)
            
            # Ensure uniqueness
            original_slug = self.slug
            counter = 1
            while Category.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{original_slug}-{counter}"
                counter += 1

        if self.image and not self.image.name.endswith('.webp'):
            compress_image(self.image)
        
        if self.mega_menu_banner and not self.mega_menu_banner.name.endswith('.webp'):
            compress_image(self.mega_menu_banner)

        super().save(*args, **kwargs)

    def __str__(self):
        full_path = [self.name]
        k = self.parent
        while k is not None:
            full_path.append(k.name)
            k = k.parent
        return ' -> '.join(full_path[::-1])


class Brand(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True, null=True)
    logo = models.ImageField(upload_to='brands/', blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Tag(models.Model):
    name = models.CharField(max_length=50)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name

class Color(models.Model):
    name = models.CharField(max_length=50)
    hex_code = models.CharField(max_length=7, help_text="Hex code (e.g. #FFFFFF)")

    def __str__(self):
        return self.name

class Size(models.Model):
    name = models.CharField(max_length=50)
    code = models.CharField(max_length=10, blank=True, null=True, help_text="Short code (e.g. XL, 42)")

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self.name[:10].upper().replace(' ', '')
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Wishlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlist')
    product = models.ForeignKey('Product', on_delete=models.CASCADE, related_name='wishlisted_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.product.name}"

class PaymentMethod(models.Model):
    name = models.CharField(max_length=100)
    provider = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class ShippingZone(models.Model):
    name = models.CharField(max_length=100)
    countries = models.TextField(help_text="Comma-separated list of country codes")
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return self.name


def compress_image(image_field, max_width=1200):
    if not image_field:
        return

    from django.core.files.uploadedfile import UploadedFile
    try:
        if not hasattr(image_field, 'file') or not isinstance(image_field.file, UploadedFile):
            return
    except Exception:
        return

    try:
        if hasattr(image_field, 'seek'):
            image_field.seek(0)
            
        img = PilImage.open(image_field)
        
        # Convert transparent background to white background for PNG/WebP images
        if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
            alpha = img.convert('RGBA').split()[-1]
            bg = PilImage.new("RGBA", img.size, (255, 255, 255, 255))
            bg.paste(img, mask=alpha)
            img = bg.convert('RGB')
        elif img.mode != 'RGB':
            img = img.convert('RGB')

        # Resize if too large
        if img.width > max_width:
            output_size = (max_width, int(img.height * (max_width / img.width)))
            img.thumbnail(output_size)

        output = BytesIO()
        img.save(output, format='WebP', quality=80)
        size = output.tell() # Correct size
        output.seek(0)

        # Change extension
        new_name = image_field.name.rsplit('.', 1)[0] + '.webp'
        
        image_field.file = InMemoryUploadedFile(
            output,
            'ImageField',
            new_name,
            'image/webp',
            size,
            None
        )
        image_field.name = new_name
    except Exception as e:
        print(f"Error compressing image: {e}")
        pass

class Product(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True, null=True)
    sku = models.CharField(max_length=50, unique=True, blank=True, help_text="Auto-generated Stock Keeping Unit")
    description = models.TextField()
    short_description = models.TextField(blank=True, help_text="Enter key features, one per line")
    regular_price = models.DecimalField(max_digits=10, decimal_places=2)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock = models.PositiveIntegerField(default=0)

    categories = models.ManyToManyField(Category, blank=True, related_name='products')
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    tags = models.ManyToManyField(Tag, blank=True, related_name='products')
    
    weight = models.DecimalField(max_digits=6, decimal_places=2, default=0.00, help_text="Weight in kg")
    colors = models.ManyToManyField(Color, blank=True, related_name='products')
    sizes = models.ManyToManyField(Size, blank=True, related_name='products')
    specifications = models.JSONField(default=dict, blank=True, help_text="Custom key-value specifications")
    show_specifications = models.BooleanField(default=True, help_text="Enable/Disable Specifications tab on product page")
    additional_info = models.TextField(blank=True, null=True)
    show_additional_info = models.BooleanField(default=False, help_text="Enable/Disable Additional Information tab on product page")
    
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    video_url = models.CharField(max_length=500, blank=True, null=True, help_text="YouTube or external video embed URL")
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)

        if not self.sku:
            while True:
                new_sku = 'SKU-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
                if not Product.objects.filter(sku=new_sku).exists():
                    self.sku = new_sku
                    break

        if self.image and not self.image.name.endswith('.webp'):
            compress_image(self.image)

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    @property
    def average_rating(self):
        reviews = self.reviews.filter(is_approved=True)
        if not reviews:
            return 0
        return sum(review.rating for review in reviews) / reviews.count()

    @property
    def rating_count(self):
        return self.reviews.filter(is_approved=True).count()

    @property
    def rating_breakdown(self):
        counts = {str(i): 0 for i in range(1, 6)}
        reviews = self.reviews.filter(is_approved=True)
        total = reviews.count()
        if total == 0:
            return counts
        
        for review in reviews:
            counts[str(review.rating)] += 1
            
        return {rating: (count / total) * 100 for rating, count in counts.items()}

class ProductImage(models.Model):
    product = models.ForeignKey(Product, related_name='images', on_delete=models.CASCADE)
    color = models.ForeignKey(Color, on_delete=models.SET_NULL, null=True, blank=True, related_name='product_images')
    image = models.ImageField(upload_to='products/gallery/')
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def save(self, *args, **kwargs):
        if self.image and not self.image.name.endswith('.webp'):
            compress_image(self.image)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Image for {self.product.name}"

class ProductVideo(models.Model):
    product = models.ForeignKey(Product, related_name='videos', on_delete=models.CASCADE)
    video = models.FileField(upload_to='products/videos/', help_text="Upload product video (mp4, webm)")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Video for {self.product.name}"

class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField(blank=True, null=True)
    phone_number = models.CharField(max_length=15, default='')
    address = models.TextField()
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.SET_NULL, null=True, blank=True)
    shipping_zone = models.ForeignKey(ShippingZone, on_delete=models.SET_NULL, null=True, blank=True)
    funnel = models.ForeignKey('Funnel', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    courier_name = models.CharField(max_length=50, blank=True, null=True)
    courier_consignment_id = models.CharField(max_length=100, blank=True, null=True)
    courier_tracking_code = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Payment Tracking
    payment_gateway_id = models.CharField(max_length=255, blank=True, null=True, help_text="Transaction or payment gateway ID")
    is_paid = models.BooleanField(default=False)
    
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)

    ORDER_STATUS = (
        ('draft', 'Draft/Incomplete'),
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )
    status = models.CharField(max_length=20, choices=ORDER_STATUS, default='pending')
    stock_decremented = models.BooleanField(default=False, db_index=True)

    def __str__(self):
        return f"Order #{str(self.id).zfill(8)} - {self.customer_name}"

    class Meta:
        ordering = ['-created_at']

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    color = models.ForeignKey(Color, on_delete=models.SET_NULL, null=True, blank=True)
    size = models.ForeignKey(Size, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"

class OrderNote(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='notes')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    note = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Note on Order #{self.order.id} by {self.user.username if self.user else 'System'}"


class Banner(models.Model):
    BANNER_TYPES = (
        ('hero', 'Hero Slider'),
        ('secondary', 'Secondary Banner'),
        ('promo', 'Promotional Banner'),
        ('footer', 'Footer Banner'),
        ('side_top', 'Side Column - Top'),
        ('side_bot_left', 'Side Column - Bottom Left'),
        ('side_bot_right', 'Side Column - Bottom Right'),
    )

    title = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True, help_text="Text to display on the banner")
    image = models.ImageField(upload_to='banners/', blank=True, null=True)
    video = models.FileField(upload_to='banners/videos/', blank=True, null=True, help_text="Upload video for hero banner (mp4, webm)")
    link = models.CharField(max_length=500, blank=True, help_text="URL to redirect to")
    type = models.CharField(max_length=20, choices=BANNER_TYPES, default='hero')
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.image and not self.image.name.endswith('.webp'):
            compress_image(self.image)
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return f"{self.get_type_display()} - {self.title or 'Untitled'}"

class District(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="District")

    class Meta:
        verbose_name = "District"
        verbose_name_plural = "Districts"
        ordering = ['name']

    def __str__(self):
        return self.name


class Upazila(models.Model):
    district = models.ForeignKey(
        District,
        on_delete=models.CASCADE,
        related_name='upazilas',
        verbose_name="District"
    )
    name = models.CharField(max_length=100, verbose_name="Upazila")

    class Meta:
        verbose_name = "Upazila"
        verbose_name_plural = "Upazilas"
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.district.name})"

class Profile(models.Model):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('moderator', 'Moderator'),
        ('customer', 'Customer'),
        ('ads_manager', 'Ads Manager'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    district = models.ForeignKey(District, on_delete=models.SET_NULL, null=True, blank=True)
    upazila = models.ForeignKey(Upazila, on_delete=models.SET_NULL, null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    zip_code = models.CharField(max_length=20, blank=True, null=True)
    is_temp_password = models.BooleanField(default=False)
    enable_2fa = models.BooleanField(default=True)
    two_factor_secret = models.CharField(max_length=32, blank=True, null=True)
    is_2fa_setup = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username}'s Profile"



class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    headline = models.CharField(max_length=255, blank=True, help_text="Short summary of the review")
    rating = models.PositiveIntegerField(default=5)
    comment = models.TextField(blank=True)
    is_verified = models.BooleanField(default=True, help_text="Check if this user actually purchased the product")
    is_approved = models.BooleanField(default=True, help_text="Approve this review to show on product page")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.product.name} ({self.rating})"

class ReviewImage(models.Model):
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='reviews/')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.image and not self.image.name.endswith('.webp'):
            compress_image(self.image)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Image for review by {self.review.user.username}"

class Notice(models.Model):
    DISPLAY_CHOICES = (
        ('ticker', 'Marquee Ticker Only'),
        ('popup', 'Pop-up Ad Only'),
        ('both', 'Both Ticker & Pop-up'),
    )
    
    text = models.CharField(max_length=500, help_text="Text to display in the marquee or short summary")
    title = models.CharField(max_length=200, blank=True, null=True, help_text="Title for the pop-up")
    description = models.TextField(blank=True, null=True, help_text="Long description for the pop-up")
    image = models.ImageField(upload_to='notices/', blank=True, null=True, help_text="Image for the pop-up ad")
    button_text = models.CharField(max_length=50, blank=True, null=True, default="View Offer")
    button_link = models.CharField(max_length=500, blank=True, null=True, help_text="URL for the pop-up button")
    display_type = models.CharField(max_length=20, choices=DISPLAY_CHOICES, default='ticker')
    
    is_active = models.BooleanField(default=True, help_text="Show this notice on the site")
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.image and not self.image.name.endswith('.webp'):
            compress_image(self.image)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title if self.title else self.text[:50]

class FlashSale(models.Model):
    title = models.CharField(max_length=200, default="Flash Sale")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Global discount percentage for this flash sale")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.start_time} - {self.end_time})"

class FlashSaleItem(models.Model):
    flash_sale = models.ForeignKey(FlashSale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Override auto-calculation")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.product.name} in {self.flash_sale.title}"

class BlogCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Blog Categories"

    def __str__(self):
        return self.name

class BlogPost(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    category = models.ForeignKey(BlogCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='posts')
    content = models.TextField()
    image = models.ImageField(upload_to='blog_images/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_published = models.BooleanField(default=True)
    views = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

class SiteSettings(models.Model):
    site_title = models.CharField(max_length=200, default="Spaceghor")
    site_logo = models.ImageField(upload_to='site/', blank=True, null=True)
    site_favicon = models.ImageField(upload_to='site/', blank=True, null=True, help_text="Browser tab icon (e.g., .ico or .png)")
    footer_logo = models.ImageField(upload_to='site/', blank=True, null=True)
    
    # Steadfast Courier Integration
    steadfast_base_url = models.URLField(max_length=500, default='https://portal.packzy.com/api/v1', help_text="Courier API Base URL")
    steadfast_api_key = models.CharField(max_length=255, blank=True, null=True, help_text="Api-Key for steadfast")
    steadfast_secret_key = models.CharField(max_length=255, blank=True, null=True, help_text="Secret-Key for steadfast")

    # Carrybee Courier Integration
    carrybee_base_url = models.URLField(max_length=500, default='https://developers.carrybee.com', help_text="Carrybee API Base URL")
    carrybee_client_id = models.CharField(max_length=255, blank=True, null=True, help_text="Client ID for Carrybee")
    carrybee_client_secret = models.CharField(max_length=255, blank=True, null=True, help_text="Client Secret for Carrybee")
    carrybee_client_context = models.CharField(max_length=255, blank=True, null=True, help_text="Client Context for Carrybee")

    webhook_auth_token = models.CharField(max_length=255, blank=True, null=True, help_text="Token for authenticating incoming webhooks")
    
    meta_description = models.TextField(blank=True, help_text="SEO Meta Description")
    meta_keywords = models.CharField(max_length=255, blank=True, help_text="Comma separated SEO keywords")
    facebook_pixel_id = models.CharField(max_length=50, blank=True, null=True, help_text="Facebook Pixel ID")
    google_tag_id = models.CharField(max_length=50, blank=True, null=True, help_text="Google Tag ID (gtag.js) e.g. G-XXXXXX")
    google_tag_manager_id = models.CharField(max_length=50, blank=True, null=True, help_text="Google Tag Manager ID (GTM) e.g. GTM-XXXXXXX")
    facebook_capi_token = models.TextField(blank=True, null=True, help_text="Facebook Conversion API Access Token")
    facebook_ad_account_id = models.CharField(max_length=100, blank=True, null=True, help_text="Facebook Ad Account ID")
    facebook_test_code = models.CharField(max_length=100, blank=True, null=True, help_text="Facebook Test Event Code")
    facebook_api_version = models.CharField(max_length=20, default='v19.0', help_text="Facebook Graph API Version")
    
    # Social Links
    facebook_url = models.URLField(max_length=500, blank=True, null=True, help_text="Facebook Page URL")
    twitter_url = models.URLField(max_length=500, blank=True, null=True, help_text="Twitter Profile URL")
    instagram_url = models.URLField(max_length=500, blank=True, null=True, help_text="Instagram Profile URL")
    youtube_url = models.URLField(max_length=500, blank=True, null=True, help_text="YouTube Channel URL")
    discord_url = models.URLField(max_length=500, blank=True, null=True, help_text="Discord Server URL")
    linkedin_url = models.URLField(max_length=500, blank=True, null=True, help_text="LinkedIn Page URL")
    messenger_url = models.URLField(max_length=500, blank=True, null=True, help_text="Facebook Messenger URL (e.g., https://m.me/yourpage)")
    messenger_image = models.ImageField(upload_to='site/', blank=True, null=True, help_text="Avatar image for the chat bubble")
    whatsapp_number = models.CharField(max_length=20, blank=True, null=True, help_text="WhatsApp Number (with country code, e.g., +88017...)")
    support_phone = models.CharField(max_length=20, blank=True, null=True, help_text="Support Phone Number for quick calls")
    whatsapp_message = models.TextField(blank=True, null=True, help_text="Default message for WhatsApp chat")
    show_chat_bubble = models.BooleanField(default=True, help_text="Show floating chat bubble on the site")
    session_timeout_minutes = models.PositiveIntegerField(default=60, help_text="User session timeout in minutes")
    enable_district_upazila = models.BooleanField(default=True, help_text="Enable District and Upazila fields in checkout")

    # SMS Configuration (BulkSMSBD)
    sms_api_key = models.CharField(max_length=255, blank=True, null=True, help_text="API Key for BulkSMSBD")
    sms_sender_id = models.CharField(max_length=50, blank=True, null=True, help_text="Approved Sender ID")
    otp_format = models.CharField(max_length=255, default="{site_title}-এর জন্য আপনার ওটিপি (OTP) হলো {otp}", help_text="Format for OTP SMS. Use {site_title} and {otp} placeholders.")
    enable_order_confirmation_sms = models.BooleanField(default=False, help_text="Send SMS to customer when order is placed")

    # bKash Integration
    bkash_base_url = models.URLField(max_length=500, blank=True, null=True, help_text="bKash API URL")
    bkash_app_key = models.CharField(max_length=255, blank=True, null=True, help_text="bKash App Key")
    bkash_app_secret = models.CharField(max_length=255, blank=True, null=True, help_text="bKash App Secret")
    bkash_username = models.CharField(max_length=255, blank=True, null=True, help_text="bKash Username")
    bkash_password = models.CharField(max_length=255, blank=True, null=True, help_text="bKash Password")

    def __str__(self):
        return self.site_title

    class Meta:
        verbose_name_plural = "Site Settings"

class Funnel(models.Model):
    LAYOUT_CHOICES = [
        ('classic', 'Classic Layout'),
        ('modern', 'Modern Layout'),
        ('combo', 'Combo Layout'),
        ('bangla', 'Bangla Funnel Layout'),
        ('ezymart', 'EzyMart Layout'),
        ('ezymart_v2', 'EzyMart V2 Layout'),
        ('dark', 'Dark High-Contrast Layout'),
        ('professional', 'Professional Two-Column Layout'),
        ('garden', 'Garden Green Layout'),
        ('premium', 'Premium Orange Layout'),
    ]
    title = models.CharField(max_length=255, default="Special Offer", help_text="Page title")
    slug = models.SlugField(unique=True, help_text="URL path, e.g., 'summer-sale'")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='funnels')
    product_two = models.ForeignKey(Product, on_delete=models.SET_NULL, related_name='funnels_secondary', blank=True, null=True, help_text="Optional secondary product for combo layout bundles")
    layout_type = models.CharField(
        max_length=20,
        choices=LAYOUT_CHOICES,
        default='classic',
        help_text="Select the visual template for this funnel"
    )
    is_active = models.BooleanField(default=True)
    pixel_id = models.CharField(max_length=50, blank=True, null=True, help_text="Override default Pixel ID")
    custom_template = models.FileField(upload_to='funnel_templates/', blank=True, null=True, help_text="Upload a custom .html template")
    use_custom_layout = models.BooleanField(default=False, help_text="Toggle to use the uploaded custom template instead of pre-set layouts")
    top_header_line_1 = models.CharField(max_length=255, blank=True, null=True, help_text="First top header text, e.g. limited offer banner")
    top_header_line_2 = models.CharField(max_length=255, blank=True, null=True, help_text="Second top header text, e.g. Why buy from us")
    top_header_line_3 = models.CharField(max_length=255, blank=True, null=True, help_text="Third top header text, e.g. extra promo info")
    top_header_line_4 = models.CharField(max_length=255, blank=True, null=True, help_text="Fourth top header text, e.g. brand tagline logo text")
    features_list = models.TextField(blank=True, null=True, help_text="Key features / why buy checkmarks, one per line")
    use_custom_reviews = models.BooleanField(default=False, help_text="Enable custom customer reviews screenshots for this layout")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.slug} -> {self.product.name}"

class UserActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')
    action = models.CharField(max_length=50)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    device_info = models.TextField(blank=True, help_text="User Agent or Device Name")
    location = models.CharField(max_length=255, blank=True, null=True, help_text="Resolved Location from IP")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.action} - {self.created_at}"

class Notification(models.Model):
    TYPES = [
        ('info', 'Info'),
        ('success', 'Success'),
        ('warning', 'Warning'),
        ('error', 'Error'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=10, choices=TYPES, default='info')
    link = models.CharField(max_length=255, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.user.username if self.user else 'System'}"

# Signal Handlers for Notifications
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
import os

@receiver(pre_save, sender=Profile)
def delete_old_profile_picture(sender, instance, **kwargs):
    """Auto-delete old profile picture from disk when a new one is uploaded."""
    if not instance.pk:
        return  # New profile, nothing to delete
    try:
        old_profile = Profile.objects.get(pk=instance.pk)
    except Profile.DoesNotExist:
        return
    old_picture = old_profile.profile_picture
    new_picture = instance.profile_picture
    # If the picture has changed and an old one exists, delete the old file
    if old_picture and old_picture != new_picture:
        if os.path.isfile(old_picture.path):
            try:
                os.remove(old_picture.path)
            except Exception:
                pass

@receiver(post_save, sender=Order)
def order_notification(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            title="New Order Received",
            message=f"Order #{str(instance.id).zfill(8)} placed by {instance.customer_name}.",
            type='success',
            link='/staff/admin/orders'
        )

@receiver(post_save, sender=Order)
def decrement_stock_on_delivery(sender, instance, **kwargs):
    if instance.status == 'delivered' and not instance.stock_decremented:
        from django.db import transaction
        with transaction.atomic():
            order = Order.objects.select_for_update().get(pk=instance.pk)
            if not order.stock_decremented:
                for item in order.items.all():
                    product = item.product
                    if product:
                        product.stock = max(0, product.stock - item.quantity)
                        product.save()
                Order.objects.filter(pk=order.pk).update(stock_decremented=True)

@receiver(post_save, sender=User)
def user_notification(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            title="New User Registered",
            message=f"A new user '{instance.username}' has joined the platform.",
            type='info',
            link='/staff/admin/users'
        )

@receiver(post_save, sender=Product)
def low_stock_notification(sender, instance, **kwargs):
    if instance.stock < 5:
        time_threshold = timezone.now() - timedelta(hours=24)
        if not Notification.objects.filter(
            title="Low Stock Alert", 
            message__icontains=instance.name,
            created_at__gte=time_threshold
        ).exists():
            Notification.objects.create(
                title="Low Stock Alert",
                message=f"Product '{instance.name}' is low on stock ({instance.stock} left).",
                type='warning',
                link=f'/staff/admin/products/{instance.id}'
            )

class OTP(models.Model):
    phone_number = models.CharField(max_length=15)
    code = models.CharField(max_length=10)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"OTP for {self.phone_number}: {self.code}"

    class Meta:
        verbose_name = "OTP"
        verbose_name_plural = "OTPs"
        ordering = ['-created_at']


class ProductFunnelSection(models.Model):
    product = models.ForeignKey(Product, related_name='funnel_sections', on_delete=models.CASCADE)
    title = models.CharField(max_length=255, blank=True, null=True)
    text = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='products/funnel_sections/', blank=True, null=True)
    video = models.FileField(upload_to='products/funnel_sections/videos/', blank=True, null=True, help_text="Direct video upload (mp4, webm)")
    video_url = models.CharField(max_length=500, blank=True, null=True, help_text="External video URL (YouTube, Vimeo)")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Section for {self.product.name}: {self.title or 'Untitled'}"

    def save(self, *args, **kwargs):
        if self.image and not self.image.name.endswith('.webp'):
            compress_image(self.image)
        super().save(*args, **kwargs)


class FunnelReviewImage(models.Model):
    funnel = models.ForeignKey(Funnel, related_name='review_images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='funnel_reviews/')
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def save(self, *args, **kwargs):
        if self.image and not self.image.name.endswith('.webp'):
            compress_image(self.image)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Review image for funnel {self.funnel.slug}"
