from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline, StackedInline
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    Category, Brand, Tag, Color, Size, Wishlist, PaymentMethod, ShippingZone,
    Product, ProductImage, ProductFunnelSection, Order, OrderItem, OrderNote, Banner, District,
    Upazila, Profile, Review, ReviewImage, Notice, FlashSale, FlashSaleItem,
    BlogCategory, BlogPost, SiteSettings, Funnel, UserActivityLog, Notification
)
from django.contrib.auth.models import User

# Inlines
class ProductImageInline(TabularInline):
    model = ProductImage
    extra = 1

class ProductFunnelSectionInline(TabularInline):
    model = ProductFunnelSection
    extra = 1

class OrderItemInline(TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'quantity', 'price', 'color', 'size')

class OrderNoteInline(TabularInline):
    model = OrderNote
    extra = 1

class FlashSaleItemInline(TabularInline):
    model = FlashSaleItem
    extra = 1

class ProfileInline(StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'Profile'
    fk_name = 'user'

# Admin Classes
@admin.register(Category)
class CategoryAdmin(ModelAdmin):
    list_display = ('name', 'slug', 'parent', 'get_brands')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)

    def get_brands(self, obj):
        return ", ".join([b.name for b in obj.brands.all()])
    get_brands.short_description = 'Associated Brands'

@admin.register(Product)
class ProductAdmin(ModelAdmin):
    list_display = ('name', 'regular_price', 'sale_price', 'stock', 'is_active', 'show_additional_info', 'updated_at')
    list_filter = ('is_active', 'show_additional_info', 'brand', 'categories')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductImageInline, ProductFunnelSectionInline]

@admin.register(Order)
class OrderAdmin(ModelAdmin):
    list_display = ('id', 'customer_name', 'phone_number', 'status', 'total_amount', 'created_at')
    list_filter = ('status', 'payment_method', 'created_at')
    search_fields = ('customer_name', 'phone_number', 'courier_tracking_code')
    inlines = [OrderItemInline, OrderNoteInline]

@admin.register(Brand)
class BrandAdmin(ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(FlashSale)
class FlashSaleAdmin(ModelAdmin):
    list_display = ('title', 'start_time', 'end_time', 'is_active')
    inlines = [FlashSaleItemInline]

@admin.register(BlogPost)
class BlogPostAdmin(ModelAdmin):
    list_display = ('title', 'category', 'created_at', 'is_published')
    list_filter = ('category', 'is_published')
    prepopulated_fields = {'slug': ('title',)}

@admin.register(SiteSettings)
class SiteSettingsAdmin(ModelAdmin):
    def has_add_permission(self, request):
        return not SiteSettings.objects.exists()

class CustomUserAdmin(BaseUserAdmin, ModelAdmin):
    inlines = (ProfileInline, )
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'get_role')
    list_select_related = ('profile', )

    def get_role(self, instance):
        try:
            return instance.profile.role
        except Profile.DoesNotExist:
            return 'customer'
    get_role.short_description = 'Role'

admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

# Basic Registration for other models using unfold ModelAdmin
admin.site.register(Tag, ModelAdmin)
admin.site.register(Color, ModelAdmin)
admin.site.register(Size, ModelAdmin)
admin.site.register(Wishlist, ModelAdmin)
admin.site.register(PaymentMethod, ModelAdmin)
admin.site.register(ShippingZone, ModelAdmin)
admin.site.register(District, ModelAdmin)
admin.site.register(Upazila, ModelAdmin)

@admin.register(Profile)
class ProfileAdmin(ModelAdmin):
    list_display = ('user', 'role', 'phone_number', 'city')
    list_filter = ('role', 'city')
    search_fields = ('user__username', 'phone_number')

class ReviewImageInline(TabularInline):
    model = ReviewImage
    extra = 1

@admin.register(Review)
class ReviewAdmin(ModelAdmin):
    list_display = ('product', 'user', 'rating', 'headline', 'is_verified', 'is_approved', 'created_at')
    list_filter = ('rating', 'is_verified', 'is_approved', 'created_at')
    search_fields = ('product__name', 'user__username', 'comment', 'headline')
    inlines = [ReviewImageInline]
    actions = ['approve_reviews']

    def approve_reviews(self, request, queryset):
        queryset.update(is_approved=True)
    approve_reviews.short_description = "Approve selected reviews"

admin.site.register(Notice, ModelAdmin)
admin.site.register(Banner, ModelAdmin)
admin.site.register(BlogCategory, ModelAdmin)
admin.site.register(Funnel, ModelAdmin)
admin.site.register(UserActivityLog, ModelAdmin)
admin.site.register(Notification, ModelAdmin)
