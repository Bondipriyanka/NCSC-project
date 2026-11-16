import argparse
import json
import os
from typing import List, Dict, Optional, Tuple

import cv2
import numpy as np

try:
    import onnxruntime as ort
except Exception:  # pragma: no cover
    ort = None

try:
    from ultralytics import YOLO
except Exception:  # pragma: no cover
    YOLO = None


FRUIT_OPTIONS = {
    "apple", "banana", "tomato", "orange", "mango", "grape", "pineapple",
    "guava", "radish", "potato", "carrot", "cucumber", "cabbage",
    "capsicum", "ladyfinger", "brinjal"
}
DEFAULT_YOLO_MODELS = [
    "best.pt",
    "fruit_yolo.pt",
    "fruit_detector.pt",
    "yolov8n.pt",
    "yolov11n.pt",
]


def estimate_bunch_count(detected_blob_count: int, max_valleys: int, fruit_pixels_count: int) -> int:
    """Conservative offline estimate: a single fruit should stay at count 1 unless there is
    strong multi-item evidence from multiple blobs or valley patterns.
    """
    if detected_blob_count > 1 and fruit_pixels_count >= 400:
        return min(12, max(2, detected_blob_count))

    if max_valleys >= 2 and fruit_pixels_count >= 1500:
        return min(12, max(2, max_valleys + 1))

    return 1


