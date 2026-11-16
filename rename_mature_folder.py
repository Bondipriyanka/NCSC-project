import os
import urllib.request
import shutil
import cv2
import numpy as np

IMAGES_DIR = "d:/Ncc proj/images"
MATURE_DIR = os.path.join(IMAGES_DIR, "Stage_2_Mature_Green")
RAW_DIR = os.path.join(IMAGES_DIR, "Stage_1_Raw")

# Create directories if missing
os.makedirs(MATURE_DIR, exist_ok=True)
os.makedirs(RAW_DIR, exist_ok=True)

# Download model if missing
if not os.path.exists("mobilenetv2.onnx"):
    print("Downloading ONNX model (approx. 13MB)...")
    urllib.request.urlretrieve("https://github.com/onnx/models/raw/main/validated/vision/classification/mobilenet/model/mobilenetv2-7.onnx", "mobilenetv2.onnx")
if not os.path.exists("imagenet_classes.txt"):
    print("Downloading labels...")
    urllib.request.urlretrieve("https://raw.githubusercontent.com/pytorch/hub/master/imagenet_classes.txt", "imagenet_classes.txt")

# Load model
print("Loading model...")
net = cv2.dnn.readNetFromONNX("mobilenetv2.onnx")
with open("imagenet_classes.txt", "r") as f:
    labels = [line.strip().lower() for line in f.readlines()]

files = [f for f in os.listdir(MATURE_DIR) if os.path.isfile(os.path.join(MATURE_DIR, f))]

# We will rename files to temp names first to prevent overwrite collision
temp_files = []

for filename in files:
    filepath = os.path.join(MATURE_DIR, filename)
    try:
        cv_img = cv2.imread(filepath)
        if cv_img is None:
            continue
            
        # Classify
        blob = cv2.dnn.blobFromImage(cv_img, 1.0 / 255.0, (224, 224), (0.485, 0.456, 0.406), swapRB=True, crop=False)
        net.setInput(blob)
        preds = net.forward()
        top_idx = np.argmax(preds[0])
        pred_label = labels[top_idx]
        
        detected_fruit = "vegetable"
        
        # Guava check (explicit override for the two guava photos, plus general guava/fig predictions)
        if filename in ["mature_banana_17.jpeg", "mature_banana_18.jpeg"] or any(x in pred_label for x in ["guava", "fig", "custard apple", "pear"]):
            detected_fruit = "guava"
        # Okra/Ladyfinger check
        elif any(x in pred_label for x in ["okra", "gumbo", "finger", "zucchini"]) or filename in [f"mature_banana_{i}.jpeg" for i in range(3, 13)] or filename in ["mature_cucumber_1.jpeg", "mature_cucumber_2.jpeg"]:
            detected_fruit = "ladyfinger"
        # Pineapple check
        elif "pineapple" in pred_label or "pineapple" in filename.lower():
            detected_fruit = "pineapple"
        # Cabbage check
        elif "cabbage" in pred_label or "cabbage" in filename.lower() and filename != "mature_cabbage_2.jpeg":
            detected_fruit = "cabbage"
        # Banana check
        elif "banana" in pred_label or "banana" in filename.lower():
            # If it's one of the raw banana bunches (13, 14, 15, 16), label it as raw_banana for moving
            if filename in ["mature_banana_13.jpeg", "mature_banana_14.jpeg", "mature_banana_15.jpeg", "mature_banana_16.jpeg"]:
                detected_fruit = "raw_banana"
            else:
                detected_fruit = "banana"
        # Radishes
        elif filename in ["mature_banana_1.jpeg", "mature_banana_2.jpeg", "mature_cabbage_2.jpeg"]:
            detected_fruit = "radish"
            
        temp_name = f"temp_{detected_fruit}_{filename}"
        shutil.move(filepath, os.path.join(MATURE_DIR, temp_name))
        temp_files.append((temp_name, detected_fruit))
        
    except Exception as e:
        print(f"Error reading {filename}: {e}")

# Rename/move files from temporary names
counts = {}
for temp_name, fruit in temp_files:
    src_path = os.path.join(MATURE_DIR, temp_name)
    
    if fruit == "raw_banana":
        # Move raw green banana bunches to Stage_1_Raw folder
        existing_raw_bananas = [f for f in os.listdir(RAW_DIR) if f.startswith("raw_banana")]
        idx = len(existing_raw_bananas) + 1
        final_name = f"raw_banana_{idx}.jpeg"
        dest_path = os.path.join(RAW_DIR, final_name)
        shutil.move(src_path, dest_path)
        print(f"Moved & Sorted: 'Stage_2_Mature_Green/{temp_name}' -> 'Stage_1_Raw/{final_name}'")
        
    else:
        # Keep inside Stage_2_Mature_Green, rename properly
        counts[fruit] = counts.get(fruit, 0) + 1
        idx = counts[fruit]
        final_name = f"mature_{fruit}_{idx}.jpeg"
        dest_path = os.path.join(MATURE_DIR, final_name)
        shutil.move(src_path, dest_path)
        print(f"Renamed: 'Stage_2_Mature_Green/{temp_name}' -> 'Stage_2_Mature_Green/{final_name}'")

print("\nFinished sorting Stage_2_Mature_Green!")
