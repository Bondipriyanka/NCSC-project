import os
import cv2
import numpy as np
from flask import Flask, jsonify, request, send_from_directory

from fruit_pipeline import FruitFreshnessDetector, FRUIT_OPTIONS

MODEL_CANDIDATES = [
    os.environ.get('YOLO_MODEL_PATH'),
    'best.pt',
    'fruit_yolo.pt',
    'fruit_detector.pt',
    'yolov8n.pt',
]

MODEL_PATH = next((p for p in MODEL_CANDIDATES if p and os.path.exists(p)), None)

app = Flask(__name__, static_folder='.', static_url_path='')
detector = FruitFreshnessDetector(yolo_model_path=MODEL_PATH)


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/api/health')
def health():
    return jsonify({"status": "ok", "service": "fruit-freshness-detector"})


@app.route('/api/detect', methods=['POST'])
def detect():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded."}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "Empty filename."}), 400

    fruit_hint = request.form.get('fruit')
    if not fruit_hint and file.filename:
        fname = file.filename.lower()
        for candidate in FRUIT_OPTIONS:
            if candidate in fname:
                fruit_hint = candidate
                break

    data = file.read()
    arr = np.frombuffer(data, np.uint8)
    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)

    if frame is None:
        return jsonify({"error": "Unable to decode uploaded image."}), 400

    result = detector.analyze_frame(frame, fruit_hint=fruit_hint)
    return jsonify(result)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