class FruitFreshnessDetector:
    def __init__(self, yolo_model_path: Optional[str] = None, onnx_model_path: Optional[str] = None):
        self.yolo_model = None
        self.onnx_session = None
        self.yolo_model_path = yolo_model_path
        self.onnx_model_path = onnx_model_path

        resolved_model = yolo_model_path
        if not resolved_model:
            for candidate in DEFAULT_YOLO_MODELS:
                if os.path.exists(candidate):
                    resolved_model = candidate
                    break

        if resolved_model and YOLO is not None and os.path.exists(resolved_model):
            self.yolo_model = YOLO(resolved_model)
            self.yolo_model_path = resolved_model
        elif YOLO is not None:
            try:
                self.yolo_model = YOLO("yolov8n.pt")
                self.yolo_model_path = "yolov8n.pt"
            except Exception:
                self.yolo_model = None
                self.yolo_model_path = None

        if onnx_model_path and ort is not None and os.path.exists(onnx_model_path):
            self.onnx_session = ort.InferenceSession(onnx_model_path, providers=["CPUExecutionProvider"])

    def detect_with_yolo(self, image_bgr: np.ndarray) -> List[Dict]:
        if self.yolo_model is None:
            return []

        results = self.yolo_model(image_bgr, conf=0.25, imgsz=640, verbose=False)
        boxes = []
        for result in results:
            names = getattr(result, "names", {})
            for box in result.boxes:
                try:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
                    conf = float(box.conf[0].cpu().numpy())
                    cls_id = int(box.cls[0].cpu().numpy())
                    label = str(names.get(cls_id, "fruit")).lower()
                except Exception:
                    continue

                if label in ("teddy bear", "cell phone", "laptop", "remote", "cup", "bottle", "backpack", "handbag", "suitcase", "sports ball", "book", "clock", "chair", "couch", "potted plant"):
                    return [{
                        "is_invalid": True,
                        "label": label,
                        "message": f"⚠️ NON-PRODUCE DETECTED ({label.title()}): YOLOv8 Neural Net detected a {label.title()}. Please scan a real fruit or vegetable."
                    }]

                if label not in FRUIT_OPTIONS and label != "fruit":
                    continue

                crop = image_bgr[max(0, y1):min(image_bgr.shape[0], y2), max(0, x1):min(image_bgr.shape[1], x2)]
                stage = self.estimate_stage_from_crop(crop, fruit_type=label) if crop.size else "ripe"
                boxes.append({
                    "label": label if label in FRUIT_OPTIONS else "fruit",
                    "confidence": conf,
                    "bbox": [x1, y1, x2, y2],
                    "stage": stage,
                })
        # Deduplicate heavily overlapping bounding boxes for the same fruit
        if len(boxes) > 1:
            boxes = sorted(boxes, key=lambda b: b.get("confidence", 0), reverse=True)
            kept = []
            for b in boxes:
                x1, y1, x2, y2 = b["bbox"]
                area = max(1, (x2 - x1) * (y2 - y1))
                is_dup = False
                for k in kept:
                    kx1, ky1, kx2, ky2 = k["bbox"]
                    k_area = max(1, (kx2 - kx1) * (ky2 - ky1))
                    ix1, iy1 = max(x1, kx1), max(y1, ky1)
                    ix2, iy2 = min(x2, kx2), min(y2, ky2)
                    if ix2 > ix1 and iy2 > iy1:
                        inter = (ix2 - ix1) * (iy2 - iy1)
                        if inter / min(area, k_area) > 0.50:
                            is_dup = True
                            break
                if not is_dup:
                    kept.append(b)
            boxes = kept

        return boxes

    @staticmethod
    def estimate_stage_from_crop(crop: np.ndarray, fruit_type: Optional[str] = None) -> str:
        if crop.size == 0:
            return "ripe"
        hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
        h = hsv[:, :, 0]
        s = hsv[:, :, 1]
        v = hsv[:, :, 2]

        ch, cw = crop.shape[:2]
        yy, xx = np.ogrid[:ch, :cw]
        # Elliptical center mask to suppress background corners inside the crop
        cy, cx = ch / 2.0, cw / 2.0
        ry, rx = max(1.0, ch * 0.44), max(1.0, cw * 0.44)
        in_core_ellipse = (((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2) <= 1.0

        bright_bg = (v > 185) & (s < 40)
        neutral_bg = (s < 15) & (v > 120)
        blue_wall_bg = (h >= 98) & (h <= 132) & (s >= 40)
        outer_dark_bg = (~in_core_ellipse) & (v < 65)
        valid_mask = (~bright_bg) & (~neutral_bg) & (~blue_wall_bg) & (~outer_dark_bg)
        if valid_mask.sum() < max(30, crop.shape[0] * crop.shape[1] * 0.03):
            valid_mask = (~bright_bg) & (~blue_wall_bg)
            if valid_mask.sum() < 20:
                valid_mask = np.ones((crop.shape[0], crop.shape[1]), dtype=bool)

        h_val = h[valid_mask]
        s_val = s[valid_mask]
        v_val = v[valid_mask]
        if h_val.size == 0:
            return "ripe"

        # Calibrated HSV masks (excluding sky/royal blue walls h > 98 from mold)
        black_decay_mask = (v_val < 52) | ((v_val < 75) & (s_val < 55) & ((h_val < 22) | (h_val > 65)))
        yellow_mask = (h_val >= 16) & (h_val <= 40) & (s_val >= 30) & (v_val >= 75)
        green_mask = (h_val >= 35) & (h_val <= 90) & (s_val >= 30) & (v_val >= 35)
        red_mask = ((h_val <= 14) | (h_val >= 165)) & (s_val >= 35) & (v_val >= 35)
        brown_mask = (v_val >= 40) & (v_val <= 145) & (s_val >= 25) & (s_val <= 180) & ((h_val < 20) | (h_val > 145))
        mold_mask = (h_val >= 65) & (h_val <= 96) & (s_val >= 18) & (s_val <= 165) & (v_val >= 45) & (v_val <= 205)

        green_ratio = float(green_mask.mean())
        yellow_ratio = float(yellow_mask.mean())
        red_ratio = float(red_mask.mean())
        black_decay_ratio = float(black_decay_mask.mean())
        brown_ratio = float(brown_mask.mean())
        mold_ratio = float(mold_mask.mean())

        # Roughness for sugar freckles / wrinkles / fungal lesions
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0)
        gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1)
        grad = cv2.magnitude(gx, gy)
        roughness = float(grad[valid_mask].mean()) if valid_mask.sum() > 0 else 0.0

        f_type = (fruit_type or "").lower()

        if f_type == "banana":
            if black_decay_ratio >= 0.35 or (black_decay_ratio + brown_ratio) >= 0.55:
                return "decomposed" if black_decay_ratio > 0.60 else "rotten"
            if green_ratio >= 0.30 and black_decay_ratio < 0.20:
                return "raw" if green_ratio >= 0.45 and yellow_ratio < 0.15 else "mature"
            if black_decay_ratio >= 0.10 or (black_decay_ratio >= 0.06 and brown_ratio >= 0.10):
                return "rotten"
            if green_ratio >= 0.16:
                return "mature"
            if yellow_ratio >= 0.15 and (brown_ratio >= 0.05 or black_decay_ratio >= 0.04 or roughness > 24):
                return "overripe"
            if green_ratio >= 0.08 and yellow_ratio >= 0.10:
                return "ripening"
            return "ripe"

        if f_type == "potato":
            solanine_green_mask = (h_val >= 25) & (h_val <= 85) & (s_val >= 28) & (v_val >= 55)
            solanine_ratio = float(solanine_green_mask.mean())
            if mold_ratio >= 0.025 or black_decay_ratio >= 0.14 or (brown_ratio >= 0.22 and roughness >= 25.0) or (black_decay_ratio >= 0.06 and brown_ratio >= 0.20):
                return "decomposed" if (mold_ratio > 0.10 or black_decay_ratio > 0.30) else "rotten"
            if solanine_ratio >= 0.05 or roughness >= 21.0:
                return "overripe"
            if green_ratio >= 0.20:
                return "raw"
            return "ripe"

        if f_type == "orange":
            orange_peel_mask = (h_val >= 8) & (h_val <= 25) & (s_val >= 65) & (v_val >= 75)
            orange_peel_ratio = float(orange_peel_mask.mean())
            citrus_rot_mask = (v_val < 115) & (s_val >= 25) & ((h_val < 20) | (h_val > 150)) & (~orange_peel_mask)
            citrus_rot_ratio = float(citrus_rot_mask.mean())
            if mold_ratio >= 0.025 or black_decay_ratio >= 0.14 or citrus_rot_ratio >= 0.15:
                return "decomposed" if (mold_ratio > 0.20 or black_decay_ratio > 0.30) else "rotten"
            if citrus_rot_ratio >= 0.08 or (roughness >= 24.0 and orange_peel_ratio < 0.50):
                return "overripe"
            if green_ratio >= 0.25 and mold_ratio < 0.02:
                return "mature"
            if yellow_ratio >= 0.30 and orange_peel_ratio < 0.25:
                return "ripening"
            return "ripe"

        if f_type == "guava":
            if black_decay_ratio >= 0.28 or (black_decay_ratio + brown_ratio) >= 0.48:
                return "decomposed" if black_decay_ratio > 0.45 else "rotten"
            if brown_ratio >= 0.22 and yellow_ratio < 0.25:
                return "rotten"
            if green_ratio >= 0.35 and yellow_ratio < 0.20:
                return "mature"
            return "ripe"

        if f_type == "tomato":
            if mold_ratio >= 0.015 or black_decay_ratio >= 0.18 or brown_ratio >= 0.25 or (brown_ratio >= 0.12 and roughness >= 19.0):
                return "decomposed" if (black_decay_ratio > 0.40 or brown_ratio > 0.45) else "rotten"
            if roughness >= 18.0 or brown_ratio >= 0.10:
                return "overripe"
            if red_ratio >= 0.20 and (green_ratio < 0.06 or yellow_ratio < 0.10):
                return "ripe"
            if green_ratio >= 0.20 and red_ratio < 0.08:
                return "raw"
            if (yellow_ratio >= 0.10 or green_ratio >= 0.05) and (red_ratio >= 0.08 or yellow_ratio >= 0.15):
                return "ripening"
            if red_ratio >= 0.12:
                return "ripe"
            return "ripe"

        if f_type == "apple":
            if mold_ratio >= 0.015 or black_decay_ratio >= 0.18 or brown_ratio >= 0.22 or (brown_ratio >= 0.12 and roughness >= 19.0):
                return "decomposed" if (black_decay_ratio > 0.40 or brown_ratio > 0.45) else "rotten"
            if roughness >= 17.0 or brown_ratio >= 0.09:
                return "overripe"
            if red_ratio >= 0.15 or (green_ratio >= 0.15 and yellow_ratio >= 0.15):
                return "ripe"
            if green_ratio >= 0.20 and red_ratio < 0.08:
                return "raw"
            if red_ratio >= 0.08 and green_ratio >= 0.08:
                return "ripening"
            return "ripe"

        if f_type in ("cabbage", "cucumber", "capsicum", "ladyfinger"):
            if mold_ratio >= 0.015 or black_decay_ratio >= 0.18 or brown_ratio >= 0.25 or (brown_ratio >= 0.15 and roughness >= 22.0):
                return "decomposed" if black_decay_ratio > 0.35 else "rotten"
            if roughness >= 20.0 or brown_ratio >= 0.12 or yellow_ratio >= 0.20:
                return "overripe"
            if green_ratio >= 0.15:
                return "ripe"
            return "ripe"

        if mold_ratio >= 0.015 or black_decay_ratio >= 0.20 or (brown_ratio >= 0.25 and roughness >= 20.0):
            return "decomposed" if black_decay_ratio > 0.40 else "rotten"
        if roughness >= 20.0 or brown_ratio >= 0.12 or (black_decay_ratio >= 0.06 and roughness >= 16.0):
            return "overripe"
        if green_ratio >= 0.35 and red_ratio < 0.10 and yellow_ratio < 0.10:
            return "raw"
        if green_ratio >= 0.20 and (yellow_ratio > 0.08 or red_ratio > 0.05):
            return "mature"
        if green_ratio >= 0.10 and (yellow_ratio > 0.12 or red_ratio > 0.12):
            return "ripening"
        if yellow_ratio >= 0.18 or red_ratio >= 0.18 or green_ratio >= 0.18:
            return "ripe"
        return "ripe"

    @staticmethod
    def preprocess_image(frame: np.ndarray, target_size: Tuple[int, int] = (640, 640)) -> np.ndarray:
        resized = cv2.resize(frame, target_size, interpolation=cv2.INTER_LINEAR)
        return resized

    @staticmethod
    def merge_adjacent_boxes(boxes: List[Tuple[int, int, int, int]], max_img_area: int) -> List[Tuple[int, int, int, int]]:
        if not boxes:
            return []
        boxes = sorted(boxes, key=lambda b: b[1])  # sort by y
        merged = []
        used = [False] * len(boxes)
        for i in range(len(boxes)):
            if used[i]:
                continue
            x1, y1, w1, h1 = boxes[i]
            r1, b1 = x1 + w1, y1 + h1
            for j in range(i + 1, len(boxes)):
                if used[j]:
                    continue
                x2, y2, w2, h2 = boxes[j]
                r2, b2 = x2 + w2, y2 + h2
                x_overlap = max(0, min(r1, r2) - max(x1, x2))
                y_overlap = max(0, min(b1, b2) - max(y1, y2))
                y_gap = y2 - b1 if y2 > b1 else (y1 - b2 if y1 > b2 else 0)

                # Merge vertically stacked parts (like crown on pineapple or stem on tomato) or overlapping detections
                is_vertical_stack = (x_overlap > 0.25 * min(w1, w2)) and (y_gap <= 40)
                is_overlapping = (x_overlap > 0.20 * min(w1, w2) and y_overlap > 0.20 * min(h1, h2))

                if is_vertical_stack or is_overlapping:
                    nx1 = min(x1, x2)
                    ny1 = min(y1, y2)
                    nr1 = max(r1, r2)
                    nb1 = max(b1, b2)
                    nw = nr1 - nx1
                    nh = nb1 - ny1
                    x1, y1, w1, h1 = nx1, ny1, nw, nh
                    r1, b1 = nr1, nb1
                    used[j] = True
            merged.append((x1, y1, w1, h1))
        return merged

    def detect_fruits(self, image_bgr: np.ndarray, fruit_hint: Optional[str] = None) -> Dict:
        hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)
        max_img_area = image_bgr.shape[0] * image_bgr.shape[1]

        # Ignore bright blue webcam background (h in 95..135, s > 75)
        not_blue_mask = ~((h >= 95) & (h <= 135) & (s > 75))
        valid_area = max(1, int(not_blue_mask.sum()))

        bright_red_mask = (((h <= 14) | (h >= 165)) & (s >= 50) & (v >= 50) & not_blue_mask)
        yellow_mask = ((h >= 18) & (h <= 38) & (s >= 40) & (v >= 75) & not_blue_mask)
        green_mask = ((h >= 35) & (h <= 90) & (s >= 35) & (v >= 35) & not_blue_mask)
        black_decay_mask = ((v < 65) | ((v < 85) & (s < 55) & ((h < 25) | (h > 65)))) & not_blue_mask

        bright_red_ratio = float(bright_red_mask.sum() / valid_area)
        yellow_ratio = float(yellow_mask.sum() / valid_area)
        green_ratio = float(green_mask.sum() / valid_area)
        black_decay_ratio = float(black_decay_mask.sum() / valid_area)

        f_hint = (fruit_hint or "").lower().strip()

        # Run YOLO on COCO-trained classes only (exclude potato/vegetables where YOLO hallucinates apple boxes)
        use_yolo = (self.yolo_model is not None and (not f_hint or f_hint in ("banana", "apple", "orange", "carrot", "potato")))
        detections = self.detect_with_yolo(image_bgr) if use_yolo else []
        if detections and detections[0].get("is_invalid"):
            return {
                "status": "mismatch",
                "detected_fruit": detections[0]["label"],
                "dominant_stage": "invalid",
                "count": 0,
                "message": detections[0]["message"]
            }

        # ⚠️ PRODUCE EXISTENCE VERIFICATION:
        # Prevent scanning human faces, room walls, or non-produce objects
        skin_mask = (((h >= 5) & (h <= 24)) & (s >= 20) & (s <= 80) & (v >= 65) & not_blue_mask)
        skin_ratio = float(skin_mask.sum() / valid_area)

        # 🛑 PRODUCE GATEKEEPER 1: HUMAN HAND / SKIN DETECTION
        has_real_produce = (yellow_ratio > 0.08 or bright_red_ratio > 0.08 or green_ratio > 0.08)
        if not has_real_produce and skin_ratio > 0.28:
            return {
                "status": "mismatch",
                "detected_fruit": "human_hand",
                "dominant_stage": "invalid",
                "count": 0,
                "message": "⚠️ HUMAN HAND DETECTED: A human hand or skin was detected in the camera frame. Please place a real fruit or vegetable in front of the camera."
            }

        # 🛑 PRODUCE GATEKEEPER 2: MOBILE PHONE / ELECTRONIC DEVICE DETECTION
        dark_glass_mask = (v < 55) & (s < 30) & not_blue_mask
        lit_screen_mask = (image_bgr[:, :, 0] > 105) & (image_bgr[:, :, 0] > image_bgr[:, :, 2] + 12) & (s < 45) & not_blue_mask
        metallic_mask = (s < 20) & not_blue_mask
        electronic_ratio = float((dark_glass_mask | lit_screen_mask | metallic_mask).sum() / valid_area)
        produce_ratio = float((bright_red_mask | yellow_mask | green_mask).sum() / valid_area)

        if (electronic_ratio > 0.45 and produce_ratio < 0.12) or (electronic_ratio > 0.65):
            return {
                "status": "mismatch",
                "detected_fruit": "electronics",
                "dominant_stage": "invalid",
                "count": 0,
                "message": "⚠️ ELECTRONIC DEVICE DETECTED: A mobile phone or electronic device was detected in frame. Please scan a real biological fruit or vegetable."
            }

        # 🥕 OPTICAL PRODUCE CLASSIFIER (Auto-detects actual vegetable/fruit in frame)
        optically_detected = None
        orange_mask = ((h >= 10) & (h <= 22) & (s >= 90) & (v >= 80) & not_blue_mask)
        orange_ratio = float(orange_mask.sum() / valid_area)

        if orange_ratio > 0.20 and bright_red_ratio < 0.15:
            optically_detected = "carrot" if f_hint != "orange" else "orange"
        elif bright_red_ratio > 0.20:
            optically_detected = "tomato" if yellow_ratio > 0.10 else "apple"
        elif yellow_ratio > 0.20:
            optically_detected = "banana"
        elif green_ratio > 0.15 and yellow_ratio < 0.10 and bright_red_ratio < 0.06:
            optically_detected = "guava"

        if optically_detected and f_hint and optically_detected != f_hint:
            return {
                "status": "mismatch",
                "detected_fruit": optically_detected,
                "dominant_stage": "mismatch",
                "count": 0,
                "message": f"⚠️ PRODUCT MISMATCH DETECTED: You scanned a {optically_detected.capitalize()} but selected {f_hint.capitalize()} in the dropdown."
            }

        if f_hint in ("cabbage", "cucumber", "capsicum", "ladyfinger"):
            if green_ratio < 0.05 and black_decay_ratio < 0.06:
                return {
                    "status": "mismatch",
                    "detected_fruit": "unknown",
                    "dominant_stage": "unknown",
                    "count": 0,
                    "message": f"⚠️ NO {f_hint.upper()} DETECTED: No {f_hint.capitalize()} found in camera frame. Please align {f_hint.capitalize()} to the lens."
                }
        elif f_hint in ("tomato", "apple"):
            if bright_red_ratio < 0.04 and green_ratio < 0.05 and black_decay_ratio < 0.05 and yellow_ratio < 0.08:
                return {
                    "status": "mismatch",
                    "detected_fruit": "unknown",
                    "dominant_stage": "unknown",
                    "count": 0,
                    "message": f"⚠️ NO {f_hint.upper()} DETECTED: No {f_hint.capitalize()} found in camera frame. Please align {f_hint.capitalize()} to the lens."
                }
        elif f_hint == "banana":
            if yellow_ratio < 0.05 and green_ratio < 0.05 and black_decay_ratio < 0.06:
                return {
                    "status": "mismatch",
                    "detected_fruit": "unknown",
                    "dominant_stage": "unknown",
                    "count": 0,
                    "message": "⚠️ NO BANANA DETECTED: No Banana found in camera frame. Please align Banana to the lens."
                }
        elif f_hint == "brinjal":
            purple_mask = ((h >= 130) & (h <= 170) & (s >= 35) & not_blue_mask)
            purple_ratio = float(purple_mask.sum() / valid_area)
            if purple_ratio < 0.04 and black_decay_ratio < 0.06:
                return {
                    "status": "mismatch",
                    "detected_fruit": "unknown",
                    "dominant_stage": "unknown",
                    "count": 0,
                    "message": "⚠️ NO BRINJAL DETECTED: No Brinjal found in camera frame. Please align Brinjal to the lens."
                }
        elif f_hint in ("orange", "carrot"):
            orange_mask = ((h >= 9) & (h <= 24) & (s >= 65) & (v >= 70) & not_blue_mask)
            orange_ratio = float(orange_mask.sum() / valid_area)
            if orange_ratio < 0.04 and black_decay_ratio < 0.06:
                return {
                    "status": "mismatch",
                    "detected_fruit": "unknown",
                    "dominant_stage": "unknown",
                    "count": 0,
                    "message": f"⚠️ NO {f_hint.upper()} DETECTED: No {f_hint.capitalize()} found in camera frame."
                }

        # ⚠️ PRODUCT MISMATCH CHECKS (Block scan if user selected wrong fruit/veg in dropdown):
        if f_hint == "banana":
            is_yolo_banana = False
            if detections:
                det_label = detections[0].get("label", "").lower()
                det_conf = detections[0].get("confidence", 0)
                if det_label == "banana" and det_conf >= 0.28:
                    is_yolo_banana = True
                elif det_label in ("apple", "orange", "carrot") and det_conf >= 0.35:
                    return {
                        "status": "mismatch",
                        "detected_fruit": det_label,
                        "dominant_stage": "unknown",
                        "count": 0,
                        "message": f"⚠️ PRODUCT MISMATCH DETECTED: You scanned a {det_label.capitalize()} but selected Banana in the dropdown."
                    }

            if not is_yolo_banana:
                # Check round shape + high red content
                fruit_mask = (not_blue_mask & (v > 30) & (s > 30)).astype(np.uint8) * 255
                cnts, _ = cv2.findContours(fruit_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                cluster_aspect = 2.0
                if cnts:
                    c = max(cnts, key=cv2.contourArea)
                    rect = cv2.minAreaRect(c)
                    cluster_aspect = max(rect[1]) / max(1.0, min(rect[1]))

                if cluster_aspect < 1.45 and (bright_red_ratio >= 0.12 or (bright_red_ratio >= 0.08 and yellow_ratio < 0.15)):
                    return {
                        "status": "mismatch",
                        "detected_fruit": "tomato",
                        "dominant_stage": "unknown",
                        "count": 0,
                        "message": "⚠️ PRODUCT MISMATCH DETECTED: You scanned a round Tomato/Apple but selected Banana in the dropdown."
                    }

                if bright_red_ratio >= 0.22 and yellow_ratio < 0.10 and green_ratio < 0.10:
                    return {
                        "status": "mismatch",
                        "detected_fruit": "apple",
                        "dominant_stage": "unknown",
                        "count": 0,
                        "message": "⚠️ PRODUCT MISMATCH DETECTED: High red content detected. You scanned a Tomato/Apple but selected Banana in the dropdown."
                    }

        if f_hint in ("tomato", "apple"):
            if detections:
                det_label = detections[0].get("label", "").lower()
                det_conf = detections[0].get("confidence", 0)
                if det_label == "banana" and det_conf >= 0.40:
                    return {
                        "status": "mismatch",
                        "detected_fruit": "banana",
                        "dominant_stage": "unknown",
                        "count": 0,
                        "message": f"⚠️ PRODUCT MISMATCH DETECTED: You scanned a Banana but selected {f_hint.capitalize()} in the dropdown."
                    }
            if yellow_ratio >= 0.30 and bright_red_ratio < 0.03 and black_decay_ratio < 0.08:
                return {
                    "status": "mismatch",
                    "detected_fruit": "banana",
                    "dominant_stage": "unknown",
                    "count": 0,
                    "message": f"⚠️ PRODUCT MISMATCH DETECTED: High yellow content and no red pigment. Did you scan a Banana/Mango instead of {f_hint.capitalize()}?"
                }

        def describe_item_defect(f_name: str, st: str) -> str:
            f_name = (f_name or "").lower()
            if f_name == "potato":
                return {
                    "raw": "Small Firm Tuber",
                    "mature": "Firm Clean Skin",
                    "ripening": "Slight Skin Softening",
                    "ripe": "Firm Brown Skin, Healthy Eyes",
                    "overripe": "Green Solanine Patches / Sprouting",
                    "rotten": "Dark Sunken Rot & Mold Spots",
                    "decomposed": "Severe Fungal Mold & Necrotic Decay",
                }.get(st, "Firm Brown Skin")
            if f_name == "orange":
                return {
                    "raw": "Dark Green Unripe Rind",
                    "mature": "Green Unripe Citrus Peel",
                    "ripening": "Yellow-Orange Ripening Peel",
                    "ripe": "Bright Vibrant Orange, Firm & Fresh",
                    "overripe": "Soft Bruised Rind & Dull Peel",
                    "rotten": "Blue-Green Fungal Mold & Soft Rot",
                    "decomposed": "Extensive Fungal Mold & Collapsed Rind",
                }.get(st, "Bright Vibrant Orange")
            if f_name == "banana":
                return {
                    "raw": "Dark Green Raw Peel",
                    "mature": "Mature Green Firm Peel",
                    "ripening": "Green-Yellow Ripening Transition",
                    "ripe": "Golden Yellow Ripe Peel",
                    "overripe": "Brown Sugar Freckles / Softening",
                    "rotten": "Dark Black Rotten Patches",
                    "decomposed": "Blackened Collapsed Peel",
                }.get(st, "Golden Yellow Ripe Peel")
            return {
                "raw": "Immature Raw Stage",
                "mature": "Mature Firm Stage",
                "ripening": "Ripening Color Transition",
                "ripe": "Peak Ripe & Fresh",
                "overripe": "Soft / Wrinkled Overripe Surface",
                "rotten": "Rotten Decay Lesions / Mold",
                "decomposed": "Extensively Decomposed Tissue",
            }.get(st, "Peak Ripe & Fresh")

        def slice_banana_cluster(cluster_bbox: List[int], target_count: int) -> List[Dict]:
            bx1, by1, bx2, by2 = cluster_bbox
            cw = max(1, bx2 - bx1)
            ch = max(1, by2 - by1)
            stem_skip = int(by1 + ch * 0.16)
            pos_names = (
                ["Left", "Right"] if target_count == 2 else
                (["Left", "Center", "Right"] if target_count == 3 else
                 (["Left", "Center-Left", "Center-Right", "Right"] if target_count == 4 else
                  [f"Item #{i+1}" for i in range(target_count)]))
            )
            sliced_items = []
            for idx in range(target_count):
                sx1 = bx1 + int((idx * cw) / target_count)
                sx2 = bx1 + int(((idx + 1) * cw) / target_count)
                sy1 = stem_skip if (by2 - stem_skip) > 20 else by1
                sy2 = by2
                sub_crop = image_bgr[sy1:sy2, sx1:sx2]
                st = self.estimate_stage_from_crop(sub_crop, fruit_type="banana") if sub_crop.size > 0 else "ripe"
                sliced_items.append({
                    "id": idx + 1,
                    "position": pos_names[idx],
                    "label": "banana",
                    "confidence": 0.90,
                    "bbox": [sx1, sy1, sx2, sy2],
                    "stage": st,
                    "is_good": st in ("raw", "mature", "ripening", "ripe"),
                    "defect": describe_item_defect("banana", st),
                })
            return sliced_items

        # Filter out tiny isolated YOLO detections (< 4% of image area) if single
        if len(detections) == 1:
            dw = detections[0]["bbox"][2] - detections[0]["bbox"][0]
            dh = detections[0]["bbox"][3] - detections[0]["bbox"][1]
            if (dw * dh) < max_img_area * 0.04:
                detections = []

        if detections:
            if f_hint == "banana":
                primary_bbox = detections[0]["bbox"] if detections else [0, 0, image_bgr.shape[1], image_bgr.shape[0]]
                primary_crop = image_bgr[primary_bbox[1]:primary_bbox[3], primary_bbox[0]:primary_bbox[2]] if detections else image_bgr
                overall_stage = self.estimate_stage_from_crop(primary_crop, fruit_type="banana")
                bw = primary_bbox[2] - primary_bbox[0]
                bh = primary_bbox[3] - primary_bbox[1]
                aspect = max(bw, bh) / max(1.0, min(bw, bh))
                if aspect >= 1.80 and len(detections) <= 1:
                    count = 1
                    is_bunch = False
                    items_out = [{
                        "id": 1,
                        "position": "Center",
                        "label": "banana",
                        "confidence": detections[0].get("confidence", 0.90),
                        "bbox": primary_bbox,
                        "stage": overall_stage,
                        "is_good": overall_stage in ("raw", "mature", "ripening", "ripe"),
                        "defect": describe_item_defect("banana", overall_stage),
                    }]
                else:
                    count = max(3 if aspect < 1.22 else 4, len(detections))
                    if overall_stage in ("rotten", "decomposed") and aspect >= 1.35:
                        count = max(2, len(detections))
                    is_bunch = True
                    items_out = slice_banana_cluster(primary_bbox, count)

                stage_counts = {k: 0 for k in ("raw", "mature", "ripening", "ripe", "overripe", "rotten", "decomposed")}
                for it in items_out:
                    stage_counts[it["stage"]] = stage_counts.get(it["stage"], 0) + 1
                dominant_stage = max(stage_counts.items(), key=lambda kv: kv[1])[0]
                return {
                    "is_bunch": is_bunch,
                    "count": count,
                    "stage_counts": stage_counts,
                    "dominant_stage": dominant_stage,
                    "items": items_out,
                    "method": "yolo-banana-cluster"
                }

            detections.sort(key=lambda d: (d["bbox"][0] + d["bbox"][2]) / 2.0)
            count = len(detections)
            pos_names = (
                ["Center"] if count == 1 else
                (["Left", "Right"] if count == 2 else
                 (["Left", "Center", "Right"] if count == 3 else
                  [f"Item #{i+1}" for i in range(count)]))
            )
            stage_counts = {"raw": 0, "mature": 0, "ripening": 0, "ripe": 0, "overripe": 0, "rotten": 0, "decomposed": 0}
            for idx, item in enumerate(detections):
                stage = item.get("stage", "ripe")
                item["id"] = idx + 1
                item["position"] = pos_names[idx]
                item["is_good"] = stage in ("raw", "mature", "ripening", "ripe")
                item["defect"] = describe_item_defect(f_hint or item.get("label", "fruit"), stage)
                stage_counts[stage] = stage_counts.get(stage, 0) + 1
            dominant_stage = max(stage_counts.items(), key=lambda kv: kv[1])[0]
            return {
                "is_bunch": count > 1,
                "count": count,
                "stage_counts": stage_counts,
                "dominant_stage": dominant_stage,
                "items": detections,
                "method": "yolo"
            }

        # Fallback robust segmentation pipeline for offline real-time operation.
        neutral_bg = ((np.abs(image_bgr[:, :, 0] - image_bgr[:, :, 1]) < 20) &
                      (np.abs(image_bgr[:, :, 1] - image_bgr[:, :, 2]) < 20) &
                      (np.abs(image_bgr[:, :, 2] - image_bgr[:, :, 0]) < 20) &
                      (v > 90))
        bright_bg = (v > 190) & (s < 40)

        green_mask = ((h >= 28) & (h <= 95) & (s > 25) & (v > 20)).astype(np.uint8)
        yellow_mask = ((h >= 16) & (h <= 38) & (s > 25) & (v > 25)).astype(np.uint8)
        red_mask = (((h <= 14) | (h >= 160)) & (s > 25) & (v > 20)).astype(np.uint8)
        brown_mask = ((v < 130) & (s > 18) & ((h < 28) | (h > 70))).astype(np.uint8)
        dark_rot_mask = ((v < 65) | ((v < 85) & (s < 55) & ((h < 25) | (h > 65)))).astype(np.uint8)

        combined = cv2.bitwise_or(green_mask, yellow_mask)
        combined = cv2.bitwise_or(combined, red_mask)
        combined = cv2.bitwise_or(combined, brown_mask)
        combined = cv2.bitwise_or(combined, dark_rot_mask)
        combined = (combined * 255)
        combined = cv2.bitwise_and(combined, cv2.bitwise_not((neutral_bg | bright_bg).astype(np.uint8) * 255))

        kernel = np.ones((5, 5), np.uint8)
        combined = cv2.morphologyEx(combined, cv2.MORPH_OPEN, kernel)
        combined = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel)

        num_labels, _, stats, _ = cv2.connectedComponentsWithStats(combined, connectivity=8)
        raw_boxes = []
        for label_idx in range(1, num_labels):
            bx, by, bw, bh, b_area = stats[label_idx]
            if b_area < 500:
                continue
            # Discard border lines unless it's a large fruit body
            if (bx <= 1 or by <= 1 or bx + bw >= image_bgr.shape[1] - 1 or by + bh >= image_bgr.shape[0] - 1) and (bw * bh < max_img_area * 0.08):
                continue
            raw_boxes.append((bx, by, bw, bh))

        merged_boxes = self.merge_adjacent_boxes(raw_boxes, max_img_area) if raw_boxes else []

        # If a single dominant fruit body exists (> 15% image), merge tiny fragments into it
        if len(merged_boxes) > 1:
            dominant_idx = max(range(len(merged_boxes)), key=lambda idx: merged_boxes[idx][2] * merged_boxes[idx][3])
            dom_x, dom_y, dom_w, dom_h = merged_boxes[dominant_idx]
            if (dom_w * dom_h) > max_img_area * 0.15:
                # Merge small adjacent boxes into dominant fruit
                cleaned = []
                for idx, (bx, by, bw, bh) in enumerate(merged_boxes):
                    if idx == dominant_idx:
                        continue
                    if (bw * bh) < max_img_area * 0.05:
                        # Merge into dominant
                        dom_x = min(dom_x, bx)
                        dom_y = min(dom_y, by)
                        dom_w = max(dom_x + dom_w, bx + bw) - dom_x
                        dom_h = max(dom_y + dom_h, by + bh) - dom_y
                    else:
                        cleaned.append((bx, by, bw, bh))
                cleaned.append((dom_x, dom_y, dom_w, dom_h))
                merged_boxes = cleaned

        # Filter out thin horizontal or vertical vines / stems (e.g. connecting vine between tomatoes)
        cleaned_boxes = []
        for bx, by, bw, bh in merged_boxes:
            b_aspect = max(bw, bh) / max(1.0, min(bw, bh))
            is_thin_vine = (b_aspect > 3.0 and min(bw, bh) < 0.20 * min(image_bgr.shape[0], image_bgr.shape[1]) and (bw * bh) < max_img_area * 0.18)
            if is_thin_vine:
                continue
            cleaned_boxes.append((bx, by, bw, bh))
        if cleaned_boxes:
            merged_boxes = cleaned_boxes

        items = []
        stage_counts = {"raw": 0, "mature": 0, "ripening": 0, "ripe": 0, "overripe": 0, "rotten": 0, "decomposed": 0}

        for x, y, w, h in merged_boxes:
            x1, y1 = int(max(0, x - 6)), int(max(0, y - 6))
            x2, y2 = int(min(image_bgr.shape[1], x + w + 6)), int(min(image_bgr.shape[0], y + h + 6))
            crop = image_bgr[y1:y2, x1:x2]
            if crop.size == 0:
                continue
            stage = self.estimate_stage_from_crop(crop, fruit_type=fruit_hint)
            items.append({
                "label": fruit_hint or "fruit",
                "confidence": 0.88,
                "bbox": [x1, y1, x2, y2],
                "stage": stage,
            })

        if len(items) == 0:
            crop = image_bgr
            stage = self.estimate_stage_from_crop(crop, fruit_type=fruit_hint)
            items.append({
                "label": fruit_hint or "fruit",
                "confidence": 0.85,
                "bbox": [0, 0, image_bgr.shape[1], image_bgr.shape[0]],
                "stage": stage,
            })

        # Fruit-type aware batch and cluster analysis
        if f_hint == "banana":
            primary_bbox = items[0]["bbox"] if items else [0, 0, image_bgr.shape[1], image_bgr.shape[0]]
            primary_crop = image_bgr[primary_bbox[1]:primary_bbox[3], primary_bbox[0]:primary_bbox[2]] if items else image_bgr
            overall_stage = self.estimate_stage_from_crop(primary_crop, fruit_type="banana")

            # Check cluster geometry
            crop_mask = combined[primary_bbox[1]:primary_bbox[3], primary_bbox[0]:primary_bbox[2]] if items else combined
            contours, _ = cv2.findContours(crop_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if contours:
                c = max(contours, key=cv2.contourArea)
                rect = cv2.minAreaRect(c)
                aspect = max(rect[1]) / max(1.0, min(rect[1]))
            else:
                aspect = 1.3

            if aspect >= 1.80 and len(items) <= 1:
                # Single banana
                count = 1
                is_bunch = False
                items_out = [{
                    "id": 1,
                    "position": "Center",
                    "label": "banana",
                    "confidence": 0.90,
                    "bbox": primary_bbox,
                    "stage": overall_stage,
                    "is_good": overall_stage in ("raw", "mature", "ripening", "ripe"),
                    "defect": describe_item_defect("banana", overall_stage),
                }]
            else:
                count = max(3 if aspect < 1.22 else 4, len(items))
                if overall_stage in ("rotten", "decomposed") and aspect >= 1.35:
                    count = max(2, len(items))
                is_bunch = True
                items_out = slice_banana_cluster(primary_bbox, count)

            for it in items_out:
                stage_counts[it["stage"]] = stage_counts.get(it["stage"], 0) + 1
            dominant_stage = max(stage_counts.items(), key=lambda kv: kv[1])[0]

            return {
                "is_bunch": is_bunch,
                "count": count,
                "stage_counts": stage_counts,
                "dominant_stage": dominant_stage,
                "items": items_out,
                "method": "banana-cluster-segmentation"
            }

        # Sort items left-to-right for spatial labeling
        items.sort(key=lambda d: (d["bbox"][0] + d["bbox"][2]) / 2.0)

        # Non-banana fruits & vegetables (Tomato, Apple, Pineapple, Potato, Orange, etc.)
        if len(items) == 1:
            single_stage = items[0]["stage"]
            items[0]["id"] = 1
            items[0]["position"] = "Center"
            items[0]["is_good"] = single_stage in ("raw", "mature", "ripening", "ripe")
            items[0]["defect"] = describe_item_defect(f_hint or items[0].get("label", "fruit"), single_stage)
            stage_counts[single_stage] = 1
            return {
                "is_bunch": False,
                "count": 1,
                "stage_counts": stage_counts,
                "dominant_stage": single_stage,
                "items": items,
                "method": "single-fruit-segmentation"
            }

        # Multi-item batch (multiple distinct separated items)
        count = len(items)
        pos_names = (
            ["Left", "Right"] if count == 2 else
            (["Left", "Center", "Right"] if count == 3 else
             [f"Item #{i+1}" for i in range(count)])
        )
        for idx, it in enumerate(items):
            st = it["stage"]
            it["id"] = idx + 1
            it["position"] = pos_names[idx]
            it["is_good"] = st in ("raw", "mature", "ripening", "ripe")
            it["defect"] = describe_item_defect(f_hint or it.get("label", "fruit"), st)
            stage_counts[st] = stage_counts.get(st, 0) + 1
        dominant_stage = max(stage_counts.items(), key=lambda kv: kv[1])[0]
        return {
            "is_bunch": True,
            "count": count,
            "stage_counts": stage_counts,
            "dominant_stage": dominant_stage,
            "items": items,
            "method": "multi-fruit-segmentation"
        }

    def analyze_frame(self, frame: np.ndarray, fruit_hint: Optional[str] = None) -> Dict:
        processed = self.preprocess_image(frame)
        result = self.detect_fruits(processed, fruit_hint=fruit_hint)
        return sanitize_json(result)


def sanitize_json(obj):
    if isinstance(obj, dict):
        return {str(k): sanitize_json(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [sanitize_json(v) for v in obj]
    elif isinstance(obj, (np.integer,)):
        return int(obj)
    elif isinstance(obj, (np.floating,)):
        return float(obj)
    elif isinstance(obj, (np.bool_,)):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return sanitize_json(obj.tolist())
    return obj


def pretty_result(result: Dict) -> str:
    return json.dumps(sanitize_json({
        "count": result.get("count", 0),
        "is_bunch": result.get("is_bunch", False),
        "dominant_stage": result.get("dominant_stage", "ripe"),
        "stage_counts": result.get("stage_counts", {}),
        "method": result.get("method", "unknown")
    }), indent=2)


def run_on_image(image_path: str, yolo_model_path: Optional[str] = None, onnx_model_path: Optional[str] = None):
    detector = FruitFreshnessDetector(yolo_model_path=yolo_model_path, onnx_model_path=onnx_model_path)
    frame = cv2.imread(image_path)
    if frame is None:
        raise FileNotFoundError(f"Unable to read image: {image_path}")
    result = detector.analyze_frame(frame)
    print(pretty_result(result))
    return result


def run_on_camera(yolo_model_path: Optional[str] = None, onnx_model_path: Optional[str] = None, camera_id: int = 0):
    detector = FruitFreshnessDetector(yolo_model_path=yolo_model_path, onnx_model_path=onnx_model_path)
    cap = cv2.VideoCapture(camera_id)
    if not cap.isOpened():
        raise RuntimeError(f"Unable to open camera {camera_id}.")

    print("Real-time fruit freshness detector started. Press 'q' to quit.")
    while True:
        ok, frame = cap.read()
        if not ok:
            break

        result = detector.analyze_frame(frame)
        count = result.get("count", 0)
        stage = result.get("dominant_stage", "ripe")
        is_bunch = result.get("is_bunch", False)

        cv2.putText(frame, f"Count: {count} | Stage: {stage.upper()} | Bunch: {'YES' if is_bunch else 'NO'}",
                    (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

        for item in result.get("items", []):
            x1, y1, x2, y2 = [int(v) for v in item.get("bbox", [0, 0, 0, 0])]
            stage_name = item.get("stage", "ripe")
            color = {
                "raw": (0, 255, 0),
                "mature": (50, 200, 100),
                "ripening": (0, 255, 255),
                "ripe": (0, 255, 0),
                "overripe": (0, 140, 255),
                "rotten": (0, 0, 255),
                "decomposed": (80, 80, 80),
            }.get(stage_name, (255, 255, 255))
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, stage_name.upper(), (x1, max(20, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        cv2.imshow("Fruit Freshness Scanner", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fruit freshness detector with count and stage summary.")
    parser.add_argument("--image", type=str, help="Path to a fruit image for batch analysis.")
    parser.add_argument("--camera", type=int, default=None, help="Camera index for live detection.")
    parser.add_argument("--yolo-model", type=str, default=None, help="Optional YOLO model path (.pt or .onnx).")
    parser.add_argument("--onnx-model", type=str, default=None, help="Optional ONNX model path for custom detection.")
    args = parser.parse_args()

    if args.image:
        run_on_image(args.image, yolo_model_path=args.yolo_model, onnx_model_path=args.onnx_model)
    elif args.camera is not None:
        run_on_camera(yolo_model_path=args.yolo_model, onnx_model_path=args.onnx_model, camera_id=args.camera)
    else:
        print("Please provide --image <path> or --camera <index>.")
