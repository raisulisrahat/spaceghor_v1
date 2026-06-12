import json
import os

def clean_address_data():
    file_path = os.path.join(os.path.dirname(__file__), 'shop/address_data.json')
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    new_data = {}
    for key, value in data.items():
        # Clean Key (District)
        new_key = key.split(' | ')[-1].strip() if ' | ' in key else key.strip()
        
        # Clean Values (Upazilas)
        new_values = []
        for val in value:
            new_val = val.split(' | ')[-1].strip() if ' | ' in val else val.strip()
            new_values.append(new_val)
        
        new_data[new_key] = new_values

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(new_data, f, ensure_ascii=False, indent=2)
    
    print("Cleaned address_data.json successfully.")

if __name__ == '__main__':
    clean_address_data()
