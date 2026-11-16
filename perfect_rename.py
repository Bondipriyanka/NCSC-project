import os
import shutil

IMAGES_DIR = "d:/Ncc proj/images"
STAGE_FOLDERS = [
    "Stage_1_Raw",
    "Stage_2_Mature_Green"
]

# Exact byte size map matching the images in the screenshot
# maps file size in bytes -> (target_fruit, target_stage_folder_name)
SIZE_MAP = {
    # --- STAGE 1: RAW ---
    87098: ("banana", "Stage_1_Raw"),       # raw banana bunch (reverted_vegetable)
    30152: ("ladyfinger", "Stage_1_Raw"),   # raw ladyfinger
    11640: ("ladyfinger", "Stage_1_Raw"),   # raw ladyfinger
    46621: ("ladyfinger", "Stage_1_Raw"),   # raw ladyfinger
    13606: ("ladyfinger", "Stage_1_Raw"),   # raw ladyfinger
    13531: ("ladyfinger", "Stage_1_Raw"),   # raw ladyfinger
    29497: ("pineapple", "Stage_1_Raw"),    # raw pineapple

    # --- STAGE 2: MATURE GREEN ---
    8416: ("radish", "Stage_2_Mature_Green"),       # mature radish 1
    26305: ("radish", "Stage_2_Mature_Green"),      # mature radish 2 and ladyfinger_1 (both 26305 are radishes)
    32226: ("radish", "Stage_2_Mature_Green"),      # mature radish bundle
    28836: ("cabbage", "Stage_2_Mature_Green"),     # mature cabbage
    59812: ("pineapple", "Stage_2_Mature_Green"),   # mature pineapple
    32329: ("guava", "Stage_2_Mature_Green"),       # mature guava 1
    58662: ("guava", "Stage_2_Mature_Green"),       # mature guava 2
    68504: ("vegetable", "Stage_2_Mature_Green"),   # mature roots (ginger/sweet potatoes)
    
    # Ladyfingers in Stage 2 Mature
    10775: ("ladyfinger", "Stage_2_Mature_Green"),  # mature ladyfinger
    7434: ("ladyfinger", "Stage_2_Mature_Green"),   # mature ladyfinger
    20719: ("ladyfinger", "Stage_2_Mature_Green"),  # mature ladyfinger
    15459: ("ladyfinger", "Stage_2_Mature_Green"),  # mature ladyfinger
    31222: ("ladyfinger", "Stage_2_Mature_Green"),  # mature ladyfinger
    30757: ("ladyfinger", "Stage_2_Mature_Green"),  # mature ladyfinger
    15034: ("ladyfinger", "Stage_2_Mature_Green"),  # mature ladyfinger
    11166: ("ladyfinger", "Stage_2_Mature_Green"),  # mature ladyfinger
    16094: ("ladyfinger", "Stage_2_Mature_Green"),  # mature ladyfinger
    10126: ("ladyfinger", "Stage_2_Mature_Green"),  # mature ladyfinger

    # Bananas to move from Stage 2 -> Stage 1 Raw (Green Banana Bunches)
    15558: ("banana", "Stage_1_Raw"),       # raw banana bunch (mature_vegetable_3)
    27129: ("banana", "Stage_1_Raw"),       # raw banana bunches (mature_vegetable_10 & 11)
    22465: ("banana", "Stage_1_Raw"),       # raw banana bunch (mature_vegetable_14)
    75138: ("banana", "Stage_1_Raw"),       # raw banana bunch (mature_vegetable_15)
}

# Collect all files from Stage_1 and Stage_2 folders
files_to_process = []
for folder in STAGE_FOLDERS:
    folder_path = os.path.join(IMAGES_DIR, folder)
    if os.path.exists(folder_path):
        for f in os.listdir(folder_path):
            file_path = os.path.join(folder_path, f)
            if os.path.isfile(file_path):
                files_to_process.append((folder, f, file_path, os.path.getsize(file_path)))

print(f"Found {len(files_to_process)} files in Stage 1 and 2 to re-evaluate...")

# Rename files to temporary names first to avoid collision
temp_moves = []
for folder, filename, path, size in files_to_process:
    if size in SIZE_MAP:
        fruit, target_folder = SIZE_MAP[size]
        temp_name = f"finaltemp_{fruit}_{target_folder}_{filename}"
        temp_path = os.path.join(IMAGES_DIR, folder, temp_name)
        shutil.move(path, temp_path)
        temp_moves.append((temp_path, fruit, target_folder))
    else:
        print(f"Skipped file (no mapping matches size): {filename} (Size: {size})")

# Finalize the sorting and clean renaming
# Stage counts: folder_name -> {fruit: count}
stage_counts = {}

for temp_path, fruit, target_folder_name in temp_moves:
    target_folder_path = os.path.join(IMAGES_DIR, target_folder_name)
    os.makedirs(target_folder_path, exist_ok=True)
    
    # Initialize counts for this folder
    if target_folder_name not in stage_counts:
        stage_counts[target_folder_name] = {}
        
    stage_counts[target_folder_name][fruit] = stage_counts[target_folder_name].get(fruit, 0) + 1
    idx = stage_counts[target_folder_name][fruit]
    
    # Build clean stage prefixes
    prefix = "raw" if "Stage_1" in target_folder_name else "mature"
    
    clean_name = f"{prefix}_{fruit}_{idx}.jpeg"
    final_dest_path = os.path.join(target_folder_path, clean_name)
    
    shutil.move(temp_path, final_dest_path)
    print(f"Aligned & Renamed: {os.path.basename(temp_path)} -> '{target_folder_name}/{clean_name}'")

print("\nFlawless sorting complete!")
