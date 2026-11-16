import os
import shutil
from PIL import Image

IMAGES_DIR = "d:/Ncc proj/images"

STAGES = {
    "raw": "Stage_1_Raw",
    "mature": "Stage_2_Mature_Green",
    "ripening": "Stage_3_Ripening",
    "ripe": "Stage_4_Fresh_Ripe",
    "overripe": "Stage_5_Overripe",
    "rotten": "Stage_6_Rotten",
    "decomposed": "Stage_7_Decomposed"
}

# Create output directories inside images/ if they don't exist
for stage_name in STAGES.values():
    os.makedirs(os.path.join(IMAGES_DIR, stage_name), exist_ok=True)

# List all files in the images directory
all_files = os.listdir(IMAGES_DIR)
image_files = [f for f in all_files if f.lower().endswith(('.jpeg', '.jpg', '.png'))]

print(f"Found {len(image_files)} WhatsApp images to organize...")

success_count = 0

for idx, filename in enumerate(image_files):
    filepath = os.path.join(IMAGES_DIR, filename)
    try:
        # Load and resize to 64x64 to match app.js canvas analysis
        img = Image.open(filepath).convert("RGB")
        img_resized = img.resize((64, 64))
        
        green_count = 0
        yellow_count = 0
        red_count = 0
        purple_count = 0
        
        raw_count = 0
        mature_count = 0
        ripening_count = 0
        ripe_count = 0
        overripe_count = 0
        rotten_count = 0
        decomposed_count = 0
        fruit_pixels = 0
        
        # Process every pixel
        for x in range(64):
            for y in range(64):
                r, g, b = img_resized.getpixel((x, y))
                
                # ⚠️ Background Filtering (Ignore neutral tables & light shadows)
                is_neutral = (abs(r - g) < 20 and abs(g - b) < 20 and abs(r - b) < 20)
                if is_neutral and (r > 90 or r < 40):
                    continue
                    
                fruit_pixels += 1
                
                # Check general color flags
                if g > r + 15 and g > b:
                    green_count += 1
                if r > 130 and g > 130 and b < 125:
                    yellow_count += 1
                if r > 120 and g < 80 and b < 80:
                    red_count += 1
                if r > 60 and b > 70 and g < r - 15 and g < b - 15:
                    purple_count += 1
                    
                # 7-stage classifications
                if r < 65 and g < 65 and b < 65 and not (g > r + 8 and g > b):
                    decomposed_count += 1
                elif r > 50 and r < 155 and g > 30 and g < 115 and b < 80 and r > g and g > b:
                    rotten_count += 1
                elif r > 150 and g > 85 and g < 155 and b < 90:
                    overripe_count += 1
                elif r > 125 and g < 90 and b < 90:
                    ripe_count += 1 # Red ripe
                elif r > 170 and g > 140 and b < 110 and r > g + 10:
                    ripe_count += 1 # Golden Yellow/Orange ripe
                elif r > 115 and g > 135 and b < 125 and r > g - 25:
                    ripening_count += 1
                elif g > r + 10 and g > b and g >= 110:
                    mature_count += 1
                elif g > r + 10 and g > b and g < 110:
                    raw_count += 1
                    
        if fruit_pixels < 50:
            fruit_pixels = 64 * 64
            
        # Determine the best matching fruit class by score & mismatch checks
        fruits_to_test = ["brinjal", "banana", "mango", "tomato", "apple", "grape", "orange"]
        best_fruit = "vegetable"
        max_score = -1
        
        for fruit in fruits_to_test:
            # check mismatch rules
            mismatch = False
            if fruit == "banana" and red_count > fruit_pixels * 0.15 and yellow_count < fruit_pixels * 0.05 and green_count < fruit_pixels * 0.05:
                mismatch = True
            elif (fruit == "apple" or fruit == "tomato") and yellow_count > fruit_pixels * 0.20 and red_count < fruit_pixels * 0.03 and green_count < fruit_pixels * 0.03:
                mismatch = True
            elif fruit == "brinjal" and purple_count < fruit_pixels * 0.05 and (green_count > fruit_pixels * 0.15 or yellow_count > fruit_pixels * 0.15):
                mismatch = True
            elif fruit != "brinjal" and purple_count > fruit_pixels * 0.18:
                mismatch = True
                
            if not mismatch:
                score = 0
                if fruit == "brinjal":
                    score = purple_count
                elif fruit in ["banana", "mango"]:
                    score = yellow_count + green_count
                elif fruit in ["tomato", "apple"]:
                    score = red_count
                elif fruit == "orange":
                    score = yellow_count
                elif fruit == "grape":
                    score = green_count
                
                if score > max_score:
                    max_score = score
                    best_fruit = fruit
                    
        # Apply the final classification rules (equivalent to JS)
        stage = "ripe" # Default fallback
        if best_fruit == "banana":
            if decomposed_count > fruit_pixels * 0.15: stage = "decomposed"
            elif rotten_count > fruit_pixels * 0.15: stage = "rotten"
            elif overripe_count > fruit_pixels * 0.12: stage = "overripe"
            elif raw_count > fruit_pixels * 0.06 and raw_count >= mature_count and raw_count > ripe_count: stage = "raw"
            elif mature_count > fruit_pixels * 0.06 and mature_count > ripe_count: stage = "mature"
            elif ripening_count > fruit_pixels * 0.10: stage = "ripening"
            elif ripe_count > fruit_pixels * 0.10: stage = "ripe"
        elif best_fruit == "mango":
            if decomposed_count > fruit_pixels * 0.15: stage = "decomposed"
            elif rotten_count > fruit_pixels * 0.15: stage = "rotten"
            elif overripe_count > fruit_pixels * 0.12: stage = "overripe"
            elif ripe_count > fruit_pixels * 0.12: stage = "ripe"
            elif ripening_count > fruit_pixels * 0.08: stage = "ripening"
            elif raw_count > fruit_pixels * 0.06 and raw_count >= mature_count: stage = "raw"
            elif mature_count > fruit_pixels * 0.06: stage = "mature"
        elif best_fruit in ["tomato", "apple"]:
            if decomposed_count > fruit_pixels * 0.15: stage = "decomposed"
            elif rotten_count > fruit_pixels * 0.15: stage = "rotten"
            elif overripe_count > fruit_pixels * 0.12: stage = "overripe"
            elif ripe_count > fruit_pixels * 0.12: stage = "ripe"
            elif ripening_count > fruit_pixels * 0.08 or (mature_count > fruit_pixels * 0.06 and ripe_count > fruit_pixels * 0.06): stage = "ripening"
            elif raw_count > fruit_pixels * 0.06 and raw_count >= mature_count: stage = "raw"
            elif mature_count > fruit_pixels * 0.06: stage = "mature"
        elif best_fruit == "grape":
            if decomposed_count > fruit_pixels * 0.12: stage = "decomposed"
            elif rotten_count > fruit_pixels * 0.12: stage = "rotten"
            elif ripening_count > fruit_pixels * 0.10: stage = "ripening"
            elif mature_count > fruit_pixels * 0.10: stage = "mature"
        elif best_fruit == "orange":
            if decomposed_count > fruit_pixels * 0.12: stage = "decomposed"
            elif rotten_count > fruit_pixels * 0.12: stage = "rotten"
            elif overripe_count > fruit_pixels * 0.10: stage = "overripe"
            elif ripe_count > fruit_pixels * 0.10: stage = "ripe"
        elif best_fruit == "brinjal":
            if decomposed_count > fruit_pixels * 0.12: stage = "decomposed"
            elif rotten_count > fruit_pixels * 0.12: stage = "rotten"
            elif overripe_count > fruit_pixels * 0.10: stage = "overripe"
            elif raw_count > fruit_pixels * 0.12: stage = "raw"
            elif mature_count > fruit_pixels * 0.12: stage = "mature"
        else:
            if decomposed_count > fruit_pixels * 0.12: stage = "decomposed"
            elif rotten_count > fruit_pixels * 0.12: stage = "rotten"
            elif raw_count > fruit_pixels * 0.12: stage = "raw"
            elif mature_count > fruit_pixels * 0.12: stage = "mature"
            
        stage_folder = STAGES[stage]
        dest_dir = os.path.join(IMAGES_DIR, stage_folder)
        
        # Find unique index name inside target folder
        stage_files = os.listdir(dest_dir)
        stage_idx = len([f for f in stage_files if f.startswith(f"{stage}_{best_fruit}")]) + 1
        
        # New clean name
        new_filename = f"{stage}_{best_fruit}_{stage_idx}.jpeg"
        dest_path = os.path.join(dest_dir, new_filename)
        
        # Move the file
        shutil.move(filepath, dest_path)
        success_count += 1
        print(f"[{success_count}] Organised: '{filename}' ➔ '{stage_folder}/{new_filename}'")
        
    except Exception as e:
        print(f"Error sorting {filename}: {e}")

print(f"\nCompleted! Successfully organized {success_count} images.")
