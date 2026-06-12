import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from shop.models import District, Upazila

def deduplicate_locations():
    all_districts = list(District.objects.all())
    
    deleted_districts = 0
    updated_upazilas = 0
    deleted_upazilas = 0

    # 1. Deduplicate Districts
    bilingual_districts = {d.name.split(' | ')[0]: d for d in all_districts if ' | ' in d.name}
    
    for old_district in all_districts:
        if ' | ' not in old_district.name:
            if old_district.name in bilingual_districts:
                new_district = bilingual_districts[old_district.name]
                
                upazilas_to_move = Upazila.objects.filter(district=old_district)
                for u in upazilas_to_move:
                    existing_u = Upazila.objects.filter(district=new_district, name=u.name).first()
                    if not existing_u:
                        u.district = new_district
                        u.save()
                        updated_upazilas += 1
                    else:
                        u.delete() 
                
                print(f"Deleting duplicate old District: {old_district.name}")
                old_district.delete()
                deleted_districts += 1
                
    # 2. Deduplicate Upazilas
    # We now look at all remaining upazilas. If there is a bilingual upazila and a Bengali-only one in the SAME district, delete the Bengali-only one.
    all_upazilas = list(Upazila.objects.all())
    
    for district in District.objects.all():
        dist_upazilas = [u for u in all_upazilas if u.district_id == district.id]
        
        # Find bilingual upazilas in this district
        bilingual_upazilas = {u.name.split(' | ')[0]: u for u in dist_upazilas if ' | ' in u.name}
        
        for old_upazila in dist_upazilas:
            if ' | ' not in old_upazila.name:
                # If there's a bilingual version of this old upazila
                if old_upazila.name in bilingual_upazilas:
                    print(f"Deleting duplicate old Upazila: {old_upazila.name} in {district.name}")
                    old_upazila.delete()
                    deleted_upazilas += 1

    print(f"Done! Deleted {deleted_districts} old districts. Moved {updated_upazilas} upazilas. Deleted {deleted_upazilas} duplicate old upazilas.")

if __name__ == '__main__':
    deduplicate_locations()
