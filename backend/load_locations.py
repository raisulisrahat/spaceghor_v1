import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from shop.models import District, Upazila

def load_data():
    file_path = os.path.join(os.path.dirname(__file__), 'shop/address_data.json')
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    for district_name, upazilas in data.items():
        district, created = District.objects.get_or_create(name=district_name)
        if created:
            print(f"Created District: {district_name}")
        
        for upazila_name in upazilas:
            upazila, u_created = Upazila.objects.get_or_create(district=district, name=upazila_name.strip())
            # if u_created:
            #     print(f"  Created Upazila: {upazila_name}")
    print("Data loading complete.")

if __name__ == '__main__':
    load_data()
