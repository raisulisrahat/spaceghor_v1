import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from shop.models import Category, Brand, Product, Banner
from django.utils.text import slugify

def get_quill_json(text):
    return json.dumps({
        "delta": {"ops": [{"insert": f"{text}\n"}]},
        "html": f"<p>{text}</p>"
    })

def seed():
    print("Seeding database...")

    # Clear existing data to avoid conflicts
    Product.objects.all().delete()
    Category.objects.all().delete()
    Brand.objects.all().delete()
    Banner.objects.all().delete()

    # Categories
    lifestyle, _ = Category.objects.get_or_create(name="Lifestyle", slug="lifestyle")
    gadgets, _ = Category.objects.get_or_create(name="Gadgets", slug="gadgets")
    wearables, _ = Category.objects.get_or_create(name="Wearables", slug="wearables")

    # Brands
    prime, _ = Brand.objects.get_or_create(name="Qbamart Prime", slug="prime")
    zenith, _ = Brand.objects.get_or_create(name="Zenith", slug="zenith")

    # Products
    products = [
        {
            "name": "Nebula Smart Watch G1",
            "price": 299.99,
            "sale_price": 249.99,
            "desc": "The ultimate wearable for the modern explorer. Featuring advanced health tracking and 5-day battery life.",
            "cat": wearables,
            "brand": prime,
            # For seeding, we'll store the URL as a string in the DB or provide a dummy. 
            # Since the model has an ImageField, we'll bypass the compression by not providing an actual file.
            "img": None 
        },
        {
            "name": "Zenith Noise Cancelling Headphones",
            "price": 349.99,
            "desc": "Immerse yourself in pure sound with active noise cancellation and 40-hour playtime.",
            "cat": gadgets,
            "brand": zenith,
            "img": None
        },
        {
            "name": "Lumina Ambient Desk Lamp",
            "price": 89.99,
            "desc": "Smart lighting for your creative workspace with color temperature control.",
            "cat": lifestyle,
            "brand": prime,
            "img": None
        },
        {
            "name": "Hyperion Gaming Mouse",
            "price": 129.99,
            "sale_price": 99.99,
            "desc": "Zero-latency performance for competitive gaming with 16k DPI sensor.",
            "cat": gadgets,
            "brand": prime,
            "img": None
        }
    ]

    for p in products:
        prod = Product.objects.create(
            name=p['name'],
            slug=slugify(p['name']),
            regular_price=p['price'],
            sale_price=p.get('sale_price'),
            description=get_quill_json(p['desc']),
            short_description=get_quill_json(p['desc']),
            brand=p['brand'],
            stock=100
        )
        prod.categories.add(p['cat'])

    # Banners
    Banner.objects.create(
        title="Elevate Your Lifestyle",
        description="Discover the intersection of technology and art.",
        type="hero",
        is_active=True,
    )

    print("Seeding complete!")

if __name__ == "__main__":
    seed()
