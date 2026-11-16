import os
import urllib.request
import cv2
import numpy as np

# Download files if they don't exist
if not os.path.exists("mobilenetv2.onnx"):
    urllib.request.urlretrieve("https://github.com/onnx/models/raw/main/validated/vision/classification/mobilenet/model/mobilenetv2-7.onnx", "mobilenetv2.onnx")
if not os.path.exists("imagenet_classes.txt"):
    urllib.request.urlretrieve("https://raw.githubusercontent.com/pytorch/hub/master/imagenet_classes.txt", "imagenet_classes.txt")

net = cv2.dnn.readNetFromONNX("mobilenetv2.onnx")
with open("imagenet_classes.txt", "r") as f:
    labels = [line.strip().lower() for line in f.readlines()]

folder = "d:/Ncc proj/images/Stage_1_Raw"
files = os.listdir(folder)

for f in files:
    path = os.path.join(folder, f)
    if not os.path.isfile(path): continue
    
    cv_img = cv2.imread(path)
    if cv_img is None: continue
    
    blob = cv2.dnn.blobFromImage(cv_img, 1.0 / 255.0, (224, 224), (0.485, 0.456, 0.406), swapRB=True, crop=False)
    net.setInput(blob)
    preds = net.forward()
    
    # Get top 3 indices
    top_indices = np.argsort(preds[0])[-3:][::-1]
    
    print(f"\nFile: {f}")
    for idx in top_indices:
        print(f"  - {labels[idx]} ({preds[0][idx]:.4f})")
