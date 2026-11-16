# 📊 NCSC 2026: DISPLAY BOARD DESIGN & LAYOUT GUIDE
**Max Allowed Size:** 90 cm (Height) × 120 cm (Width)

An attractive display chart is critical for NCSC success. Judges spend less than 2-3 minutes scanning your board before they listen to your speech. It needs to be clear, color-coded, and highly visual.

---

## 🎨 Recommended Materials & Color Palette
*   **Background Board:** White or light cream chart/mounting board (avoid dark backgrounds which make text hard to read).
*   **Header Banner:** Dark Green or Navy Blue backing paper with white text.
*   **Colors for Highlights:**
    *   🟢 **Green** for Fresh/Good indicators.
    *   🟡 **Yellow** for Moderately Fresh.
    *   🟠 **Orange** for Ripened.
    *   🟣 **Purple** for Over-Ripened.
    *   🔴 **Red** for Rotten/Unsafe.
*   **Text Cards:** Write or print text on small cards and glue them onto the board. This creates a neat "3D card" effect.

---

## 📐 Board Section Layout (4-Column Grid)

Here is how you can divide your 90cm × 120cm space into 4 columns and 2 rows:

```
+----------------------------------------------------------------------------------------------------+
|                      HEADER: NCSC PROJECT - SMART FRUITS & VEGETABLES DETECTOR                      |
+------------------------------------+----------------------------------+----------------------------+
|  PANEL 1: FRESHNESS GUIDE          |  PANEL 2: APP WORKFLOW           |  PANEL 3: TOOLS USED       |
|  - Green: Good                     |  - Step 1: Select Item Type      |  - MIT App Inventor        |
|  - Yellow: Moderately Fresh        |  - Step 2: Capture Image         |  - Google Teachable Machine|
|  - Orange: Ripened                 |  - Step 3: AI Analysis           |  - Firebase DB             |
|  - Purple: Over-Ripened            |  - Step 4: Display Freshness     |                            |
|  - Red: Rotten                     |  - Step 5: Save Log/Details      |                            |
+------------------------------------+----------------------------------+----------------------------+
|  PANEL 4: EXAMPLE APP RESULTS      |  PANEL 5: KEY FEATURES           |  PANEL 6: SYSTEM DIAGRAM   |
|  - Photos of App screen showing    |  - 5-Level color code classification|  [Flowchart of process:    |
|    "Good", "Ripened", "Rotten"     |  - Custom shelf-life estimates   |   Camera -> AI -> Output   |
|    items with recommendations.     |  - Dynamic recipes/pricing advice|   -> Firebase Log]         |
+------------------------------------+----------------------------------+----------------------------+
|  PANEL 7: FUTURE SCOPE             |  PANEL 8: SPECIFICATIONS         |  PROJECT INFO CARD         |
|  - Add more items (e.g., Mangoes)  |  - Platform: Android             |  - Group Leader: Student 1 |
|  - Cloud dashboard for farmers     |  - Model Type: Image Classification| - Partner: Student 2     |
|  - Dynamic price alerts for vendors|  - Cost: Low (Free tools used)   |  - Guide: Teacher Name     |
+------------------------------------+----------------------------------+----------------------------+
```

---

## ✍️ Panel Content (Copy-Paste Text for Chart)

### [Panel 1] Freshness Level Guide (Colour Code)
*   🟢 **Good (Green):** Excellent quality, safe to eat, long shelf life (6–7 days).
*   🟡 **Moderately Fresh (Yellow):** Good quality, safe to eat, consume within 3–5 days.
*   🟠 **Ripened (Orange):** Ready to eat, best taste now, consume within 1–2 days.
*   🟣 **Over-Ripened (Purple):** Very ripe, soft. Use immediately for juices, jams, sauces, or smoothies.
*   🔴 **Rotten (Red):** Spoiled, moldy, or unsafe. Do not consume. Compost or dispose of safely.

### [Panel 2] App Workflow - Simple Steps
1.  **Step 1: Select Item Type** (Choose Fruits or Vegetables on the home screen).
2.  **Step 2: Capture Image** (Point your mobile camera and click a clear photo of the item).
3.  **Step 3: App Analyzes** (The built-in AI classifier processes color, spots, and texture).
4.  **Step 4: Result Output** (The screen displays the freshness level and a traffic-light color label).
5.  **Step 5: View Recommendations** (See remaining shelf-life and suggestions, then click 'Save' to log the scan).

### [Panel 3] Tools & Technologies (Simple)
*   **MIT App Inventor / Kodular:** drag-and-drop block coding tools used to design the mobile app interface.
*   **Teachable Machine:** Google's web-based platform to train the image recognition AI.
*   **Firebase:** Cloud database to store scan history, user logs, and vendor reports.
*   **Mobile Camera:** Used to capture fruit images for real-time local scanning.

### [Panel 4] Example Results on App
*(Tip: Print 3 phone screen screenshots and paste them here)*
*   **Good Tomato:** Screen shows `🟢 GOOD (GREEN) | Shelf life: 6-7 Days | Recommendation: Store normally.`
*   **Ripened Banana:** Screen shows `🟠 RIPENED (ORANGE) | Shelf life: 1-2 Days | Recommendation: Eat today or tomorrow.`
*   **Rotten Item:** Screen shows `🔴 ROTTEN (RED) | Shelf life: 0 Days | Recommendation: Do not consume!`

### [Panel 5] Key Features
*   Classifies freshness into 5 easy-to-understand levels.
*   Predicts remaining shelf life under normal room conditions.
*   Suggests recipes for over-ripe fruits (e.g., banana bread, tomato sauce) to prevent waste.
*   Stores scan history so shopkeepers can track what items spoil fastest.
*   Simple UI designed specifically for local street vendors (color-coded, minimum text).

### [Panel 6] System Diagram (Simple)
*(Draw a neat flowchart on your board)*
`Input (Image) ---> Image Processing (AI Model) ---> Freshness Level (5-Level) ---> Display & Suggestions`  
*A branch goes down to:* `---> Save History (Firebase Database)`

### [Panel 7] Future Scope
*   Adding bulk-scanning capability for warehouses/stores.
*   Integrating a web dashboard for regional farmers to see which fruits decay fastest in transit.
*   Adding automated price adjustment recommendations based on freshness (e.g., automatically suggesting a discount for over-ripened stock).

### [Panel 8] Specifications
*   **Platform:** Android OS
*   **Tools:** MIT App Inventor, Teachable Machine, Firebase
*   **Device Requirements:** Any low-cost Android phone with a working camera
*   **Internet:** Offline capability for basic scanning; internet only required for database logging.
*   **Cost:** Zero software costs (built using entirely free open-source tools).
