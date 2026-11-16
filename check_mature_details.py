import os
import cv2
import numpy as np

MATURE_DIR = "d:/Ncc proj/images/Stage_2_Mature_Green"

net = cv2.dnn.readNetFromONNX("mobilenetv2.onnx")
with open("imagenet_classes.txt", "r") as f:
    labels = [line.strip().lower() for line in f.readlines()]

files = os.listdir(MATURE_DIR)
for f in files:
    path = os.path.join(MATURE_DIR, f)
    if not os.path.isfile(path): continue
    
    size = os.path.getsize(path)
    cv_img = cv2.imread(path)
    if cv_img is None: continue
    
    blob = cv2.dnn.blobFromImage(cv_img, 1.0 / 255.0, (224, 224), (0.485, 0.456, 0.406), swapRB=True, crop=False)
    net.setInput(blob)
    preds = net.forward()
    top_indices = np.argsort(preds[0])[-3:][::-1]
    
    preds_str = ", ".join([f"{labels[idx]} ({preds[0][idx]:.2f})" for idx in top_indices])
    print(f"File: {f} | Size: {size} | Predictions: {preds_str}")
