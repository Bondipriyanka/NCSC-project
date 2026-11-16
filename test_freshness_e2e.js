const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { createCanvas, loadImage } = require("canvas");

async function runTests() {
    console.log("==================================================");
    console.log("🧪 RUNNING COMPREHENSIVE E2E VERIFICATION SUITE");
    console.log("==================================================");

    const htmlContent = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
    const appJsContent = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");

    // Setup simulated DOM environment
    const dom = new JSDOM(htmlContent, {
        runScripts: "dangerously",
        resources: "usable",
        url: "http://localhost:3000/"
    });
    const { window } = dom;

    // Polyfill canvas on window
    window.HTMLCanvasElement.prototype.getContext = function (type) {
        const c = createCanvas(this.width || 300, this.height || 220);
        return c.getContext(type);
    };

    // Load app.js into window
    window.eval(appJsContent);

    // Test cases definition
    const testCases = [
        {
            name: "🍌 Single Banana (Image 4 Bug Fix)",
            fruit: "banana",
            imagePath: "images/test_cases/test_crop_yellow_bananas.jpg",
            expectedBunch: false,
            expectedCount: 1,
            expectedGood: true
        },
        {
            name: "🍎 Single Apple",
            fruit: "apple",
            imagePath: "images/test_cases/webcam_apple_frame.jpg",
            expectedBunch: false,
            expectedCount: 1,
            expectedGood: true
        },
        {
            name: "🍅 Single Tomato",
            fruit: "tomato",
            imagePath: "images/test_cases/test_crop_tomato.jpg",
            expectedBunch: false,
            expectedCount: 1,
            expectedGood: true
        },
        {
            name: "🥔 Single Potato (Good)",
            fruit: "potato",
            imagePath: "images/test_cases/tc1_potato_good.jpg",
            expectedBunch: false,
            expectedCount: 1,
            expectedGood: true
        },
        {
            name: "🍅🍅 Group: 2 Tomatoes on Plate (Image 5 Plate Scenario)",
            fruit: "tomato",
            imagePath: "images/test_cases/test_crop_two_tomatoes.jpg",
            expectedBunch: true,
            expectedCount: 2,
            expectedGood: true
        },
        {
            name: "🍌🍌 Group: Mixed Banana Bunch",
            fruit: "banana",
            imagePath: "images/test_cases/tc3_banana_bunch_mixed.jpg",
            expectedBunch: true,
            expectedMinCount: 2
        }
    ];

    let passed = 0;
    let failed = 0;

    for (const tc of testCases) {
        console.log(`\n▶️ Testing: ${tc.name}`);
        const absPath = path.join(__dirname, tc.imagePath);
        if (!fs.existsSync(absPath)) {
            console.error(`❌ Image file missing: ${absPath}`);
            failed++;
            continue;
        }

        const img = await loadImage(absPath);
        const uploadedImg = window.document.getElementById("uploaded-image");
        uploadedImg.style.display = "block";
        uploadedImg.dataset.filename = path.basename(tc.imagePath);
        uploadedImg.naturalWidth = img.width;
        uploadedImg.naturalHeight = img.height;
        uploadedImg.width = img.width;
        uploadedImg.height = img.height;

        // Custom draw into tempCtx
        const fruitSelect = window.document.getElementById("fruit-select");
        fruitSelect.value = tc.fruit;

        // Run local analyze
        const scanBtn = window.document.getElementById("scan-btn");
        // Trigger local scan
        const res = window.document.getElementById("res-value");
        const shelf = window.document.getElementById("res-shelf");
        const badge = window.document.getElementById("single-condition-badge");
        const bunchContainer = window.document.getElementById("bunch-breakdown-container");
        const bunchCount = window.document.getElementById("bunch-count");

        // Execute scan
        scanBtn.click();
        await new Promise(r => setTimeout(r, 650));

        const resText = res.innerText;
        const badgeText = badge ? badge.innerText : "";
        const isBunchVisible = bunchContainer && bunchContainer.style.display !== "none";
        const countText = bunchCount ? bunchCount.innerText : "";

        console.log(`   Result: ${resText} | Shelf: ${shelf.innerText}`);
        console.log(`   Badge: ${badgeText}`);
        if (isBunchVisible) {
            console.log(`   Batch: ${countText}`);
        }

        let ok = true;
        if (tc.expectedBunch !== undefined) {
            if (tc.expectedBunch && !isBunchVisible) {
                console.error(`   ❌ Expected bunch/group, but got single item`);
                ok = false;
            } else if (!tc.expectedBunch && isBunchVisible) {
                console.error(`   ❌ Expected single item (1 fruit), but got batch/cluster: ${countText}`);
                ok = false;
            }
        }
        if (tc.expectedCount !== undefined) {
            if (tc.expectedBunch && countText !== `${tc.expectedCount} Items`) {
                console.error(`   ❌ Expected ${tc.expectedCount} items, got: ${countText}`);
                ok = false;
            }
        }
        if (tc.expectedMinCount !== undefined) {
            const countNum = parseInt(countText) || 0;
            if (countNum < tc.expectedMinCount) {
                console.error(`   ❌ Expected at least ${tc.expectedMinCount} items, got: ${countText}`);
                ok = false;
            }
        }

        if (ok) {
            console.log(`   ✅ PASSED`);
            passed++;
        } else {
            console.log(`   ❌ FAILED`);
            failed++;
        }
    }

    console.log("\n▶️ Testing Dual Definition Toggle (🔬 Scientific vs ⚡ Simple)");
    const toggleBtn = window.document.getElementById("toggle-def-mode");
    const descEl = window.document.getElementById("res-desc");
    
    // In scientific mode:
    const sciHtml = descEl.innerHTML;
    const hasSciTags = sciHtml.includes("Indicators:") && sciHtml.includes("Biochemical Rationale:");
    console.log(`   Scientific Mode renders rich indicators: ${hasSciTags ? "✅ YES" : "❌ NO"}`);

    // Toggle to simple mode:
    toggleBtn.click();
    const simpleText = descEl.innerText;
    const isSimple = !simpleText.includes("Indicators:") && simpleText.length > 5;
    console.log(`   Simple Mode renders compact text: ${isSimple ? "✅ YES (" + simpleText + ")" : "❌ NO"}`);

    if (hasSciTags && isSimple) {
        console.log("   ✅ Definition Toggle: PASSED");
        passed++;
    } else {
        console.log("   ❌ Definition Toggle: FAILED");
        failed++;
    }

    console.log("\n==================================================");
    console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================");
    if (failed > 0) process.exit(1);
}

runTests().catch(err => {
    console.error("Test execution error:", err);
    process.exit(1);
});
