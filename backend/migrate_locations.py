import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from shop.models import District, Upazila

def migrate_to_english():
    # 1. Update Districts
    districts = District.objects.all()
    print(f"Checking {districts.count()} districts...")
    
    for district in districts:
        if ' | ' in district.name:
            new_name = district.name.split(' | ')[-1].strip()
            old_name = district.name
            
            # Check if a district with the new name already exists
            existing = District.objects.filter(name=new_name).exclude(id=district.id).first()
            if existing:
                # Merge all upazilas to the existing English district
                Upazila.objects.filter(district=district).update(district=existing)
                district.delete()
            else:
                district.name = new_name
                district.save()

    # 2. Update Upazilas
    upazilas = Upazila.objects.all()
    print(f"Checking {upazilas.count()} upazilas...")
    
    for upazila in upazilas:
        if ' | ' in upazila.name:
            new_name = upazila.name.split(' | ')[-1].strip()
            
            # Check if an upazila with the same name exists in the same district
            existing = Upazila.objects.filter(district=upazila.district, name=new_name).exclude(id=upazila.id).first()
            if existing:
                # We can delete this duplicate
                upazila.delete()
            else:
                upazila.name = new_name
                upazila.save()

    print("Migration to English-only locations complete.")

if __name__ == '__main__':
    migrate_to_english()
