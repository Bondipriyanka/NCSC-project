# 🌟 NCSC 2026: Smart Fruits & Vegetables Freshness Detection App
### Guide & Project Roadmap for 10th Class Students

Welcome to your NCSC (National Children's Science Congress) 2026 Project Workspace! This workspace has been organized to help you and your teammate build a high-quality, scientifically rigorous, and socially relevant project.

For NCSC, your focus is **"Science for Sustainable Development"** addressing a **Local Issue**. Using an AI-based app to detect food freshness directly targets **Food Waste reduction** in your local community (SDG 12: Responsible Consumption and Production).

---

## 📂 What's in this Workspace?

We have created the following files to help you complete your project. You can click on them to read or edit:
1. 📝 **[NCSC_Project_Report.md](file:///d:/Ncc%20proj/NCSC_Project_Report.md)**: A complete, structured project report template (10–15 pages equivalent) containing introduction, literature review, methodology, sample tables, and questionnaire.
2. 📊 **[Display_Board_Layout.md](file:///d:/Ncc%20proj/Display_Board_Layout.md)**: A guide to designing your 90cm × 120cm display chart, including layout tips and visual hierarchies to grab the judges' attention.
3. 🎤 **[Presentation_and_QA.md](file:///d:/Ncc%20proj/Presentation_and_QA.md)**: A complete script for your 10-minute presentation (divided between Student 1 & Student 2) and how to handle the 5-minute Q&A session.
4. 🧠 **[fruit_pipeline.py](fruit_pipeline.py)**: A real-time fruit scanner pipeline with batch counting and freshness-stage estimation. It supports image input and live camera input, and uses YOLOv8 as the best available real-time detector with a robust segmentation fallback.

### Install and run
```bash
pip install -r requirements.txt
python run_live_detector.py
```

For a single image:
```bash
python fruit_pipeline.py --image sample.jpg
```

For a live camera stream:
```bash
python fruit_pipeline.py --camera 0
```

For a custom-trained fruit model:
```bash
python train_fruit_detector.py --data data/fruit_data.yaml --epochs 50 --imgsz 640
```

### Best production workflow
- Use a custom trained YOLO model named `best.pt` in the project folder for the highest accuracy.
- If no custom model is available, the app automatically tries `yolov8n.pt`.
- The fallback segmentation remains active as a backup when the model is missing or confidence is low.

---

## 🎯 Step-by-Step Action Plan for You

To secure top marks, you must show the judges **field work** and **scientific inquiry**. Follow these steps:

### ⏱️ Phase 1: Local Survey & Field Study (Weeks 1-2)
* **What to do:** Visit 10-15 local vegetable/fruit vendors (in your village, town, or school neighborhood) and interview 15-20 households.
* **Tools to use:** Use the questionnaire provided in the [Project Report](file:///d:/Ncc%20proj/NCSC_Project_Report.md#appendix-a-survey-questionnaire).
* **Data to collect:** How much food is wasted? What are the main causes? How do they currently check freshness?

### 📱 Phase 2: Build & Train the AI (Weeks 3-4)
* **Step A: Teachable Machine:**
  1. Take 50+ photos of local fruits (e.g., Bananas or Tomatoes) at different stages: *Fresh (Green/Yellow), Moderately Fresh, Ripened, Over-Ripened, Rotten*.
  2. Go to [Google Teachable Machine](https://teachablemachine.withgoogle.com/) and train an Image Classification model.
  3. Export the model link.
* **Step B: App Building:**
  1. Use [MIT App Inventor](https://appinventor.mit.edu/) or [Kodular](https://www.kodular.io/).
  2. Design a simple screen where you click a button to take a photo, run it through the trained AI model, and show the color-coded result:
     - 🟢 **Good (Green)**: Safe, long shelf life.
     - 🟡 **Moderately Fresh (Yellow)**: Consume soon.
     - 🟠 **Ripened (Orange)**: Eat today.
     - 🟣 **Over-Ripened (Purple)**: Use for juice/jams.
     - 🔴 **Rotten (Red)**: Do not consume (compost it).
* **Step C: Firebase (Optional but recommended):** Connect a simple Firebase database to save log history of scanned items.

### 🧪 Phase 3: Testing & Data Collection (Week 5)
* **What to do:** Run a test of your app on 30 different fresh and decaying fruits. 
* **Scientific comparison:** Compare your app's detection against a shopkeeper's/parent's manual assessment. Calculate the percentage accuracy (e.g., if the app correctly identified 27 out of 30 fruits, accuracy is 90%).
* **Document it:** Take photos of the app in action in a local shop!

### 📝 Phase 4: Finalize the Report & Chart (Week 6)
* Fill in your local data into the [Project Report](file:///d:/Ncc%20proj/NCSC_Project_Report.md) template.
* Paint/print your 4-panel display chart using the [Display Board Layout](file:///d:/Ncc%20proj/Display_Board_Layout.md).
* Practice the speech from the [Presentation Guide](file:///d:/Ncc%20proj/Presentation_and_QA.md).

---

## 💡 Pro-Tips for NCSC Success (10th Class Level)
1. **Highlight the "Local" Aspect:** Emphasize that you visited vendors in *your specific locality/village*. Don't make it sound like a generic project.
2. **Be Honest About Limitations:** If your app struggled in low light or with a specific fruit (like green grapes), write it down under *Analysis & Discussion*! Judges love students who show honest scientific analysis rather than claiming "100% perfection."
3. **Show Your Working Model:** Bring a smartphone with the working app installed and a couple of actual fruits (one fresh, one ripe) to demonstrate live to the judges. It gets immense extra points!
