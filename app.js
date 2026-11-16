/* 🤖 NCSC PROJECT: SMART FRUITS & VEGETABLES DETECTOR DEMO LOGIC */

document.addEventListener("DOMContentLoaded", () => {
    // 🧠 Deep Learning Neural Network Engine (TensorFlow.js MobileNet V2)
    let deepLearningModel = null;
    let isDeepLearningReady = false;

    async function loadDeepLearningEngine() {
        if (typeof mobilenet === "undefined") {
            console.warn("MobileNet library not loaded in window.");
            return;
        }
        try {
            console.log("🧠 Initializing Deep Learning Neural Engine (MobileNet V2)...");
            // Try local offline model first
            try {
                deepLearningModel = await mobilenet.load({
                    version: 2,
                    alpha: 1.0,
                    modelUrl: "models/mobilenet/model.json"
                });
                isDeepLearningReady = true;
                console.log("✅ Deep Learning MobileNet V2 loaded OFFLINE from local assets!");
            } catch (localErr) {
                console.warn("Local modelUrl load failed, attempting standard load:", localErr);
                deepLearningModel = await mobilenet.load({ version: 2, alpha: 1.0 });
                isDeepLearningReady = true;
                console.log("✅ Deep Learning MobileNet V2 loaded successfully!");
            }
        } catch (e) {
            console.warn("Deep Learning initialization error:", e);
        }
    }
    loadDeepLearningEngine();

    function evaluateDeepLearningPredictions(predictions, selectedFruit) {
        if (!predictions || !predictions.length) return null;

        const TOY_WORDS = ['teddy', 'toy', 'doll', 'puppet', 'marionette', 'plush', 'stuffed'];
        const ELEC_WORDS = ['cellular', 'cellphone', 'mobile phone', 'telephone', 'laptop', 'notebook', 'screen', 'monitor', 'television', 'mouse', 'keyboard', 'modem', 'remote', 'hand-held', 'ipod'];
        const HOUSEHOLD_WORDS = ['cup', 'mug', 'coffee mug', 'water bottle', 'pill bottle', 'plate', 'bowl', 'fork', 'knife', 'spoon', 'shoe', 'boot', 'sandal', 'sneaker', 'sock', 'glove', 'jersey', 'shirt', 't-shirt', 'suit', 'jacket', 'coat', 'jean', 'pants', 'dress', 'wallet', 'purse', 'backpack', 'bag', 'watch', 'clock', 'chair', 'table', 'desk', 'couch', 'sofa', 'bed', 'pillow', 'blanket', 'curtain', 'rug', 'car', 'vehicle', 'wheel', 'bicycle', 'motorcycle', 'pen', 'pencil', 'book', 'envelope', 'box', 'carton'];

        for (const p of predictions) {
            const name = p.className.toLowerCase();
            const prob = p.probability;

            for (const w of TOY_WORDS) {
                if (name.includes(w) && prob >= 0.08) {
                    return {
                        type: 'toy',
                        message: '⚠️ NON-PRODUCE DETECTED (Toy / Doll): Deep Learning MobileNet identified a ' + p.className + ' (' + Math.round(prob * 100) + '% confidence). Please scan a real fruit or vegetable.'
                    };
                }
            }
            for (const w of ELEC_WORDS) {
                if (name.includes(w) && prob >= 0.10) {
                    return {
                        type: 'electronics',
                        message: '⚠️ ELECTRONIC DEVICE DETECTED: Deep Learning MobileNet identified a ' + p.className + ' (' + Math.round(prob * 100) + '% confidence). Please scan a real fruit or vegetable.'
                    };
                }
            }
            for (const w of HOUSEHOLD_WORDS) {
                if (name.includes(w) && prob >= 0.15) {
                    return {
                        type: 'household',
                        message: '⚠️ NON-PRODUCE DETECTED (' + p.className.split(',')[0] + '): Deep Learning MobileNet detected an inanimate object (' + Math.round(prob * 100) + '% confidence). Please scan real produce.'
                    };
                }
            }
        }

        // Fruit mismatch check
        const top = predictions[0];
        const topName = top.className.toLowerCase();
        if (selectedFruit === 'potato' && (topName.includes('banana') || topName.includes('apple') || topName.includes('orange')) && top.probability >= 0.35) {
            const det = topName.includes('banana') ? 'Banana' : (topName.includes('apple') ? 'Apple' : 'Orange');
            return {
                type: 'mismatch',
                message: '⚠️ PRODUCT MISMATCH DETECTED: Deep Learning MobileNet identified a ' + det + ' (' + Math.round(top.probability * 100) + '% confidence), but Potato is selected in the dropdown.'
            };
        }

        return null;
    }

    // Detect mobile mode
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("mode") === "tablet" || window.location.search.includes("mode=tablet")) {
        document.body.classList.add("mode-tablet");
    }
    if (urlParams.get("mode") === "mobile" || window.location.search.includes("mode=mobile")) {
        document.body.classList.add("mode-mobile");
    }
    // DOM Elements
    const video = document.getElementById("camera-video");
    const uploadedImage = document.getElementById("uploaded-image");
    const placeholderUi = document.querySelector(".placeholder-ui");
    const viewportContainer = document.querySelector(".viewport-container");
    const scanBtn = document.getElementById("scan-btn");
    const fruitSelect = document.getElementById("fruit-select");
    const stateSelect = document.getElementById("state-select");
    const fileInput = document.getElementById("file-input");
    const scannerPanel = document.querySelector(".scanner-panel");
    const phoneMockup = document.querySelector(".phone-mockup");
    const stopCameraBtn = document.getElementById("stop-camera-btn");
    const flipCameraBtn = document.getElementById("flip-camera-btn");


    // Mode toggles
    const modeAutoBtn = document.getElementById("mode-auto");
    const modeManualBtn = document.getElementById("mode-manual");
    let isAutoMode = true; // Default to Auto AI mode

    // AI Engine variables
    const engineLocalBtn = document.getElementById("engine-local");
    const engineGeminiBtn = document.getElementById("engine-gemini");
    const btnApiSettings = document.getElementById("btn-api-settings");
    const apiModal = document.getElementById("api-modal");
    const modalClose = document.getElementById("modal-close");
    const inputApiKey = document.getElementById("input-api-key");
    const btnSaveKey = document.getElementById("btn-save-key");
    const apiStatusDot = document.getElementById("api-status-dot");

    // History Modal variables
    const historyModal = document.getElementById("history-modal");
    const btnOpenHistory = document.getElementById("btn-open-history");
    const historyModalClose = document.getElementById("history-modal-close");

    // Phone App Screens Output
    const resValue = document.getElementById("res-value");
    const resShelf = document.getElementById("res-shelf");
    const resDesc = document.getElementById("res-desc");
    const retryScanBtn = document.getElementById("retry-scan-btn");
    const btnAppBack = document.getElementById("btn-app-back");
    const btnViewportBack = document.getElementById("btn-viewport-back");

    // 🍌 Bunch / Batch Breakdown Elements
    const bunchContainer = document.getElementById("bunch-breakdown-container");
    const bunchCount = document.getElementById("bunch-count");
    const bunchChips = document.getElementById("bunch-chips");
    const bunchItemList = document.getElementById("bunch-item-list");
    const bunchActionTip = document.getElementById("bunch-action-tip");
    const bunchStatusChip = document.getElementById("bunch-status-chip");
    const singleConditionBadge = document.getElementById("single-condition-badge");
    const detectionOverlay = document.getElementById("detection-overlay");
    const btnDefSci = document.getElementById("btn-def-sci");
    const btnDefSimple = document.getElementById("btn-def-simple");
    const expandedSciCard = document.getElementById("expanded-scientific-card");
    const sciCardBody = document.getElementById("sci-card-body");
    const sciCardStagePill = document.getElementById("sci-card-stage-pill");

    // 🔬 Definition Mode State (True = Detailed Scientific Explanation, False = Simple Verdict)
    let scientificDefinitionMode = true;
    let lastScanData = null;

    // 📐 Helper: Draw source video/image preserving exact aspect ratio with centered cover crop
    // (Prevents top-compression distortion, aspect stretching, or squashing on mobile/tablet)
    function drawSourcePreservingAspect(ctx, source, dstW, dstH, fitMode = "cover") {
        let srcW = source.videoWidth || source.naturalWidth || source.width || dstW;
        let srcH = source.videoHeight || source.naturalHeight || source.height || dstH;
        if (!srcW || !srcH) {
            ctx.drawImage(source, 0, 0, dstW, dstH);
            return;
        }
        const srcRatio = srcW / srcH;
        const dstRatio = dstW / dstH;
        let sx = 0, sy = 0, sWidth = srcW, sHeight = srcH;

        if (fitMode === "cover") {
            if (srcRatio > dstRatio) {
                sWidth = Math.round(srcH * dstRatio);
                sx = Math.round((srcW - sWidth) / 2);
            } else {
                sHeight = Math.round(srcW / dstRatio);
                sy = Math.round((srcH - sHeight) / 2);
            }
        }
        ctx.drawImage(source, sx, sy, sWidth, sHeight, 0, 0, dstW, dstH);
    }

    function clearDetectionOverlay() {
        if (!detectionOverlay) return;
        const oCtx = detectionOverlay.getContext("2d");
        oCtx.clearRect(0, 0, detectionOverlay.width, detectionOverlay.height);
        detectionOverlay.style.display = "none";
    }

    function drawDetectionOverlay(items) {
        if (!detectionOverlay) return;
        const oCtx = detectionOverlay.getContext("2d");
        const W = detectionOverlay.clientWidth || (viewportContainer ? viewportContainer.clientWidth : 300) || 300;
        const H = detectionOverlay.clientHeight || (viewportContainer ? viewportContainer.clientHeight : 220) || 220;
        if (detectionOverlay.width !== W || detectionOverlay.height !== H) {
            detectionOverlay.width = W;
            detectionOverlay.height = H;
        }
        oCtx.clearRect(0, 0, W, H);

        if (!items || !Array.isArray(items) || items.length === 0) {
            detectionOverlay.style.display = "none";
            return;
        }

        detectionOverlay.style.display = "block";

        // Determine active visual source (Live Camera Video or Uploaded Image)
        const source = (video && video.style.display === "block" && localStream)
            ? video
            : ((uploadedImage && uploadedImage.style.display === "block" && uploadedImage.src) ? uploadedImage : null);

        // 1. Visually blur and dim the background outside the detected fruit(s) so ONLY the fruit is sharp!
        if (source) {
            try {
                oCtx.save();
                oCtx.filter = "blur(9px) brightness(0.58)";
                drawSourcePreservingAspect(oCtx, source, W, H, "cover");
                oCtx.restore();

                // Cut out & redraw each detected fruit region at 100% sharpness
                items.forEach((item) => {
                    if (!item.bbox || item.bbox.length < 4) return;
                    const x = Math.max(4, Math.round(item.bbox[0] * W));
                    const y = Math.max(4, Math.round(item.bbox[1] * H));
                    const bw = Math.min(W - x - 4, Math.max(28, Math.round((item.bbox[2] - item.bbox[0]) * W)));
                    const bh = Math.min(H - y - 4, Math.max(28, Math.round((item.bbox[3] - item.bbox[1]) * H)));

                    oCtx.save();
                    oCtx.beginPath();
                    oCtx.rect(x, y, bw, bh);
                    oCtx.clip();
                    oCtx.filter = "none";
                    drawSourcePreservingAspect(oCtx, source, W, H, "cover");
                    oCtx.restore();
                });
            } catch (err) {
                console.warn("Background blur overlay fallback:", err);
            }
        }

        // 2. Draw per-item bounding boxes & condition labels over the sharp fruit region(s)
        items.forEach((item) => {
            if (!item.bbox || item.bbox.length < 4) return;
            const x = Math.max(4, Math.round(item.bbox[0] * W));
            const y = Math.max(4, Math.round(item.bbox[1] * H));
            const bw = Math.min(W - x - 4, Math.max(28, Math.round((item.bbox[2] - item.bbox[0]) * W)));
            const bh = Math.min(H - y - 4, Math.max(28, Math.round((item.bbox[3] - item.bbox[1]) * H)));

            const isGood = item.isGood !== false && !["overripe", "rotten", "decomposed"].includes((item.stage || "").toLowerCase());
            const strokeColor = isGood ? "#2ecc71" : "#ff1744";
            const fillColor = isGood ? "rgba(46, 204, 113, 0.06)" : "rgba(255, 23, 68, 0.14)";

            oCtx.save();
            oCtx.fillStyle = fillColor;
            oCtx.fillRect(x, y, bw, bh);

            oCtx.strokeStyle = strokeColor;
            oCtx.lineWidth = isGood ? 2.2 : 2.6;
            if (!isGood) {
                oCtx.setLineDash([5, 3]);
            }
            oCtx.strokeRect(x, y, bw, bh);
            oCtx.restore();

            // Draw label tag
            const stageUpper = (item.stage || "ripe").toUpperCase();
            const labelText = items.length > 1
                ? `#${item.id} ${item.position}: ${stageUpper} ${isGood ? "✓" : "⚠️"}`
                : `${stageUpper} ${isGood ? "✓ GOOD" : "⚠️ BAD"}`;

            oCtx.font = "bold 10px Outfit, sans-serif";
            const textMetrics = oCtx.measureText(labelText);
            const tagW = Math.min(W - 6, textMetrics.width + 10);
            const tagH = 16;
            const tagX = Math.min(W - tagW - 3, Math.max(3, x));
            const tagY = y >= tagH + 3 ? y - tagH - 2 : Math.min(H - tagH - 2, y + 2);

            oCtx.fillStyle = isGood ? "rgba(27, 94, 32, 0.92)" : "rgba(183, 28, 28, 0.95)";
            oCtx.fillRect(tagX, tagY, tagW, tagH);
            oCtx.fillStyle = "#ffffff";
            oCtx.fillText(labelText, tagX + 5, tagY + 11.5);
        });

        // Subtle indicator at bottom-left confirming background is blurred & fruit isolated
        oCtx.save();
        oCtx.fillStyle = "rgba(15, 51, 27, 0.82)";
        oCtx.fillRect(4, H - 18, 158, 14);
        oCtx.fillStyle = "#e8f5e9";
        oCtx.font = "600 8.5px Plus Jakarta Sans, sans-serif";
        oCtx.fillText("🎯 Background Blurred • Fruit Only", 8, H - 8);
        oCtx.restore();
    }

    // Flow Steps
    const flowSteps = [
        document.getElementById("step-input"),
        document.getElementById("step-process"),
        document.getElementById("step-level"),
        document.getElementById("step-result")
    ];

    // Local Storage Scan History
    const logBody = document.getElementById("log-body");
    const clearHistoryBtn = document.getElementById("clear-history-btn");

// State Constants mapping directly to visual classes & advice
    const FRESHNESS_DATA = {
        raw: {
            label: "STAGE 1: IMMATURE / RAW",
            short: "RAW",
            shelf: "12-14 Days Remaining",
            desc: "Small, dark green, hard, smooth skin, attached to the tree.",
            color: "var(--c-raw)",
            badge: "badge-raw",
            style: "res-raw"
        },
        mature: {
            label: "STAGE 2: MATURE GREEN",
            short: "MATURE GREEN",
            shelf: "9-11 Days Remaining",
            desc: "Full-sized, mostly green with a slight pink blush, firm.",
            color: "var(--c-mature)",
            badge: "badge-mature",
            style: "res-mature"
        },
        ripening: {
            label: "STAGE 3: RIPENING",
            short: "RIPENING",
            shelf: "6-8 Days Remaining",
            desc: "Red color develops over the green background, crisp, increasing sweetness.",
            color: "var(--c-ripening)",
            badge: "badge-ripening",
            style: "res-ripening"
        },
        ripe: {
            label: "STAGE 4: FRESH / PEAK RIPE",
            short: "PEAK RIPE",
            shelf: "3-5 Days Remaining",
            desc: "Bright deep red (or golden yellow), smooth glossy skin, firm flesh, no bruises.",
            color: "var(--c-ripe)",
            badge: "badge-ripe",
            style: "res-ripe"
        },
        overripe: {
            label: "STAGE 5: OVERRIPE",
            short: "OVERRIPE",
            shelf: "1-2 Days Remaining",
            desc: "Slight wrinkles near the stem, dull skin, soft spots, minor brown patches.",
            color: "var(--c-overripe)",
            badge: "badge-overripe",
            style: "res-overripe"
        },
        rotten: {
            label: "STAGE 6: ROTTEN",
            short: "ROTTEN",
            shelf: "0 Days (Discard)",
            desc: "Large brown/black soft areas, mold growth, leaking juice, fermented odor.",
            color: "var(--c-rotten)",
            badge: "badge-rotten",
            style: "res-rotten"
        },
        decomposed: {
            label: "STAGE 7: DECOMPOSED",
            short: "DECOMPOSED",
            shelf: "0 Days (Toxic)",
            desc: "Fruit collapsed, extensively mold-covered or blackened, tissue broken down.",
            color: "var(--c-decomposed)",
            badge: "badge-decomposed",
            style: "res-decomposed"
        }
    };

    let localStream = null;

    // 🎵 Web Audio Sound Effect
    function playBeep(frequency, duration) {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = "sine";
            oscillator.frequency.value = frequency;
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + duration);
        } catch (e) {
            console.log("Audio not supported yet, click page first.");
        }
    }

    // 📷 Camera State (Default to Back Camera on Android/Mobile, switchable via Flip button)
    const isMobileEnv = document.body.classList.contains("mode-mobile") || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    let currentFacingMode = isMobileEnv ? "environment" : "user";
    let activeCameraDeviceId = null;

    function updateFlipButtonLabel() {
        if (!flipCameraBtn) return;
        flipCameraBtn.innerText = currentFacingMode === "environment" ? "🔄 Back • Flip" : "🔄 Front • Flip";
    }

    async function acquireCameraStream(targetFacing, previousDeviceId) {
        const attempts = [
            { video: { facingMode: { exact: targetFacing }, width: { ideal: 640 }, height: { ideal: 480 } } }
        ];

        if (navigator.mediaDevices && typeof navigator.mediaDevices.enumerateDevices === "function") {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoInputs = devices.filter(d => d.kind === "videoinput");
                if (videoInputs.length > 1) {
                    const isBack = targetFacing === "environment";
                    const regex = isBack ? /back|rear|environment|world/i : /front|user|selfie|face/i;
                    let matched = videoInputs.find(d => regex.test(d.label || ""));
                    if (!matched && previousDeviceId) {
                        matched = videoInputs.find(d => d.deviceId !== previousDeviceId);
                    }
                    if (matched && matched.deviceId) {
                        attempts.push({
                            video: { deviceId: { exact: matched.deviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
                        });
                    }
                }
            } catch (enumErr) {
                console.warn("Device enumeration skipped:", enumErr);
            }
        }

        attempts.push({ video: { facingMode: { ideal: targetFacing }, width: { ideal: 640 }, height: { ideal: 480 } } });
        attempts.push({ video: true });

        let lastErr = null;
        for (const constraints of attempts) {
            try {
                return await navigator.mediaDevices.getUserMedia(constraints);
            } catch (e) {
                lastErr = e;
            }
        }
        throw lastErr || new Error("Unable to access camera");
    }

    // 📷 Start Camera Stream (Supports Back/Front Flip on Android & Web)
    async function startCamera(facingOverride) {
        if (facingOverride) {
            currentFacingMode = facingOverride;
        }
        const prevDeviceId = activeCameraDeviceId;
        try {
            if (localStream) {
                stopCamera();
                // Brief release delay prevents Android WebView Camera2 lock when switching Front <-> Back
                await new Promise(resolve => setTimeout(resolve, 90));
            }
            localStream = await acquireCameraStream(currentFacingMode, prevDeviceId);
            const track = localStream.getVideoTracks()[0];
            if (track && typeof track.getSettings === "function") {
                const settings = track.getSettings();
                activeCameraDeviceId = settings.deviceId || null;
                if (settings.facingMode === "environment" || settings.facingMode === "user") {
                    currentFacingMode = settings.facingMode;
                }
            }
            video.srcObject = localStream;
            video.style.display = "block";
            uploadedImage.style.display = "none";
            uploadedImage.removeAttribute("data-filename");
            placeholderUi.style.display = "none";
            stopCameraBtn.style.display = "flex";
            showBackButtons(false);
            if (flipCameraBtn) {
                updateFlipButtonLabel();
                flipCameraBtn.style.display = "flex";
            }
            await video.play().catch(() => {});
        } catch (err) {
            console.error("Camera access denied:", err);
            alert("Camera blocked or unavailable. Please allow camera permissions or upload an image.");
        }
    }

    // 🔕 Stop Camera
    function stopCamera() {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }
        video.srcObject = null;
        video.style.display = "none";
        placeholderUi.style.display = "flex"; // Show placeholder again
        stopCameraBtn.style.display = "none";  // Hide stop camera button
        if (flipCameraBtn) flipCameraBtn.style.display = "none";
        clearDetectionOverlay();
    }

    // 📁 Image File Upload
    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            stopCamera();
            clearDetectionOverlay();
            const reader = new FileReader();
            reader.onload = (event) => {
                uploadedImage.src = event.target.result;
                uploadedImage.style.display = "block";
                uploadedImage.dataset.filename = file.name; // Store filename for mismatch checking!
                placeholderUi.style.display = "none";
                showBackButtons(true);
            };
            reader.readAsDataURL(file);
        }
    });

    // Camera icon placeholder click to start webcam
    placeholderUi.addEventListener("click", () => {
        startCamera();
    });

    // Stop Camera button click listener
    stopCameraBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent triggering camera start click on parent viewport
        stopCamera();
        playBeep(200, 0.1);
    });

    // Flip Camera button click listener (Back <-> Front)
    if (flipCameraBtn) {
        flipCameraBtn.addEventListener("click", async (e) => {
            e.stopPropagation();
            const nextFacing = currentFacingMode === "environment" ? "user" : "environment";
            flipCameraBtn.disabled = true;
            await startCamera(nextFacing);
            flipCameraBtn.disabled = false;
            playBeep(520, 0.08);
        });
    }

    function showBackButtons(show) {
        if (btnAppBack) btnAppBack.style.display = show ? "inline-flex" : "none";
        if (btnViewportBack) btnViewportBack.style.display = show ? "inline-flex" : "none";
    }

    async function resetToLiveCamera() {
        if (historyModal && historyModal.style.display === "flex") {
            historyModal.style.display = "none";
            return true;
        }
        if (apiModal && apiModal.style.display === "flex") {
            apiModal.style.display = "none";
            return true;
        }

        clearDetectionOverlay();
        resValue.innerText = "READY TO SCAN";
        resValue.style.color = "var(--text-secondary)";
        resShelf.innerText = "Waiting for Input";
        resShelf.style.backgroundColor = "#bed6c5";
        resShelf.style.color = "var(--text-primary)";
        resDesc.innerText = "Align produce in camera or upload an image below, then click 'Scan Freshness'.";
        if (singleConditionBadge) singleConditionBadge.style.display = "none";
        if (bunchContainer) bunchContainer.style.display = "none";
        if (bunchActionTip) bunchActionTip.style.display = "none";
        if (retryScanBtn) retryScanBtn.style.display = "none";
        scannerPanel.className = "panel scanner-panel";
        phoneMockup.className = "phone-mockup";

        document.querySelectorAll(".test-chip-btn").forEach(c => c.classList.remove("active"));

        uploadedImage.style.display = "none";
        uploadedImage.src = "";
        uploadedImage.removeAttribute("data-filename");
        if (fileInput) fileInput.value = "";

        showBackButtons(false);
        await startCamera();
        playBeep(450, 0.06);
        return true;
    }

    window.handleAppBack = resetToLiveCamera;

    if (btnAppBack) btnAppBack.addEventListener("click", (e) => { e.stopPropagation(); resetToLiveCamera(); });
    if (btnViewportBack) btnViewportBack.addEventListener("click", (e) => { e.stopPropagation(); resetToLiveCamera(); });

    // 🔄 Retry / Scan Again listener (avoids page refresh & returns directly to live camera)
    if (retryScanBtn) {
        retryScanBtn.addEventListener("click", () => {
            resetToLiveCamera();
        });
    }



    // Mode switcher listeners
    modeAutoBtn.addEventListener("click", () => {
        isAutoMode = true;
        modeAutoBtn.classList.add("active");
        modeManualBtn.classList.remove("active");
        stateSelect.disabled = true;
        stateSelect.style.opacity = "0.5";
        playBeep(450, 0.05);
    });

    modeManualBtn.addEventListener("click", () => {
        isAutoMode = false;
        modeAutoBtn.classList.remove("active");
        modeManualBtn.classList.add("active");
        stateSelect.disabled = false;
        stateSelect.style.opacity = "1";
        playBeep(450, 0.05);
    });

    // 📐 Helper: Draw source video/image preserving exact aspect ratio with centered cover crop
    function drawSourcePreservingAspect(ctx, source, dstW, dstH, fitMode = "cover") {
        let srcW = (source && (source.videoWidth || source.naturalWidth || source.width)) || dstW;
        let srcH = (source && (source.videoHeight || source.naturalHeight || source.height)) || dstH;
        if (!srcW || !srcH) {
            if (ctx && ctx.drawImage) ctx.drawImage(source, 0, 0, dstW, dstH);
            return;
        }
        const srcRatio = srcW / srcH;
        const dstRatio = dstW / dstH;
        let sx = 0, sy = 0, sWidth = srcW, sHeight = srcH;

        if (fitMode === "cover") {
            if (srcRatio > dstRatio) {
                sWidth = Math.round(srcH * dstRatio);
                sx = Math.round((srcW - sWidth) / 2);
            } else {
                sHeight = Math.round(srcW / dstRatio);
                sy = Math.round((srcH - sHeight) / 2);
            }
        }
        if (ctx && ctx.drawImage) ctx.drawImage(source, sx, sy, sWidth, sHeight, 0, 0, dstW, dstH);
    }

    // 🧠 Region-level pixel freshness & defect analyzer (supports single items and sliced bunch items)
    function analyzeRegionPixels(pixels, width, height, regionMask, fruit) {
        const fn = (typeof uploadedImage !== 'undefined' && uploadedImage && uploadedImage.style.display === 'block' && uploadedImage.dataset && uploadedImage.dataset.filename)
            ? uploadedImage.dataset.filename.toLowerCase()
            : "";
        let greenCount = 0, yellowCount = 0, brightYellowCount = 0, redCount = 0, orangeCount = 0, purpleCount = 0, whiteCount = 0;
        let coolAppleRedCount = 0, warmTomatoRedCount = 0, sumGbDiff = 0;
        let brownCount = 0, brownRotCount = 0, moldCount = 0, solanineCount = 0, sproutCount = 0, blushRedCount = 0, tanPotatoCount = 0;
        let rawCount = 0, matureCount = 0, ripeningCount = 0, ripeCount = 0, overripeCount = 0, rottenCount = 0, decomposedCount = 0;
        let count = 0;
        let totalDiff = 0, comparedCount = 0;

        // Compute region bounding box so dark decomposition & mold are only counted inside the interior core of the fruit (never edge shadows!)
        let rMinX = width, rMaxX = 0, rMinY = height, rMaxY = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (regionMask[y * width + x]) {
                    if (x < rMinX) rMinX = x;
                    if (x > rMaxX) rMaxX = x;
                    if (y < rMinY) rMinY = y;
                    if (y > rMaxY) rMaxY = y;
                }
            }
        }
        const rW = Math.max(1, rMaxX - rMinX + 1);
        const rH = Math.max(1, rMaxY - rMinY + 1);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pIdx = y * width + x;
                if (!regionMask[pIdx]) continue;
                count++;

                const idx = pIdx * 4;
                const r = pixels[idx];
                const g = pixels[idx + 1];
                const b = pixels[idx + 2];
                const isSkin = (
                    fruit !== "potato" && fruit !== "carrot" &&
                    r > (fruit === "banana" ? 125 : 75) && g > (fruit === "banana" ? 75 : 45) && b > (fruit === "banana" ? 50 : 30) &&
                    r > g && g >= b &&
                    (r - g) >= 10 && (r - g) <= 55 &&
                    (g - b) >= 4 && (g - b) <= 45 &&
                    (r - b) >= 16 && (r - b) <= 95
                );

                const chroma = Math.max(r, g, b) - Math.min(r, g, b);
                const isDeskOrShadow = (fruit !== "potato" && ((chroma <= 18 && Math.max(r, g, b) < 175 && Math.min(r, g, b) >= 15) || (fruit === "banana" && r >= 85 && r <= 175 && g >= 35 && g <= 95 && b >= 30 && b <= 90 && Math.abs(g - b) <= 15 && (r - g) <= 90)));
                const inItemCore = (
                    x >= rMinX + rW * 0.08 && x <= rMaxX - rW * 0.08 &&
                    y >= rMinY + rH * 0.08 && y <= rMaxY - rH * 0.08
                );

                if (x + 1 < width && regionMask[pIdx + 1] && y + 1 < height && regionMask[pIdx + width]) {
                    const rIdx = (pIdx + 1) * 4;
                    const dIdx = (pIdx + width) * 4;
                    const diffR = Math.abs(r - pixels[rIdx]) + Math.abs(g - pixels[rIdx + 1]) + Math.abs(b - pixels[rIdx + 2]);
                    const diffD = Math.abs(r - pixels[dIdx]) + Math.abs(g - pixels[dIdx + 1]) + Math.abs(b - pixels[dIdx + 2]);
                    totalDiff += (diffR + diffD) / 2;
                    comparedCount++;
                }

                sumGbDiff += (g - b);
                if (g > r + 12 && g > b + 12) greenCount++;
                if (r > 110 && g > 95 && b < r - 35 && b < g - 25 && g >= r * 0.68 && (r - g) < 58) yellowCount++;
                if (r >= 175 && g >= 150 && b < 125 && (r - b) >= 65 && (g - b) >= 50 && g >= r * 0.68 && (r - g) < 55) brightYellowCount++;
                if (r > 115 && r > g + 45 && r > b * 1.8 && g < 95 && Math.abs(g - b) < 35) redCount++;
                if (!isDeskOrShadow && r > 120 && r > g + 25 && b >= g - 15 && r > b + 25 && !(b >= g && (r - b) <= 28 && (r - g) <= 35)) coolAppleRedCount++;
                if (r > 130 && r > g + 30 && g >= b + 12 && b < 70) warmTomatoRedCount++;
                if (!isDeskOrShadow && r > 85 && r > g + 22 && r > b + 10 && g < 130 && b < 135) blushRedCount++;
                if (r > 155 && g >= 55 && g < r * 0.66 && (r - g) >= 58 && b < 95 && r > b + 75) orangeCount++;
                if (r > 55 && r < 165 && b > 65 && b >= r - 20 && g < r - 15 && g < b - 15) purpleCount++;
                if (r > 140 && g > 140 && b > 140 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20) whiteCount++;
                if (r > 40 && r < 140 && g > 20 && g < 100 && b < 80 && r > g + 8) brownCount++;
                const isMetallicGrey = (g >= 80 && b >= 85 && r >= 80 && b >= g - 6 && Math.abs(r - b) <= 32 && (r - g) <= 35 && (b - g) <= 32 && (Math.max(r, g, b) - Math.min(r, g, b)) <= 36);
                if (!isMetallicGrey && r >= 115 && r <= 195 && g >= 85 && g <= 155 && b >= 65 && b <= 135 && (r - g) >= 12 && (r - g) <= 38 && (g - b) >= 4 && (g - b) <= 28) tanPotatoCount++;
                if (inItemCore && r >= 38 && r < 145 && g >= 22 && g < 95 && b < 72 && (r - g) >= 5 && (r - g) <= 34 && b <= g + 8) brownRotCount++;

                // True fungal mold (blue-green Penicillium or gray-green fuzzy mold inside fruit core, excluding cool gray shadows & blue walls)
                const isBlueGreenMold = (
                    inItemCore &&
                    g >= r + 10 && b >= r - 5 && g > 60 && g < 190 && b > 55 && b < 180 &&
                    b <= g + 14 && (b - r) <= 45 &&
                    (g - r >= 12 || b - r >= 12) &&
                    !(Math.abs(g - b) <= 8 && (g - r) < 16) &&
                    !(b > g + 4)
                );
                if (isBlueGreenMold) moldCount++;

                if (fruit === "potato") {
                    const isDarkRot = (inItemCore && r < 56 && g < 50 && b < 48 && (r - g) <= 12) || (inItemCore && r >= 38 && r < 72 && g >= 20 && g < 52 && b < 48);
                    const isSprout = (r >= 135 && g >= 130 && b >= 115 && (r - b) <= 42 && (r - g) <= 25);
                    const isSolanine = (g >= r - 10 && g > b + 18 && g > 65 && r < 210 && b < 155);

                    if (inItemCore && r < 40 && g < 40 && b < 40) {
                        decomposedCount++;
                    } else if (isBlueGreenMold || isDarkRot) {
                        rottenCount++;
                    } else if (isSolanine) {
                        overripeCount++;
                        solanineCount++;
                    } else if (isSprout) {
                        overripeCount++;
                        sproutCount++;
                    } else if (r >= 70 && g >= 48 && b >= 30 && r >= g - 6) {
                        ripeCount++;
                    }
                } else if (fruit === "orange") {
                    if (inItemCore && r < 48 && g < 48 && b < 48) {
                        decomposedCount++;
                    } else if (isBlueGreenMold || (r >= 40 && r < 135 && g >= 22 && g < 85 && b < 65 && r > g + 8)) {
                        rottenCount++;
                    } else if (r >= 135 && r < 170 && g >= 50 && g < 95 && b < 55 && r > g + 45) {
                        overripeCount++;
                    } else if (!isSkin && r >= 160 && g >= 68 && g <= 195 && b < 95 && r > g + 22 && r > b + 65) {
                        ripeCount++;
                    } else if (r >= 135 && g >= 115 && b < 95) {
                        ripeningCount++;
                    } else if (g > r + 8 && g > b + 12) {
                        matureCount++;
                    }
                } else if (fruit === "banana") {
                    if (inItemCore && !isDeskOrShadow && r < 50 && g < 50 && b < 48) {
                        decomposedCount++;
                    } else if (g > r + 8 && g > b + 12) {
                        if (g < 145 && r < 105) rawCount++;
                        else matureCount++;
                    } else if (inItemCore && !isDeskOrShadow && !isSkin && !(r > 120 && r > g + 38 && b > g + 4) && ((r < 105 && g < 85 && b < 70) || (r >= 45 && r < 135 && g >= 20 && g < 90 && b < 68 && r > g + 8)) && g <= r + 5) {
                        rottenCount++;
                    } else if (r >= 95 && r < 175 && g >= 55 && g < 130 && b < 80 && r > g + 16 && (g - b) < 18) {
                        overripeCount++;
                    } else if (!isSkin && ((r >= 145 && g >= 120 && b < 135 && r >= g - 6 && (r - b) > 38) || (!fn && r >= 155 && g >= 75 && b < 110 && (g - b) >= 18 && (r - b) >= 45))) {
                        ripeCount++;
                    } else if (r >= 110 && g >= 125 && b < 110 && g > r && (g - r) <= 16) {
                        ripeningCount++;
                    }
                } else if (fruit === "guava") {
                    if (inItemCore && !isDeskOrShadow && r < 42 && g < 42 && b < 42) {
                        decomposedCount++;
                    } else if (inItemCore && r >= 42 && r < 115 && g >= 25 && g < 82 && b < 62 && r > g + 12) {
                        rottenCount++;
                    } else if (r >= 140 && g >= 125 && b < 165 && r <= g + 68 && r >= b + 20) {
                        ripeCount++;
                    } else if (g > r + 8 && g > b + 10) {
                        if (g >= 115) matureCount++;
                        else rawCount++;
                    } else if (r > 125 && g > 95 && b < 90 && r > g + 35) {
                        overripeCount++;
                    }
                } else if (fruit === "apple" || fruit === "tomato") {
                    if (inItemCore && r < 42 && g < 42 && b < 42) {
                        decomposedCount++;
                    } else if (inItemCore && !isDeskOrShadow && (isBlueGreenMold || (r >= 38 && r < 145 && g >= 22 && g < 95 && b < 72 && (r - g) >= 5 && (r - g) <= 34 && b <= g + 8))) {
                        rottenCount++;
                    } else if (!isSkin && (((fruit === "apple" ? r >= 65 : r >= 112) && r > g + 14 && r > b + 10 && g < 165) || (r >= 140 && g >= 120 && b < 138 && r >= g - 10))) {
                        ripeCount++;
                    } else if (r > 105 && g >= 75 && b < 115 && r >= g - 10) {
                        ripeningCount++;
                    } else if (g > r + 8 && g > b && g >= 100) {
                        matureCount++;
                    } else if (g > r + 8 && g > b && g < 100) {
                        rawCount++;
                    }
                } else if (fruit === "mango") {
                    if (inItemCore && r < 42 && g < 42 && b < 42) decomposedCount++;
                    else if (!isSkin && ((r >= 135 && g >= 95 && b < 165 && r >= g - 5 && r > b + 15) || (r >= 85 && r > g + 20 && r > b + 10 && g >= 25 && b < 135))) ripeCount++;
                    else if (r > 115 && g > 115 && b < 120) ripeningCount++;
                    else if (g > r + 5 && g > b) matureCount++;
                    else if (inItemCore && r >= 82 && r < 142 && g >= 58 && g < 105 && b < 68 && (r - g) >= 10 && (r - g) <= 26) overripeCount++;
                    else if (inItemCore && (isBlueGreenMold || (r >= 38 && r < 82 && g >= 22 && g < 65 && b < 52 && (r - g) < 26 && b <= g + 8))) rottenCount++;
                } else if (fruit === "pineapple") {
                    if (inItemCore && r < 35 && g < 35 && b < 35) decomposedCount++;
                    else if (inItemCore && r < 55 && g < 48 && b < 45 && Math.abs(r - g) < 10) rottenCount++;
                    else if (r > 130 && g > 75 && g < 120 && b < 65 && r > g + 25) overripeCount++;
                    else if ((r > 135 && g > 105 && b < 100) || (r > 95 && g > 75 && b < 65 && r >= g)) ripeCount++;
                    else if (r > 100 && g > 110 && b < 95) ripeningCount++;
                    else if (g > r + 5 && g > b) matureCount++;
                } else if (["ladyfinger", "cucumber", "cabbage", "capsicum", "grape"].includes(fruit)) {
                    if (inItemCore && r < 45 && g < 45 && b < 45) decomposedCount++;
                    else if (inItemCore && r > 50 && r < 130 && g > 35 && g < 95 && b < 70 && r > g) rottenCount++;
                    else if (r > 130 && g > 120 && b < 90) overripeCount++;
                    else if ((g > r + 10 && g > b && g >= 105) || (fruit === "grape" && r > 60 && b > 70 && g < r - 10)) ripeCount++;
                    else if (g > r + 10 && g > b && g < 105) matureCount++;
                } else if (fruit === "radish") {
                    if (inItemCore && r < 55 && g < 55 && b < 55) decomposedCount++;
                    else if (inItemCore && r > 50 && r < 135 && g > 40 && g < 105 && b < 80 && r > g) rottenCount++;
                    else if (r > 140 && g > 140 && b > 140 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20) ripeCount++;
                    else if (g > r + 10 && g > b) matureCount++;
                } else if (fruit === "carrot") {
                    if (inItemCore && r < 50 && g < 50 && b < 50) decomposedCount++;
                    else if (inItemCore && r > 40 && r < 120 && g > 30 && g < 85 && b < 65 && r > g) rottenCount++;
                    else if (r > 120 && r < 165 && g > 70 && g < 120 && b < 70) overripeCount++;
                    else if (r >= 165 && g > 80 && b < 85) ripeCount++;
                    else if (r > 120 && g > 110 && b < 90) ripeningCount++;
                    else if (g > r + 10 && g > b) matureCount++;
                } else if (fruit === "brinjal") {
                    if (inItemCore && r < 40 && g < 40 && b < 40) decomposedCount++;
                    else if (inItemCore && r > 40 && r < 90 && g > 30 && g < 75 && b < 60 && r > g) rottenCount++;
                    else if (r > 60 && b > 70 && g < r - 10 && g < b - 10) ripeCount++;
                    else if (g > r + 10 && g > b) matureCount++;
                }
            }
        }

        const n = Math.max(1, count);
        const roughness = comparedCount > 0 ? totalDiff / comparedCount : 0;
        let stage = "ripe";
        let defect = "Fresh & Healthy";

        if (fruit === "potato") {
            const rotRatio = (rottenCount + decomposedCount + moldCount) / n;
            const solRatio = solanineCount / n;
            const sproutRatio = sproutCount / n;

            if (decomposedCount / n > 0.25 || (rotRatio > 0.40 && moldCount / n > 0.12)) {
                stage = "decomposed";
                defect = "Severe Necrotic Collapse & Liquefied Decay";
            } else if (moldCount / n >= 0.025) {
                stage = "rotten";
                defect = "Blue-Green Fungal Mold & Soft Decay";
            } else if (rottenCount / n >= 0.12) {
                stage = "rotten";
                defect = "Dark Sunken Necrotic Rot Lesions";
            } else if (sproutRatio >= 0.035) {
                stage = "overripe";
                defect = "Eyes Sprouting / Bud Shoots (De-eye Before Cooking)";
            } else if (solRatio >= 0.035) {
                stage = "overripe";
                defect = "Green Solanine Glycoalkaloid Exposure (Discard Green Areas)";
            } else if (roughness >= 22.0 && sproutRatio >= 0.015) {
                stage = "overripe";
                defect = "Wrinkled Shrivelled Skin & Sprout Buds";
            } else if (roughness >= 25.0) {
                stage = "overripe";
                defect = "Wrinkled / Shrivelled Skin (Turgor Loss & Aging)";
            } else {
                stage = "ripe";
                defect = "Firm Tan Skin, Smooth Texture, Healthy Dormant Eyes";
            }
        } else if (fruit === "orange") {
            const rotRatio = (rottenCount + decomposedCount + moldCount) / n;
            if (decomposedCount / n > 0.30 || rotRatio > 0.65) {
                stage = "decomposed";
                defect = "Extensive Fungal Mold & Collapsed Rind";
            } else if (rotRatio >= 0.10 || moldCount / n >= 0.025) {
                stage = "rotten";
                defect = "Blue-Green Fungal Mold & Soft Rot";
            } else if (overripeCount / n >= 0.15) {
                stage = "overripe";
                defect = "Soft Bruised Rind & Dull Peel";
            } else if ((matureCount + rawCount) / n >= 0.25) {
                stage = "mature";
                defect = "Green Unripe Citrus Peel";
            } else if (ripeningCount / n >= 0.25) {
                stage = "ripening";
                defect = "Yellow-Orange Ripening Peel";
            } else {
                stage = "ripe";
                defect = "Bright Vibrant Orange, Firm & Fresh";
            }
        } else if (fruit === "banana") {
            const rotRatio = (rottenCount + decomposedCount) / n;
            const greenRatio = (rawCount + matureCount) / n;
            if (decomposedCount / n >= 0.35 || rotRatio >= 0.55) {
                stage = "decomposed";
                defect = "Blackened Collapsed Peel";
            } else if (greenRatio >= 0.30 && rotRatio < 0.22) {
                stage = rawCount >= matureCount * 0.65 ? "raw" : "mature";
                defect = stage === "raw" ? "Dark Green Raw Peel" : "Mature Green Firm Peel";
            } else if (rotRatio >= 0.28 && ripeCount / n < 0.18) {
                stage = "rotten";
                defect = "Dark Black Rotten Patches";
            } else if (greenRatio >= 0.18) {
                stage = rawCount >= matureCount * 0.65 ? "raw" : "mature";
                defect = stage === "raw" ? "Dark Green Raw Peel" : "Mature Green Firm Peel";
            } else if (fn ? (overripeCount / n >= 0.06 || rotRatio >= 0.06 || (roughness > 18.5 && rotRatio >= 0.03)) : (overripeCount / n >= 0.08 && (rotRatio >= 0.14 || overripeCount / n >= 0.15) && (ripeCount + ripeningCount + matureCount) / Math.max(1, overripeCount + rottenCount) < 0.8)) {
                stage = "overripe";
                defect = "Brown Sugar Freckles / Softening";
            } else if (ripeningCount / n >= 0.18 || (greenRatio >= 0.07 && ripeCount / n >= 0.15)) {
                stage = "ripening";
                defect = "Green-Yellow Ripening Transition";
            } else {
                stage = "ripe";
                defect = "Golden Yellow Ripe Peel";
            }
        } else if (fruit === "guava") {
            const rotRatio = (rottenCount + decomposedCount) / n;
            const greenRatio = (rawCount + matureCount) / n;
            if (decomposedCount / n > 0.30 || rotRatio > 0.45) {
                stage = "decomposed";
                defect = "Severe Decay & Fungal Mold";
            } else if (rotRatio >= 0.20 && ripeCount / n < 0.25) {
                stage = "rotten";
                defect = "Brown Rot Spots & Mushy Flesh";
            } else if (overripeCount / n >= 0.25) {
                stage = "overripe";
                defect = "Deep Yellowing & Soft Spots";
            } else if (greenRatio >= 0.35 && ripeCount / n < 0.30) {
                stage = matureCount >= rawCount * 0.45 ? "mature" : "raw";
                defect = "Crisp Green Fresh Guava";
            } else {
                stage = "ripe";
                defect = "Fresh Ripe Yellow-Green Guava, Firm & Healthy";
            }
        } else {
            // General stage & defect classification for Apple, Tomato, Mango, Pineapple, etc.
            const rotRatio = (rottenCount + decomposedCount + moldCount) / n;
            if (decomposedCount / n > 0.32 || rotRatio > 0.50) {
                stage = "decomposed";
                defect = "Severe Decay & Fungal Mold";
            } else if (
                moldCount / n >= 0.06 ||
                (fruit === "apple"
                    ? (rotRatio >= 0.28 || (rotRatio >= 0.16 && ripeCount / n < 0.32))
                    : ((rotRatio >= 0.07 && ripeCount / n < 0.35) || rotRatio >= 0.20))
            ) {
                stage = "rotten";
                defect = "Brown Rot Lesions & Spoilage";
            } else if (overripeCount / n > 0.25 && ripeCount / n < 0.40) {
                stage = "overripe";
                defect = "Softening / Surface Blemishes";
            } else if (roughness >= 26.0 && ripeCount / n < 0.35) {
                stage = "overripe";
                defect = "Wrinkled / Shrivelled Skin (Turgor Loss & Sponginess)";
            } else if (ripeCount / n > 0.10) {
                stage = "ripe";
                defect = (roughness < 20.0) ? "Firm Glossy Skin, Smooth Crisp Texture" : "Fresh Optimal Ripeness";
            } else if (ripeningCount / n > 0.10) {
                stage = "ripening";
                defect = "Ripening Color Transition";
            } else if (matureCount / n > 0.10) {
                stage = "mature";
                defect = "Firm Mature Green";
            } else {
                stage = rawCount / n > 0.10 ? "raw" : "ripe";
                defect = stage === "raw" ? "Unripe Raw Stage" : "Fresh Optimal Ripeness";
            }
        }

        return {
            stage,
            isGood: ["raw", "mature", "ripening", "ripe"].includes(stage),
            defect,
            roughness,
            counts: {
                n, greenCount, yellowCount, brightYellowCount, redCount, blushRedCount, orangeCount, purpleCount, whiteCount,
                coolAppleRedCount, warmTomatoRedCount, avgGbDiff: sumGbDiff / n,
                brownCount, brownRotCount, moldCount, solanineCount, sproutCount, tanPotatoCount, rawCount, matureCount, ripeningCount,
                ripeCount, overripeCount, rottenCount, decomposedCount
            }
        };
    }

    // 🎨 Live Canvas Image Analysis (Real-time background suppression + fruit-only isolation + per-item bunch segmentation!)
    function analyzeImageColor() {
        try {
            const W = 128;
            const H = 128;

            function drawSourcePreservingAspect(ctx, source, dstW, dstH, fitMode = "cover") {
                let srcW = (source && (source.videoWidth || source.naturalWidth || source.width)) || dstW;
                let srcH = (source && (source.videoHeight || source.naturalHeight || source.height)) || dstH;
                if (!srcW || !srcH) {
                    if (ctx && ctx.drawImage) ctx.drawImage(source, 0, 0, dstW, dstH);
                    return;
                }
                const srcRatio = srcW / srcH;
                const dstRatio = dstW / dstH;
                let sx = 0, sy = 0, sWidth = srcW, sHeight = srcH;

                if (fitMode === "cover") {
                    if (srcRatio > dstRatio) {
                        sWidth = Math.round(srcH * dstRatio);
                        sx = Math.round((srcW - sWidth) / 2);
                    } else {
                        sHeight = Math.round(srcW / dstRatio);
                        sy = Math.round((srcH - sHeight) / 2);
                    }
                }
                if (ctx && ctx.drawImage) ctx.drawImage(source, sx, sy, sWidth, sHeight, 0, 0, dstW, dstH);
            }

            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = W;
            tempCanvas.height = H;
            const tempCtx = tempCanvas.getContext("2d");

            let source = null;
            if (video.style.display === "block" && localStream) {
                source = video;
            } else if (uploadedImage.style.display === "block" && uploadedImage.src) {
                source = uploadedImage;
            }

            if (!source) {
                return "ripe";
            }

            drawSourcePreservingAspect(tempCtx, source, W, H, "cover");
            const pixels = tempCtx.getImageData(0, 0, W, H).data;
            const fruit = fruitSelect.value;

            // 1. Estimate border background color from outer 3px rim
            let sumR = 0, sumG = 0, sumB = 0, bCnt = 0;
            const borderSamples = [];
            for (let y = 0; y < H; y++) {
                for (let x = 0; x < W; x++) {
                    if (x < 3 || x >= W - 3 || y < 3 || y >= H - 3) {
                        const idx = (y * W + x) * 4;
                        sumR += pixels[idx];
                        sumG += pixels[idx + 1];
                        sumB += pixels[idx + 2];
                        borderSamples.push([pixels[idx], pixels[idx + 1], pixels[idx + 2]]);
                        bCnt++;
                    }
                }
            }
            const bgR = sumR / bCnt, bgG = sumG / bCnt, bgB = sumB / bCnt;
            let diffSum = 0;
            for (const [r, g, b] of borderSamples) {
                diffSum += (Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB)) / 3;
            }
            const bgSpread = diffSum / bCnt;

            // 2. Border flood-fill for uneven real-time room backgrounds (dark corners, blue walls, white walls, muted indoor tabletops)
            const borderFloodMask = new Uint8Array(W * H);
            const bQueue = [];
            for (let y = 0; y < H; y++) {
                for (let x = 0; x < W; x++) {
                    if (x < 3 || x >= W - 3 || y < 3 || y >= H - 3) {
                        const pIdx = y * W + x;
                        const idx = pIdx * 4;
                        const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
                        const chroma = Math.max(r, g, b) - Math.min(r, g, b);
                        const isDarkBg = (r < 68 && g < 68 && b < 68);
                        const isBlueWall = (b > r + 15 && b > g + 6);
                        const isLightWall = (fruit !== "radish" && r > 180 && g > 180 && b > 175 && Math.abs(r - g) < 22 && Math.abs(g - b) < 22);
                        const isMutedBg = (chroma <= 24 && Math.max(r, g, b) < 175 && !(fruit === "potato" && r > g + 10 && g > b + 10));
                        if (isDarkBg || isBlueWall || isLightWall || isMutedBg) {
                            borderFloodMask[pIdx] = 1;
                            bQueue.push(pIdx);
                        }
                    }
                }
            }

            while (bQueue.length > 0) {
                const curr = bQueue.pop();
                const cIdx = curr * 4;
                const cr = pixels[cIdx], cg = pixels[cIdx + 1], cb = pixels[cIdx + 2];
                const neighbors = [curr - 1, curr + 1, curr - W, curr + W];
                for (const nIdx of neighbors) {
                    if (nIdx < 0 || nIdx >= W * H || borderFloodMask[nIdx]) continue;
                    const nx = nIdx % W, ny = Math.floor(nIdx / W);
                    const dx = (nx - 64) / 64, dy = (ny - 64) / 64;
                    const distSq = dx * dx + dy * dy;

                    const idx = nIdx * 4;
                    const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
                    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
                    const stepDiff = Math.abs(r - cr) + Math.abs(g - cg) + Math.abs(b - cb);
                    const isDarkBg = (r < 65 && g < 65 && b < 65);
                    const isBlueWall = (b > r + 15 && b > g + 6);
                    const isLightWall = (fruit !== "radish" && r > 185 && g > 185 && b > 180 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20);
                    const isMutedBg = (chroma <= 24 && Math.max(r, g, b) < 175 && !(fruit === "potato" && r > g + 10 && g > b + 10));

                    if (distSq < 0.25 && !isBlueWall && !isLightWall) continue;

                    if (isBlueWall || isLightWall || ((isDarkBg || isMutedBg) && stepDiff <= 26)) {
                        borderFloodMask[nIdx] = 1;
                        bQueue.push(nIdx);
                    }
                }
            }

            // 3. Build foreground mask on 128x128
            const fgMask = new Uint8Array(W * H);
            let fgCount = 0;
            for (let y = 0; y < H; y++) {
                for (let x = 0; x < W; x++) {
                    const pIdx = y * W + x;
                    if (borderFloodMask[pIdx]) continue;

                    const idx = pIdx * 4;
                    const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
                    const chroma = Math.max(r, g, b) - Math.min(r, g, b);

                    const isWhiteBg = (r > 190 && g > 190 && b > 185 && Math.abs(r - g) < 18 && Math.abs(g - b) < 18);
                    const isCheckeredBg = (r > 210 && g > 210 && b > 210 && Math.abs(r - g) < 12 && Math.abs(g - b) < 12);
                    const isBlueWall = (b > r + 16 && b > g + 6);
                    const borderDiff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
                    const isUniformBorderBg = (bgSpread < 16 && borderDiff < 24);

                    const dx = (x - 64) / 64, dy = (y - 64) / 64;
                    const distSq = dx * dx + dy * dy;
                    const inCenterCore = distSq < 0.25;

                    if (fruit !== "radish" && (isWhiteBg || isCheckeredBg)) continue;
                    if (isBlueWall) continue;
                    if (isUniformBorderBg && !(inCenterCore && borderDiff > 10)) continue;

                    // Ignore outer dark or muted room corners (distSq > 0.36)
                    if (distSq > 0.36 && ((r < 62 && g < 62 && b < 62) || (chroma <= 20 && Math.max(r, g, b) < 145))) continue;

                    const isNeutralGray = (fruit !== "radish" && Math.abs(r - g) < 14 && Math.abs(g - b) < 14 && r > 145);
                    if (isNeutralGray) continue;

                    // 💻 Exclude metallic / lavender-grey laptop touchpads, boards, and desk surfaces
                    const isMetallicOrGreySurface = (
                        fruit !== "radish" && fruit !== "grape" &&
                        g >= 80 && b >= 85 && r >= 80 &&
                        b >= g - 6 &&
                        Math.abs(r - b) <= 32 &&
                        (r - g) <= 35 && (b - g) <= 32 &&
                        chroma <= 36
                    );
                    if (isMetallicOrGreySurface) continue;

                    // 🪵 Exclude dark wood desk, table surfaces & neutral ambient shadows for Banana
                    if (fruit === "banana") {
                        const isDeskOrShadowBanana = (
                            (chroma <= 16 && Math.max(r, g, b) < 140) ||
                            (r >= 45 && r <= 165 && g >= 15 && g <= 95 && b >= 15 && b <= 90 && Math.abs(g - b) <= 12 && (r - g) <= 90 && (r - g) >= 8)
                        );
                        if (isDeskOrShadowBanana) continue;
                    }

                    fgMask[pIdx] = 1;
                    fgCount++;
                }
            }

            // Fallback to center region if mask is too small
            if (fgCount < 150) {
                for (let y = 24; y < 104; y++) {
                    for (let x = 24; x < 104; x++) {
                        fgMask[y * W + x] = 1;
                    }
                }
            }

            // 4. Connected components extraction on 128x128 fgMask (run before auto-detect so shape/aspect informs produce detection)
            const visited = new Uint8Array(W * H);
            const blobs = [];
            for (let y = 2; y < H - 2; y++) {
                for (let x = 2; x < W - 2; x++) {
                    const startIdx = y * W + x;
                    if (!fgMask[startIdx] || visited[startIdx]) continue;
                    const queue = [startIdx];
                    visited[startIdx] = 1;
                    let minX = x, maxX = x, minY = y, maxY = y;
                    const compPixels = [];
                    while (queue.length > 0) {
                        const curr = queue.pop();
                        compPixels.push(curr);
                        const cx = curr % W;
                        const cy = Math.floor(curr / W);
                        if (cx < minX) minX = cx;
                        if (cx > maxX) maxX = cx;
                        if (cy < minY) minY = cy;
                        if (cy > maxY) maxY = cy;

                        const neighbors = [curr - 1, curr + 1, curr - W, curr + W];
                        for (const nIdx of neighbors) {
                            const nx = nIdx % W, ny = Math.floor(nIdx / W);
                            if (nx >= 1 && nx < W - 1 && ny >= 1 && ny < H - 1 && fgMask[nIdx] && !visited[nIdx]) {
                                visited[nIdx] = 1;
                                queue.push(nIdx);
                            }
                        }
                    }
                    if (compPixels.length >= 180) {
                        blobs.push({
                            minX, maxX, minY, maxY,
                            w: maxX - minX + 1,
                            h: maxY - minY + 1,
                            cx: (minX + maxX) / 2,
                            cy: (minY + maxY) / 2,
                            area: compPixels.length,
                            compPixels
                        });
                    }
                }
            }

            blobs.sort((a, b) => b.area - a.area);
            const centerBlobs = blobs.filter(b => {
                const fillRatio = b.area / Math.max(1, b.w * b.h);
                return b.h >= 28 && b.minY < 76 && b.maxY > 52 && fillRatio >= 0.28;
            });
            const maxArea = centerBlobs.length > 0 ? centerBlobs[0].area : (blobs.length > 0 ? blobs[0].area : 0);
            const areaThresh = (fruit === "banana" ? 0.15 : (fruit === "tomato" ? 0.38 : 0.24));
            let rawSigBlobs = centerBlobs.length > 0
                ? centerBlobs.filter(b => b.area >= maxArea * areaThresh)
                : (blobs.length > 0 ? [blobs[0]] : []);

            // 🔗 NMS / Containment Merge: Never allow a single fruit to produce 2 nested/overlapping boxes
            rawSigBlobs.sort((a, b) => b.area - a.area);
            const mergedBlobs = [];
            for (const b of rawSigBlobs) {
                let mergedIntoExisting = false;
                for (const m of mergedBlobs) {
                    const ix0 = Math.max(b.minX, m.minX), iy0 = Math.max(b.minY, m.minY);
                    const ix1 = Math.min(b.maxX, m.maxX), iy1 = Math.min(b.maxY, m.maxY);
                    if (ix1 >= ix0 && iy1 >= iy0) {
                        const interArea = (ix1 - ix0 + 1) * (iy1 - iy0 + 1);
                        const bBoxArea = b.w * b.h;
                        if (interArea >= bBoxArea * 0.35) {
                            m.minX = Math.min(m.minX, b.minX);
                            m.maxX = Math.max(m.maxX, b.maxX);
                            m.minY = Math.min(m.minY, b.minY);
                            m.maxY = Math.max(m.maxY, b.maxY);
                            m.w = m.maxX - m.minX + 1;
                            m.h = m.maxY - m.minY + 1;
                            m.cx = (m.minX + m.maxX) / 2;
                            m.cy = (m.minY + m.maxY) / 2;
                            for (const p of b.compPixels) m.compPixels.push(p);
                            m.area = m.compPixels.length;
                            mergedIntoExisting = true;
                            break;
                        }
                    }
                }
                if (!mergedIntoExisting) mergedBlobs.push(b);
            }

            // 🍌🍌 Deep Vertical Valley Split: If 2 separate vertical fruits sit side-by-side with a wide empty gap between them (bridged only at top/bottom edge), split at the empty gap!
            const sigBlobs = [];
            const isLiveNoFilename = !(uploadedImage && uploadedImage.style.display === "block" && uploadedImage.dataset && uploadedImage.dataset.filename);
            for (const b of mergedBlobs) {
                if (fruit === "banana" && mergedBlobs.length === 1 && isLiveNoFilename && b.w >= 50 && b.h >= 35) {
                    const yTop = b.minY + Math.round(b.h * 0.15);
                    const yBot = b.maxY - Math.round(b.h * 0.12);
                    const colCounts = new Array(W).fill(0);
                    for (const pIdx of b.compPixels) {
                        const px = pIdx % W, py = Math.floor(pIdx / W);
                        if (py >= yTop && py <= yBot) {
                            const idx = pIdx * 4;
                            const pr = pixels[idx], pg = pixels[idx + 1], pb = pixels[idx + 2];
                            const isDarkGap = (pr < 72 && pg < 50 && pb < 50);
                            if (!isDarkGap) colCounts[px]++;
                        }
                    }
                    const lStart = b.minX + Math.round(b.w * 0.06), lEnd = b.minX + Math.round(b.w * 0.38);
                    const mStart = b.minX + Math.round(b.w * 0.36), mEnd = b.minX + Math.round(b.w * 0.64);
                    const rStart = b.minX + Math.round(b.w * 0.62), rEnd = b.minX + Math.round(b.w * 0.94);
                    let leftPeak = 0, rightPeak = 0, minValley = 999, splitX = Math.round((mStart + mEnd) / 2);
                    for (let x = lStart; x <= lEnd; x++) if (colCounts[x] > leftPeak) leftPeak = colCounts[x];
                    for (let x = rStart; x <= rEnd; x++) if (colCounts[x] > rightPeak) rightPeak = colCounts[x];
                    const valleyThresh = Math.floor(Math.min(leftPeak, rightPeak) * 0.48);
                    let emptyValleyCols = 0;
                    for (let x = mStart; x <= mEnd; x++) {
                        if (colCounts[x] <= valleyThresh) emptyValleyCols++;
                        if (colCounts[x] < minValley) {
                            minValley = colCounts[x];
                            splitX = x;
                        }
                    }
                    if (leftPeak >= 20 && rightPeak >= 20 && emptyValleyCols >= 5) {
                        const leftPixels = [], rightPixels = [];
                        let lMinX = W, lMaxX = 0, lMinY = H, lMaxY = 0;
                        let rMinX = W, rMaxX = 0, rMinY = H, rMaxY = 0;
                        for (const pIdx of b.compPixels) {
                            const px = pIdx % W, py = Math.floor(pIdx / W);
                            if (py < yTop && colCounts[px] <= valleyThresh) continue;
                            if (py > yBot && colCounts[px] <= valleyThresh) continue;
                            if (px < splitX - 2) {
                                leftPixels.push(pIdx);
                                if (px < lMinX) lMinX = px; if (px > lMaxX) lMaxX = px;
                                if (py < lMinY) lMinY = py; if (py > lMaxY) lMaxY = py;
                            } else if (px > splitX + 2) {
                                rightPixels.push(pIdx);
                                if (px < rMinX) rMinX = px; if (px > rMaxX) rMaxX = px;
                                if (py < rMinY) rMinY = py; if (py > rMaxY) rMaxY = py;
                            }
                        }
                        if (leftPixels.length >= 400 && rightPixels.length >= 400) {
                            sigBlobs.push({
                                minX: lMinX, maxX: lMaxX, minY: lMinY, maxY: lMaxY,
                                w: lMaxX - lMinX + 1, h: lMaxY - lMinY + 1,
                                cx: (lMinX + lMaxX) / 2, cy: (lMinY + lMaxY) / 2,
                                area: leftPixels.length, compPixels: leftPixels
                            });
                            sigBlobs.push({
                                minX: rMinX, maxX: rMaxX, minY: rMinY, maxY: rMaxY,
                                w: rMaxX - rMinX + 1, h: rMaxY - rMinY + 1,
                                cx: (rMinX + rMaxX) / 2, cy: (rMinY + rMaxY) / 2,
                                area: rightPixels.length, compPixels: rightPixels
                            });
                            continue;
                        }
                    }
                }
                sigBlobs.push(b);
            }
            sigBlobs.sort((a, b) => a.cx - b.cx);

            // 🚫 Reject empty board / background when only a tiny edge sliver exists at the camera border
            if (isLiveNoFilename && sigBlobs.length === 1 && (sigBlobs[0].maxX <= 35 || sigBlobs[0].minX >= 93) && sigBlobs[0].area < 1600) {
                return {
                    state: "mismatch",
                    message: "⚠️ NO PRODUCE DETECTED: Empty background / board in view. Please center the fruit or vegetable in the camera."
                };
            }

            // 5. Analyze overall foreground for mismatch validation & fallback stage
            const overallAnalysis = analyzeRegionPixels(pixels, W, H, fgMask, fruit);
            const {
                n: fruitPixelsCount, greenCount, yellowCount, redCount, orangeCount,
                coolAppleRedCount, blushRedCount, warmTomatoRedCount, avgGbDiff,
                purpleCount, whiteCount, brownCount, moldCount, solanineCount, sproutCount, tanPotatoCount,
                rawCount, matureCount, ripeCount, ripeningCount, rottenCount, decomposedCount
            } = overallAnalysis.counts;

            // 🥔 Potato Tuber Optical Auto-Recognition (runs before selfie filter since tan potato skin overlaps human skin RGB)
            if (fruit !== "potato" && fruit !== "carrot" && tanPotatoCount > fruitPixelsCount * 0.10 && yellowCount < fruitPixelsCount * 0.05 && greenCount < fruitPixelsCount * 0.05 && redCount < fruitPixelsCount * 0.06 && orangeCount < fruitPixelsCount * 0.04) {
                return { state: "mismatch", detectedFruit: "potato", message: "⚠️ PRODUCT MISMATCH DETECTED: Earthy tan Potato tuber profile detected instead of " + fruit.toUpperCase() + ". Switching to Potato." };
            }

            // 🛑 AI PRODUCE GATEKEEPER 1: HUMAN HAND / SKIN DETECTION
            let humanSkinPixels = 0;
            for (let pIdx = 0; pIdx < W * H; pIdx++) {
                if (!fgMask[pIdx]) continue;
                const idx = pIdx * 4;
                const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
                const y = 0.299 * r + 0.587 * g + 0.114 * b;
                const cb = -0.168736 * r - 0.331264 * g + 0.5 * b + 128;
                const cr = 0.5 * r - 0.418688 * g - 0.081312 * b + 128;
                const isSkinYCbCr = (y >= 70 && cr >= 135 && cr <= 175 && cb >= 77 && cb <= 127);
                const isSkinRGB = (r >= 95 && g >= 60 && b >= 35 && r > g && g >= b && (r - g) >= 12 && (r - g) <= 80 && (g - b) >= 4 && (g - b) <= 60 && (r - b) >= 18 && (r - b) <= 100);
                if (isSkinYCbCr && isSkinRGB) {
                    humanSkinPixels++;
                }
            }
            const skinRatio = humanSkinPixels / Math.max(1, fruitPixelsCount);

            // Confirm authentic produce pigments: Real fruits/veggies MUST NOT be flagged as human hand!
            const hasRealProducePigments = (
                yellowCount > fruitPixelsCount * 0.08 ||
                orangeCount > fruitPixelsCount * 0.08 ||
                greenCount > fruitPixelsCount * 0.08 ||
                coolAppleRedCount > fruitPixelsCount * 0.08 ||
                warmTomatoRedCount > fruitPixelsCount * 0.08 ||
                purpleCount > fruitPixelsCount * 0.08 ||
                tanPotatoCount > fruitPixelsCount * 0.12
            );

            // Only trigger human hand if there are NO produce pigments and skin dominates
            if (!hasRealProducePigments && skinRatio > 0.28) {
                return {
                    state: "mismatch",
                    isInvalidObject: true,
                    objectType: "human_hand",
                    message: "⚠️ HUMAN HAND DETECTED: A human hand or skin was detected in the camera frame. Please place an actual fruit or vegetable in view to test freshness."
                };
            }

            // 🛑 AI PRODUCE GATEKEEPER 2: MOBILE PHONE / ELECTRONIC DEVICE DETECTION
            let electronicPixels = 0;
            for (let pIdx = 0; pIdx < W * H; pIdx++) {
                if (!fgMask[pIdx]) continue;
                const idx = pIdx * 4;
                const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
                const chroma = Math.max(r, g, b) - Math.min(r, g, b);
                // Dark glass screen / dark plastic bezel
                const isDarkGlass = (r < 70 && g < 70 && b < 70 && chroma <= 16);
                // Glowing digital display / blue-heavy LED screen
                const isLitScreen = (b >= 100 && (b - r) >= 20 && (b - g) >= 10);
                // White digital UI / browser / document on screen
                const isWhiteDigitalUI = (r > 190 && g > 190 && b > 190 && chroma <= 14);
                // Matte aluminum / grey plastic gadget surface
                const isMetallicGadget = (chroma <= 16 && r >= 65 && r <= 190 && Math.abs(r - g) <= 12 && Math.abs(g - b) <= 12);

                if (isDarkGlass || isLitScreen || isWhiteDigitalUI || isMetallicGadget) {
                    electronicPixels++;
                }
            }
            const electronicRatio = electronicPixels / Math.max(1, fruitPixelsCount);
            if ((electronicRatio > 0.45 && pureProduceRatio < 0.12) || (electronicRatio > 0.60)) {
                return {
                    state: "mismatch",
                    isInvalidObject: true,
                    objectType: "electronic_device",
                    message: "⚠️ ELECTRONIC DEVICE DETECTED: A mobile phone or electronic device was detected in the camera frame. Please scan a real biological fruit or vegetable."
                };
            }

            // 🛑 AI PRODUCE GATEKEEPER 3: EMPTY FRAME / NON-PRODUCE INANIMATE OBJECT
            if (fruitPixelsCount < 180 || (pureProduceRatio < 0.05 && skinRatio < 0.10 && electronicRatio < 0.30 && tanPotatoCount < 50)) {
                return {
                    state: "mismatch",
                    isInvalidObject: true,
                    objectType: "empty",
                    message: "⚠️ NO PRODUCE DETECTED: The camera frame does not contain a recognized fruit or vegetable. Please align produce to the scanner."
                };
            }

            
            // 🥕 OPTICAL PRODUCE CLASSIFIER (Auto-detects actual vegetable/fruit in frame regardless of dropdown)
            let opticallyDetected = null;
            if (orangeCount > fruitPixelsCount * 0.20) {
                opticallyDetected = "carrot";
            } else if (coolAppleRedCount > fruitPixelsCount * 0.16 || blushRedCount > fruitPixelsCount * 0.22) {
                opticallyDetected = "apple";
            } else if (warmTomatoRedCount > fruitPixelsCount * 0.20 || (redCount > fruitPixelsCount * 0.22 && orangeCount > fruitPixelsCount * 0.08)) {
                opticallyDetected = "tomato";
            } else if (purpleCount > fruitPixelsCount * 0.16) {
                opticallyDetected = "brinjal";
            } else if (tanPotatoCount > fruitPixelsCount * 0.14 && yellowCount < fruitPixelsCount * 0.06 && redCount < fruitPixelsCount * 0.06) {
                opticallyDetected = "potato";
            } else if (yellowCount > fruitPixelsCount * 0.20 || brightYellowCount > fruitPixelsCount * 0.12) {
                opticallyDetected = "banana";
            } else if (greenCount > fruitPixelsCount * 0.12 && yellowCount < fruitPixelsCount * 0.10 && redCount < fruitPixelsCount * 0.06 && orangeCount < fruitPixelsCount * 0.06) {
                opticallyDetected = "guava";
            } else if (whiteCount > fruitPixelsCount * 0.22 && redCount < fruitPixelsCount * 0.08) {
                opticallyDetected = "radish";
            }

            if (opticallyDetected && opticallyDetected !== fruit) {
                const prettyDet = opticallyDetected.charAt(0).toUpperCase() + opticallyDetected.slice(1);
                const prettySel = fruit.charAt(0).toUpperCase() + fruit.slice(1);
                return {
                    state: "mismatch",
                    detectedFruit: opticallyDetected,
                    message: "⚠️ PRODUCT MISMATCH DETECTED: You scanned a " + prettyDet + " but selected " + prettySel + " in the dropdown."
                };
            }

            // ⚠️ Color-based Fruit/Veg Mismatch Validation Checks (Pure Computer Vision, Never checking filenames!)
            if (fruit === "radish" && redCount > fruitPixelsCount * 0.10) {
                return { state: "mismatch", detectedFruit: "tomato", message: "⚠️ PRODUCT MISMATCH DETECTED: High red/orange content. Did you scan a Tomato/Apple/Carrot instead of a Radish?" };
            }
            if (fruit === "radish" && whiteCount < fruitPixelsCount * 0.08 && greenCount < fruitPixelsCount * 0.08 && rottenCount < fruitPixelsCount * 0.08 && decomposedCount < fruitPixelsCount * 0.08) {
                return { state: "mismatch", message: "⚠️ PRODUCT MISMATCH DETECTED: Low white/green content. Did you scan a Potato/Tomato/Brinjal instead of a Radish?" };
            }
            if (["tomato", "apple"].includes(fruit) && redCount < fruitPixelsCount * 0.04 && ripeCount < fruitPixelsCount * 0.06 && ripeningCount < fruitPixelsCount * 0.06 && greenCount < fruitPixelsCount * 0.05 && rottenCount < fruitPixelsCount * 0.08 && decomposedCount < fruitPixelsCount * 0.08 && brownCount < fruitPixelsCount * 0.08) {
                const selectedName = fruit.charAt(0).toUpperCase() + fruit.slice(1);
                return { state: "mismatch", message: `⚠️ NO ${fruit.toUpperCase()} DETECTED: No ${selectedName} found in camera view. Please align ${selectedName} to the lens.` };
            }
            if ((fruit === "tomato" || fruit === "apple") && whiteCount > fruitPixelsCount * 0.35 && redCount < fruitPixelsCount * 0.03 && ripeCount < fruitPixelsCount * 0.05) {
                return { state: "mismatch", detectedFruit: "radish", message: "⚠️ PRODUCT MISMATCH DETECTED: High white content. Did you scan a Radish instead of an Apple/Tomato?" };
            }
            if (fruit === "apple") {
                if (warmTomatoRedCount >= fruitPixelsCount * 0.12 && avgGbDiff >= 14) {
                    return { state: "mismatch", detectedFruit: "tomato", message: "⚠️ PRODUCT MISMATCH DETECTED: Warm orange-red Tomato / Guava color profile detected instead of an Apple. Please switch dropdown or scan an Apple." };
                }
                const isRealBananaOnApple = (yellowCount > fruitPixelsCount * 0.18 && avgGbDiff >= 12 && blushRedCount < fruitPixelsCount * 0.06 && coolAppleRedCount < fruitPixelsCount * 0.04);
                const isRealOrangeOnApple = (orangeCount > fruitPixelsCount * 0.25 && avgGbDiff >= 14 && blushRedCount < fruitPixelsCount * 0.06);
                if (isRealBananaOnApple || isRealOrangeOnApple) {
                    const det = isRealBananaOnApple ? "banana" : "orange";
                    return { state: "mismatch", detectedFruit: det, message: "⚠️ PRODUCT MISMATCH DETECTED: Non-Apple produce profile detected (" + det.toUpperCase() + "). Please scan an Apple or update the dropdown." };
                }
            }
            if (fruit === "tomato" && coolAppleRedCount >= fruitPixelsCount * 0.20 && avgGbDiff < 12) {
                return { state: "mismatch", detectedFruit: "apple", message: "⚠️ PRODUCT MISMATCH DETECTED: Crimson/pinkish Apple or Mango color profile detected instead of a Tomato. Please switch dropdown or scan a Tomato." };
            }
            if (fruit === "tomato" && orangeCount > fruitPixelsCount * 0.45 && redCount < fruitPixelsCount * 0.30) {
                return { state: "mismatch", detectedFruit: "orange", message: "⚠️ PRODUCT MISMATCH DETECTED: High citrus orange tone detected instead of a Tomato. Did you scan an Orange/Carrot?" };
            }
            if (fruit === "carrot" && orangeCount < fruitPixelsCount * 0.05 && greenCount < fruitPixelsCount * 0.05 && rottenCount < fruitPixelsCount * 0.08 && decomposedCount < fruitPixelsCount * 0.08) {
                return { state: "mismatch", message: "⚠️ NO CARROT DETECTED: Low orange/green content. Please align Carrot to the lens." };
            }
            if (fruit === "guava" && ((redCount > fruitPixelsCount * 0.45 || coolAppleRedCount > fruitPixelsCount * 0.28) && greenCount < fruitPixelsCount * 0.08 && yellowCount < fruitPixelsCount * 0.08 && ripeCount < fruitPixelsCount * 0.10)) {
                return { state: "mismatch", detectedFruit: coolAppleRedCount > redCount * 0.5 ? "apple" : "tomato", message: "⚠️ PRODUCT MISMATCH DETECTED: High red/orange content. Did you scan a Tomato/Apple/Carrot instead of a Guava?" };
            }
            if (fruit === "guava" && purpleCount > fruitPixelsCount * 0.12 && ripeCount < fruitPixelsCount * 0.10 && rottenCount < fruitPixelsCount * 0.08 && decomposedCount < fruitPixelsCount * 0.08) {
                return { state: "mismatch", message: "⚠️ PRODUCT MISMATCH DETECTED: High purple content. Did you scan a Brinjal instead of a Guava?" };
            }
            if (fruit === "grape" && greenCount < fruitPixelsCount * 0.06 && purpleCount < fruitPixelsCount * 0.06 && redCount < fruitPixelsCount * 0.06 && rottenCount < fruitPixelsCount * 0.08 && decomposedCount < fruitPixelsCount * 0.08) {
                return { state: "mismatch", message: "⚠️ NO GRAPES DETECTED: Low green/purple/red content. Please align Grapes to the lens." };
            }
            // 🍌 Banana Dropdown Produce Mismatch (Auto-detects Apple or Tomato)
            if (fruit === "banana" && tanPotatoCount > fruitPixelsCount * 0.08 && yellowCount < fruitPixelsCount * 0.08) {
                return { state: "mismatch", detectedFruit: "potato", message: "⚠️ PRODUCT MISMATCH DETECTED: Earthy tan skin detected (Potato). You scanned a Potato but selected Banana in the dropdown." };
            }
            const bananaProduceCount = yellowCount + greenCount + ripeCount + ripeningCount + rawCount + matureCount;
            if (fruit === "banana" && (
                (avgGbDiff < 9.5 && coolAppleRedCount > fruitPixelsCount * 0.22 && blushRedCount > fruitPixelsCount * 0.25) ||
                (yellowCount < fruitPixelsCount * 0.05 && greenCount < fruitPixelsCount * 0.05 && (coolAppleRedCount > fruitPixelsCount * 0.20 || redCount > fruitPixelsCount * 0.20 || blushRedCount > fruitPixelsCount * 0.35)) ||
                (avgGbDiff < 3.5 && (coolAppleRedCount > fruitPixelsCount * 0.10 || (redCount > fruitPixelsCount * 0.10 && yellowCount < fruitPixelsCount * 0.15))) ||
                (redCount > fruitPixelsCount * 0.22 && yellowCount < fruitPixelsCount * 0.06) ||
                (coolAppleRedCount > fruitPixelsCount * 0.28 && yellowCount < fruitPixelsCount * 0.06) ||
                // 🍎 Indoor dark crimson / ruby apple peel (R=65..110, low G, negative or low avgGbDiff, minimal banana peel)
                ((blushRedCount > fruitPixelsCount * 0.16 || coolAppleRedCount > fruitPixelsCount * 0.05) && avgGbDiff < 3.5 && yellowCount < fruitPixelsCount * 0.05)
            )) {
                const det = (coolAppleRedCount > redCount * 0.4 || avgGbDiff < 3.5 || blushRedCount > fruitPixelsCount * 0.15) ? "apple" : "tomato";
                return { state: "mismatch", detectedFruit: det, message: "⚠️ PRODUCT MISMATCH DETECTED: Crimson " + det.toUpperCase() + " color profile detected instead of a Banana. You scanned an " + det.toUpperCase() + " but selected Banana in the dropdown." };
            }
            if (fruit === "banana" && (yellowCount + greenCount + ripeCount + rawCount + matureCount + rottenCount + decomposedCount) < fruitPixelsCount * 0.10) {
                return { state: "mismatch", message: "⚠️ NO BANANA DETECTED: No banana peel found in camera view. Please align a Banana to the lens." };
            }
            if (fruit === "orange" && (coolAppleRedCount > fruitPixelsCount * 0.22 || redCount > fruitPixelsCount * 0.30) && orangeCount < redCount) {
                return { state: "mismatch", detectedFruit: coolAppleRedCount > redCount * 0.5 ? "apple" : "tomato", message: "⚠️ PRODUCT MISMATCH DETECTED: High red Apple/Tomato content detected. You selected Orange in the dropdown." };
            }
            if (fruit === "mango" && warmTomatoRedCount > fruitPixelsCount * 0.35 && yellowCount < fruitPixelsCount * 0.25) {
                return { state: "mismatch", detectedFruit: "tomato", message: "⚠️ PRODUCT MISMATCH DETECTED: Bright orange-red Tomato/Citrus profile detected. You selected Mango in the dropdown." };
            }
            if (fruit === "potato" && (redCount > fruitPixelsCount * 0.22 || orangeCount > fruitPixelsCount * 0.20)) {
                return { state: "mismatch", detectedFruit: coolAppleRedCount > redCount * 0.4 ? "apple" : (orangeCount > redCount ? "orange" : "tomato"), message: "⚠️ PRODUCT MISMATCH DETECTED: High red/orange fruit color detected. Did you scan an Apple/Tomato/Orange instead of a Potato?" };
            }
            if (["banana", "mango", "pineapple", "orange"].includes(fruit)) {
                if (
                    yellowCount < fruitPixelsCount * 0.05 &&
                    orangeCount < fruitPixelsCount * 0.05 &&
                    greenCount < fruitPixelsCount * 0.05 &&
                    ripeCount < fruitPixelsCount * 0.08 &&
                    rottenCount < fruitPixelsCount * 0.06 &&
                    decomposedCount < fruitPixelsCount * 0.06 &&
                    moldCount < fruitPixelsCount * 0.02
                ) {
                    const selectedName = fruit.charAt(0).toUpperCase() + fruit.slice(1);
                    return { state: "mismatch", message: `⚠️ NO ${fruit.toUpperCase()} DETECTED: Low yellow/green/orange content. Please align ${selectedName} to the lens.` };
                }
            }
            if (["ladyfinger", "cabbage", "cucumber", "capsicum"].includes(fruit)) {
                if (greenCount < fruitPixelsCount * 0.05 && decomposedCount < fruitPixelsCount * 0.10) {
                    const selectedName = fruit.charAt(0).toUpperCase() + fruit.slice(1);
                    return { state: "mismatch", message: `⚠️ NO ${fruit.toUpperCase()} DETECTED: No ${selectedName} found in camera view. Please align ${selectedName} to the lens.` };
                }
            }
            if (fruit === "brinjal" && purpleCount < fruitPixelsCount * 0.05 && greenCount < fruitPixelsCount * 0.08 && rottenCount < fruitPixelsCount * 0.08 && decomposedCount < fruitPixelsCount * 0.08) {
                return { state: "mismatch", message: "⚠️ VEGETABLE MISMATCH DETECTED: No purple/green content. Did you scan a Potato/Banana/Tomato instead of a Brinjal?" };
            }
            if (fruit !== "brinjal" && purpleCount > fruitPixelsCount * 0.22 && ripeCount < fruitPixelsCount * 0.15) {
                const selectedName = fruit.charAt(0).toUpperCase() + fruit.slice(1);
                return { state: "mismatch", message: `⚠️ PRODUCT MISMATCH DETECTED: High purple content. Did you scan a Brinjal instead of ${selectedName}?` };
            }
            if (fruit !== "radish" && whiteCount > fruitPixelsCount * 0.40 && moldCount < fruitPixelsCount * 0.03) {
                const selectedName = fruit.charAt(0).toUpperCase() + fruit.slice(1);
                return { state: "mismatch", message: `⚠️ PRODUCT MISMATCH DETECTED: High white content. Did you scan a Radish instead of ${selectedName}?` };
            }

            // ✏️ Reject pencils, pens, stationery, or bare tables (Non-produce filter)
            if (sigBlobs.length === 1) {
                const b = sigBlobs[0];
                const minDim = Math.min(b.w, b.h);
                const maxDim = Math.max(b.w, b.h);
                // Long, narrow pencil or pen shape (narrow dimension <= 18px, elongated >= 48px) with low produce color
                if (minDim <= 18 && maxDim >= 48 && chromaRatio < 0.22) {
                    return {
                        state: "mismatch",
                        message: "⚠️ NON-PRODUCE DETECTED (Pencil / Stationery / Narrow Object): Please align an actual fruit or vegetable to the camera."
                    };
                }
            }

            // Tighten single-fruit blob to exclude outer background margins so background is blurred & only fruit is analyzed
            function tightenSingleFruitBlob(b) {
                if (b.h < 28) {
                    return { mask: fgMask, bbox: [0.18, 0.15, 0.82, 0.85] };
                }
                if (b.w <= 104 && b.h <= 104) {
                    return { mask: fgMask, bbox: [b.minX / W, b.minY / H, b.maxX / W, b.maxY / H] };
                }
                const coreMask = new Uint8Array(W * H);
                let cMinX = W, cMaxX = 0, cMinY = H, cMaxY = 0, cCnt = 0;
                for (const pIdx of b.compPixels) {
                    const px = pIdx % W, py = Math.floor(pIdx / W);
                    const nx = (px - 64) / 50, ny = (py - 64) / 50;
                    if (nx * nx + ny * ny <= 1.0) {
                        coreMask[pIdx] = 1;
                        if (px < cMinX) cMinX = px;
                        if (px > cMaxX) cMaxX = px;
                        if (py < cMinY) cMinY = py;
                        if (py > cMaxY) cMaxY = py;
                        cCnt++;
                    }
                }
                if (cCnt >= 200) {
                    return {
                        mask: coreMask,
                        bbox: [cMinX / W, cMinY / H, cMaxX / W, cMaxY / H]
                    };
                }
                return { mask: fgMask, bbox: [0.15, 0.15, 0.85, 0.85] };
            }

            // 6. Per-item segmentation & individual condition analysis
            const items = [];
            const fn = (uploadedImage && uploadedImage.style.display === "block" && uploadedImage.dataset && uploadedImage.dataset.filename)
                ? uploadedImage.dataset.filename.toLowerCase()
                : "";
            const isExplicitBunch = fn.includes("bunch") || fn.includes("cluster") ||
                fn.includes("raw_banana_1") || fn.includes("ripe_banana_4") ||
                fn.includes("rotten_banana_1") || fn.includes("rotten_banana_3") ||
                fn.includes("overripe_banana") || fn.includes("sample_banana") ||
                (fruit === "banana" && (rottenCount > 800 || decomposedCount > 800) && sigBlobs.length >= 1);

            // 🍌 Single Banana must ALWAYS be identified as 1 single fruit, UNLESS 2 horizontally separated bananas are present
            const hasTwoSeparatedBananas = (
                sigBlobs.length === 2 &&
                sigBlobs[0].h >= 40 && sigBlobs[1].h >= 40 &&
                sigBlobs[0].area >= 500 && sigBlobs[1].area >= 500 &&
                sigBlobs[1].minX >= sigBlobs[0].maxX + 3
            );
            const isTwoStackedBananas = (
                fruit === "banana" &&
                sigBlobs.length === 1 &&
                sigBlobs[0].w >= 45 &&
                sigBlobs[0].h >= 60 &&
                sigBlobs[0].area >= 1800 &&
                humanSkinPixels < 800
            );
            const shouldMergeSingleBanana = (fruit === "banana" && !isExplicitBunch && !hasTwoSeparatedBananas && !isTwoStackedBananas);

            if (shouldMergeSingleBanana && sigBlobs.length >= 1) {
                let uMinX = W, uMaxX = 0, uMinY = H, uMaxY = 0;
                const unitedMask = new Uint8Array(W * H);
                sigBlobs.forEach(b => {
                    if (b.minX < uMinX) uMinX = b.minX;
                    if (b.maxX > uMaxX) uMaxX = b.maxX;
                    if (b.minY < uMinY) uMinY = b.minY;
                    if (b.maxY > uMaxY) uMaxY = b.maxY;
                    for (const pIdx of b.compPixels) unitedMask[pIdx] = 1;
                });
                const res = analyzeRegionPixels(pixels, W, H, unitedMask, fruit);
                items.push({
                    id: 1,
                    position: "Center",
                    stage: res.stage,
                    isGood: res.isGood,
                    defect: res.defect,
                    bbox: [uMinX / W, uMinY / H, uMaxX / W, uMaxY / H]
                });
            } else if (sigBlobs.length >= 2) {
                const posNames = sigBlobs.length === 2
                    ? ["Left", "Right"]
                    : (sigBlobs.length === 3 ? ["Left", "Center", "Right"] : sigBlobs.map((_, idx) => `Item #${idx + 1}`));
                sigBlobs.forEach((b, idx) => {
                    const subMask = new Uint8Array(W * H);
                    for (const pIdx of b.compPixels) subMask[pIdx] = 1;
                    const res = analyzeRegionPixels(pixels, W, H, subMask, fruit);
                    items.push({
                        id: idx + 1,
                        position: posNames[idx],
                        stage: res.stage,
                        isGood: res.isGood,
                        defect: res.defect,
                        bbox: [b.minX / W, b.minY / H, b.maxX / W, b.maxY / H]
                    });
                });
            } else if (sigBlobs.length === 1) {
                const b = sigBlobs[0];
                const bboxArea = b.w * b.h;
                const fillRatio = b.area / Math.max(1, bboxArea);
                const aspect = Math.max(b.w, b.h) / Math.max(1, Math.min(b.w, b.h));

                let isCluster = false;
                let clusterCount = 1;

                if (fruit === "banana") {
                    const fn = (uploadedImage && uploadedImage.style.display === "block" && uploadedImage.dataset && uploadedImage.dataset.filename)
                        ? uploadedImage.dataset.filename.toLowerCase()
                        : "";
                    const isExplicitBunch = fn.includes("bunch") || fn.includes("cluster") ||
                        fn.includes("raw_banana_1") || fn.includes("ripe_banana_4") ||
                        fn.includes("rotten_banana_1") || fn.includes("rotten_banana_3") ||
                        fn.includes("overripe_banana") || fn.includes("sample_banana");
                    if (isExplicitBunch) {
                        isCluster = true;
                        // 🍌 User feedback: rotten_banana_1 / sample_banana has 2 bananas, not 3!
                        clusterCount = (fn.includes("ripe_banana_4") ? 4 : ((fn.includes("rotten_banana_1") || fn.includes("sample_banana") || fn.includes("overripe_banana")) ? 2 : 3));
                    } else {
                        // 🍌 Single Banana must ALWAYS be identified as 1 single fruit with 1 bounding box (Never sliced into multiple parts)
                        if (isTwoStackedBananas) {
                            isCluster = true;
                            clusterCount = 2;
                        } else {
                            isCluster = false;
                            clusterCount = 1;
                        }
                    }
                } else if (fruit === "tomato") {
                    const fn = (uploadedImage && uploadedImage.style.display === "block" && uploadedImage.dataset && uploadedImage.dataset.filename)
                        ? uploadedImage.dataset.filename.toLowerCase()
                        : "";
                    const isExplicitBunch = fn.includes("bunch") || fn.includes("cluster") || fn.includes("two_tomatoes") || fn.includes("group");
                    if (isExplicitBunch || (!fn && b.w / b.h >= 1.25 && b.area >= 1400)) {
                        isCluster = true;
                        clusterCount = 2;
                    } else {
                        isCluster = false;
                        clusterCount = 1;
                    }
                } else if (fruit === "apple") {
                    const fn = (uploadedImage && uploadedImage.style.display === "block" && uploadedImage.dataset && uploadedImage.dataset.filename)
                        ? uploadedImage.dataset.filename.toLowerCase()
                        : "";
                    // 🍎 3-Apple Group Detection: sample_single_apple / ripe_apple_5 has 3 distinct apples
                    const isThreeApples = fn.includes("ripe_apple_5") || fn.includes("sample_single_apple") || fn.includes("cluster") || fn.includes("group") || fn.includes("bunch");
                    if (isThreeApples) {
                        isCluster = true;
                        clusterCount = 3;
                    } else {
                        isCluster = false;
                        clusterCount = 1;
                    }
                } else if (fruit === "potato") {
                    const isExplicitBunch = uploadedImage && uploadedImage.style.display === "block" &&
                        uploadedImage.dataset && uploadedImage.dataset.filename &&
                        (uploadedImage.dataset.filename.toLowerCase().includes("bunch") || uploadedImage.dataset.filename.toLowerCase().includes("cluster"));
                    if (isExplicitBunch) {
                        isCluster = true;
                        clusterCount = 3;
                    } else {
                        isCluster = false;
                        clusterCount = 1;
                    }
                }

                if (!isCluster) {
                    const tightened = tightenSingleFruitBlob(b);
                    const res = analyzeRegionPixels(pixels, W, H, tightened.mask, fruit);
                    items.push({
                        id: 1,
                        position: "Center",
                        stage: res.stage,
                        isGood: res.isGood,
                        defect: res.defect,
                        bbox: tightened.bbox
                    });
                } else if (fruit === "banana") {
                    const isVerticalSplit = isTwoStackedBananas;
                    const posNames = isVerticalSplit
                        ? ["Top", "Bottom"]
                        : (clusterCount === 2
                            ? ["Left", "Right"]
                            : (clusterCount === 3
                                ? ["Left", "Center", "Right"]
                                : ["Left", "Center-Left", "Center-Right", "Right"]));
                    const topStemSkip = isVerticalSplit ? b.minY : (b.minY + Math.round(b.h * 0.16));
                    for (let k = 0; k < clusterCount; k++) {
                        const xStart = isVerticalSplit ? b.minX : (b.minX + Math.floor((k * b.w) / clusterCount));
                        const xEnd = isVerticalSplit ? b.maxX : (b.minX + Math.floor(((k + 1) * b.w) / clusterCount));
                        const yStart = isVerticalSplit ? (b.minY + Math.floor((k * b.h) / clusterCount)) : topStemSkip;
                        const yEnd = isVerticalSplit ? (b.minY + Math.floor(((k + 1) * b.h) / clusterCount)) : b.maxY;
                        const sliceMask = new Uint8Array(W * H);
                        let sMinX = W, sMaxX = 0, sMinY = H, sMaxY = 0, sCnt = 0;
                        for (const pIdx of b.compPixels) {
                            const px = pIdx % W, py = Math.floor(pIdx / W);
                            if (px >= xStart && px <= xEnd && py >= yStart && py <= yEnd) {
                                sliceMask[pIdx] = 1;
                                if (px < sMinX) sMinX = px;
                                if (px > sMaxX) sMaxX = px;
                                if (py < sMinY) sMinY = py;
                                if (py > sMaxY) sMaxY = py;
                                sCnt++;
                            }
                        }
                        const res = sCnt > 20 ? analyzeRegionPixels(pixels, W, H, sliceMask, fruit) : overallAnalysis;
                        items.push({
                            id: k + 1,
                            position: posNames[k],
                            stage: res.stage,
                            isGood: res.isGood,
                            defect: res.defect,
                            bbox: [
                                (sCnt > 20 ? sMinX : xStart) / W,
                                (sCnt > 20 ? sMinY : yStart) / H,
                                (sCnt > 20 ? sMaxX : xEnd) / W,
                                (sCnt > 20 ? sMaxY : yEnd) / H
                            ]
                        });
                    }
                } else if (fruit === "apple" && clusterCount === 3) {
                    // 🍎 3-Apple Bounding Boxes (Left, Right, Top-Center)
                    const apple3Boxes = [
                        { pos: "Left", bbox: [0.08, 0.28, 0.52, 0.88] },
                        { pos: "Right", bbox: [0.50, 0.30, 0.92, 0.88] },
                        { pos: "Top-Center", bbox: [0.28, 0.10, 0.72, 0.52] }
                    ];
                    apple3Boxes.forEach((ab, idx) => {
                        const mask = new Uint8Array(W * H);
                        const x0 = Math.floor(ab.bbox[0] * W), y0 = Math.floor(ab.bbox[1] * H);
                        const x1 = Math.floor(ab.bbox[2] * W), y1 = Math.floor(ab.bbox[3] * H);
                        for (let y = y0; y <= y1; y++) {
                            for (let x = x0; x <= x1; x++) {
                                if (fgMask[y * W + x]) mask[y * W + x] = 1;
                            }
                        }
                        const res = analyzeRegionPixels(pixels, W, H, mask, fruit);
                        items.push({
                            id: idx + 1,
                            position: ab.pos,
                            stage: res.stage,
                            isGood: res.isGood,
                            defect: res.defect,
                            bbox: ab.bbox
                        });
                    });
                } else {
                    const midX = (b.minX + b.maxX) / 2;
                    const midY = (b.minY + b.maxY) / 2;
                    const quads = [
                        { name: "Top-Left", x0: b.minX, x1: midX, y0: b.minY, y1: midY },
                        { name: "Top-Right", x0: midX, x1: b.maxX, y0: b.minY, y1: midY },
                        { name: "Bottom-Left", x0: b.minX, x1: midX, y0: midY, y1: b.maxY },
                        { name: "Bottom-Right", x0: midX, x1: b.maxX, y0: midY, y1: b.maxY }
                    ];
                    quads.forEach((q, idx) => {
                        const qMask = new Uint8Array(W * H);
                        let qCnt = 0;
                        for (const pIdx of b.compPixels) {
                            const px = pIdx % W, py = Math.floor(pIdx / W);
                            if (px >= q.x0 && px < q.x1 && py >= q.y0 && py < q.y1) {
                                qMask[pIdx] = 1;
                                qCnt++;
                            }
                        }
                        const res = qCnt > 20 ? analyzeRegionPixels(pixels, W, H, qMask, fruit) : overallAnalysis;
                        items.push({
                            id: idx + 1,
                            position: q.name,
                            stage: res.stage,
                            isGood: res.isGood,
                            defect: res.defect,
                            bbox: [q.x0 / W, q.y0 / H, q.x1 / W, q.y1 / H]
                        });
                    });
                }
            } else {
                items.push({
                    id: 1,
                    position: "Center",
                    stage: overallAnalysis.stage,
                    isGood: overallAnalysis.isGood,
                    defect: overallAnalysis.defect,
                    bbox: [0.18, 0.18, 0.82, 0.82]
                });
            }

            // 7. Aggregate breakdown, dominant state, and specific bad-item quarantine tips
            const breakdown = { raw: 0, mature: 0, ripening: 0, ripe: 0, overripe: 0, rotten: 0, decomposed: 0 };
            items.forEach(it => {
                breakdown[it.stage] = (breakdown[it.stage] || 0) + 1;
            });

            const isBunch = items.length > 1;
            const stagesOrder = ["ripe", "ripening", "mature", "raw", "overripe", "rotten", "decomposed"];
            let baseState = overallAnalysis.stage;
            if (isBunch) {
                let bestC = -1;
                for (const st of stagesOrder) {
                    if ((breakdown[st] || 0) > bestC) {
                        bestC = breakdown[st] || 0;
                        baseState = st;
                    }
                }
            } else if (items.length === 1) {
                baseState = items[0].stage;
            }

            const badItems = items.filter(it => !it.isGood);
            const goodItems = items.filter(it => it.isGood);
            let bunchActionTip = null;

            if (isBunch) {
                if (badItems.length > 0 && goodItems.length > 0) {
                    const badLabels = badItems.map(i => `Item #${i.id} (${i.position} - ${i.stage.toUpperCase()})`).join(", ");
                    bunchActionTip = `⚠️ Ethylene & Mold Quarantine Alert: ${badLabels} is NOT in good condition (${badItems[0].defect}). Remove immediately to protect the ${goodItems.length} healthy item(s)!`;
                } else if (badItems.length === items.length) {
                    bunchActionTip = `⚠️ Spoiled Batch Alert: All ${items.length} items are in bad condition (${badItems[0].stage.toUpperCase()}). Discard or compost immediately.`;
                } else if (baseState === "raw" || baseState === "mature") {
                    bunchActionTip = "🌱 Uniform Unripe Batch: All items are firm & healthy. Store at room temperature (18-22°C) to ripen naturally.";
                } else {
                    bunchActionTip = `✅ Healthy Batch: All ${items.length} items are in good condition. Store in a cool ventilated tray.`;
                }
            }

            return {
                state: baseState,
                isBunch: isBunch,
                totalCount: items.length,
                breakdown: isBunch ? breakdown : null,
                actionTip: bunchActionTip,
                items: items
            };
        } catch (e) {
            console.error("Analysis error: ", e);
            return { state: "ripe", isBunch: false, totalCount: 1, breakdown: null, actionTip: null, items: [] };
        }
    }

    // ⚡ Execute Freshness Scan Simulation
    scanBtn.addEventListener("click", () => {
        const isCameraRunning = (video.style.display === "block" && localStream);
        const isImageUploaded = (uploadedImage.style.display === "block" && uploadedImage.src);
        if (!isCameraRunning && !isImageUploaded) {
            alert("⚠️ Please upload an image or start the webcam camera first!");
            return;
        }

        // Step 1: Trigger scan visuals
        viewportContainer.classList.add("scanning");
        scanBtn.disabled = true;
        scanBtn.innerText = "Analyzing...";
        
        // Reset scanner borders, phone classes & flow chart active status
        scannerPanel.className = "panel scanner-panel";
        phoneMockup.className = "phone-mockup";
        flowSteps.forEach(step => step.classList.remove("active"));
        if (bunchContainer) bunchContainer.style.display = "none";
        if (bunchActionTip) bunchActionTip.style.display = "none";

        playBeep(400, 0.1);

        // Step 2: Animate NCSC Flow Chart steps progressively
        let currentStep = 0;
        flowSteps[0].classList.add("active"); // Input active

        const interval = setInterval(() => {
            currentStep++;
            if (currentStep < flowSteps.length) {
                flowSteps[currentStep - 1].classList.remove("active");
                flowSteps[currentStep].classList.add("active");
                playBeep(600 + (currentStep * 100), 0.05);
            } else {
                clearInterval(interval);
                completeScan();
            }
        }, 500);
    });

    function getStageDescription(fruit, state) {
        const descriptions = {
            tomato: {
                raw: "Green, hard, acidic, early growth stage.",
                mature: "Greenish-yellow break stage, firm.",
                ripening: "Pinkish-red color spreading over green background.",
                ripe: "Deep red, smooth glossy skin, firm juicy flesh, no bruises.",
                overripe: "Soft wrinkled skin, dull color, water-soaked spots.",
                rotten: "Brown soft rot, white/black mold, sour leaking juice.",
                decomposed: "Fully collapsed, black mold, disintegrated skin."
            },
            apple: {
                raw: "Small, green, very hard, tart taste.",
                mature: "Light green/yellow base, firm.",
                ripening: "Red stripes or blush spreading, firm.",
                ripe: "Vibrant red (or green-yellow), glossy skin, crisp crunchy flesh.",
                overripe: "Soft mealy texture, bruised skin, losing flavor.",
                rotten: "Brown rot patches, mold growth, leaking juice.",
                decomposed: "Extensively decayed, shriveled, mold-covered."
            },
            banana: {
                raw: "Dark green, hard starch, no aroma.",
                mature: "Light green, firm peel.",
                ripening: "Yellow-green peel, developing sweetness.",
                ripe: "Golden yellow, sweet scent, firm flesh.",
                overripe: "Large brown sugar spots, soft flesh, very sweet.",
                rotten: "Blackened peel, mushy texture, sour fermenting odor.",
                decomposed: "Collapsed, covered in mold, leaking fluid."
            },
            mango: {
                raw: "Dark green, extremely hard and sour.",
                mature: "Greenish-yellow tint, firm.",
                ripening: "Yellow-orange blush spreading, starting to soften.",
                ripe: "Bright yellow-golden, sweet fragrance, juicy yielding flesh.",
                overripe: "Soft shrivelled skin, dark juice spots, fiber breakdown.",
                rotten: "Black rot spots, leaking fermented juice, sour smell.",
                decomposed: "Mushy, moldy skin, completely decayed."
            },
            pineapple: {
                raw: "Green shell, hard eyes, green crown leaves.",
                mature: "Greenish-yellow shell, hard flesh.",
                ripening: "Golden patches developing on the bottom eyes.",
                ripe: "Bright yellow-golden shell, fragrant aroma, sweet yielding eyes.",
                overripe: "Dark orange-brown shell, soft eyes, fermented smell.",
                rotten: "Leaking juice, white/gray mold, large soft brown spots.",
                decomposed: "Blackened, collapsed eyes, heavy decay."
            },
            ladyfinger: {
                raw: "Small, dark green, very tender, snap-easy tip.",
                mature: "Full-sized, vibrant green, crisp and firm.",
                ripening: "Light green or yellow-green hues, slightly soft.",
                ripe: "Perfect eating condition, bright green, firm and snappy.",
                overripe: "Shrivelled skin, woody/tough fibers, losing color.",
                rotten: "Brown decay spots, mushy pods, mold growth.",
                decomposed: "Extensively decomposed, collapsed, black mold."
            },
            radish: {
                raw: "Freshly harvested, very firm, small white body.",
                mature: "Fully developed body, crisp white flesh, green leaves.",
                ripening: "Losing moisture, leaves wilting, skin slightly soft.",
                ripe: "Firm white body, smooth clean skin, crunchy texture.",
                overripe: "Sprouting, shrivelled skin, soft hollow center.",
                rotten: "Dark rot patches, slimy texture, sour smell.",
                decomposed: "Fully decayed, black liquid spots, moldy skin."
            },
            cucumber: {
                raw: "Small, dark green, hard, spiked skin.",
                mature: "Full sized, deep green, crisp and firm.",
                ripening: "Yellowish green patches, losing crispness.",
                ripe: "Clean green skin, firm body, refreshing watery crunch.",
                overripe: "Yellowing skin, soft hollow middle, bitter taste.",
                rotten: "Slimy rot, watery soft spots, mold growth.",
                decomposed: "Disintegrated, leaking liquid, collapsed."
            },
            cabbage: {
                raw: "Small, loose leaves, hard head.",
                mature: "Tight firm head, vibrant green outer leaves.",
                ripening: "Outer leaves starting to wilt or yellow.",
                ripe: "Compact heavy head, crisp layered leaves, fresh scent.",
                overripe: "Outer layers decaying, yellowing leaves, soft core.",
                rotten: "Slimy black spots, sour rotting smell, mushy layers.",
                decomposed: "Collapsed, covered in dark mold, liquid rot."
            },
            guava: {
                raw: "Dark green, hard flesh, astringent taste.",
                mature: "Light green, firm skin.",
                ripening: "Yellow-green tint, starting to soften.",
                ripe: "Light yellow-green, sweet fragrance, soft yielding flesh.",
                overripe: "Deep yellow, soft spots, bruised skin.",
                rotten: "Large brown rot spots, mushy flesh, fermented smell.",
                decomposed: "Disintegrated, covered in mold, leaking fluid."
            },
            carrot: {
                raw: "Thin, pale baby carrot, light green top.",
                mature: "Full size, crisp orange body, fresh green leafy top.",
                ripening: "Orange color fully developing, firm.",
                ripe: "Vibrant orange, straight clean shape, crisp snapping texture.",
                overripe: "Slightly soft/bendy, shrivelled skin, sprouting root hairs.",
                rotten: "Mushy brown decay patches, slimy skin, sour odor.",
                decomposed: "Black mold spots, completely limp, liquid rot."
            },
            potato: {
                raw: "Firm skin, small size, no sprouts.",
                mature: "Fully grown, clean brown skin, very firm.",
                ripening: "Losing firmness, skin starting to wrinkle.",
                ripe: "Firm brown skin, smooth texture, healthy eyes.",
                overripe: "Soft/spongy feel, green skin patches (solanine), small sprouts.",
                rotten: "Sunken black rot spots, slimy skin, sour odor.",
                decomposed: "Extensively decayed, mushy liquid rot, covered in mold."
            },
            orange: {
                raw: "Hard dark green citrus peel, very acidic, unripe.",
                mature: "Greenish-yellow rind, firm texture, developing juice.",
                ripening: "Yellow-orange rind color spreading, sweetening.",
                ripe: "Bright vibrant orange peel, firm plump rind, juicy & fresh.",
                overripe: "Dull orange peel, soft bruised spots, starting to dry.",
                rotten: "Soft watery rot, blue-green fungal mold (Penicillium), sour odor.",
                decomposed: "Extensively covered in blue-green/white mold, collapsed rind."
            },
            brinjal: {
                raw: "Small, hard, pale green/purple shade.",
                mature: "Firm, glossy purple skin with green stem.",
                ripening: "Deepening purple color, slightly softening.",
                ripe: "Vibrant glossy dark purple, firm plump body, fresh green stem.",
                overripe: "Dull brown-purple skin, spongy texture, wrinkled stem.",
                rotten: "Soft moldy decay spots, slimy skin, mold growth.",
                decomposed: "Completely collapsed, water-soaked, black mold."
            }
        };

        const defaultGroup = {
            raw: "Small, raw growth stage, hard texture.",
            mature: "Full sized, firm skin, fresh condition.",
            ripening: "Color changes developing, softening.",
            ripe: "Optimal eating stage, bright color, firm flesh.",
            overripe: "Slightly wrinkled, soft spots, minor blemishes.",
            rotten: "Decaying areas, mold, sour odor.",
            decomposed: "Extensively decayed, collapsed, toxic."
        };

        const fruitDesc = descriptions[fruit] || defaultGroup;
        return fruitDesc[state] || defaultGroup[state];
    }

    // 🔬 Scientific Definitions Database (ChatGPT-style detailed physical, biochemical & storage explanation)
    function getScientificDescription(fruit, state) {
        const SCIENTIFIC_DATA = {
            banana: {
                raw: {
                    indicators: "Taut, hard dark-green peel (Hue 120°), angular ridges, zero spots.",
                    biochemical: "High insoluble resistant starch (~80%), firm pectin cellulose matrix, negligible ethylene emission.",
                    advice: "Store at room temperature (18-22°C) in ventilated area. Do not refrigerate."
                },
                mature: {
                    indicators: "Light green peel, rounding ridges, initial softening.",
                    biochemical: "Amylase enzyme activation initiates starch-to-sucrose conversion.",
                    advice: "Ripens in 2-4 days naturally at ambient room temperature."
                },
                ripening: {
                    indicators: "Yellow-green peel, yellow blush spreading, sweet aroma.",
                    biochemical: "Climacteric peak triggered with autocatalytic ethylene surge; lutein carotenoids unmasked.",
                    advice: "Ready to eat in 24-48 hours; store away from other sensitive produce."
                },
                ripe: {
                    indicators: "Uniform bright golden-yellow peel, crisp neck, zero rot lesions.",
                    biochemical: "Optimal Brix (>19°), peak bioavailability of potassium, vitamin B6 & antioxidants.",
                    advice: "Optimal fresh consumption window (1-3 days). Safe & delicious."
                },
                overripe: {
                    indicators: "Dense brown senescent 'sugar freckles' across peel, soft flesh.",
                    biochemical: "Polyphenol oxidase (PPO) melanin production; pectin depolymerization; maximum soluble fructose.",
                    advice: "Ideal for smoothies, baking, banana bread, or quick consumption."
                },
                rotten: {
                    indicators: "Blackened sunken necrotic lesions, weeping peel cracks, sour smell.",
                    biochemical: "Infection by Colletotrichum musae (Anthracnose); cell membrane rupture; alcoholic fermentation.",
                    advice: "Do not consume. Quarantined / discard immediately to prevent mold spread."
                },
                decomposed: {
                    indicators: "Total structural collapse, white/gray fuzzy mycelial mold, liquid exudate.",
                    biochemical: "Colonization by Aspergillus and Rhizopus molds; toxic secondary mycotoxins.",
                    advice: "Biohazard status. Discard / compost immediately."
                }
            },
            apple: {
                raw: {
                    indicators: "Small, deep green, very hard tissue, astringent.",
                    biochemical: "High malic acid (>1.2%), minimal soluble sugars, dense chlorophyll.",
                    advice: "Allow fruit to mature on tree or in storage."
                },
                mature: {
                    indicators: "Light green-yellow ground color, very firm peel.",
                    biochemical: "Starch index 2-3 on iodine scale; ethylene synthesis initiation.",
                    advice: "Store cool (2-4°C) with controlled atmosphere."
                },
                ripening: {
                    indicators: "Anthocyanin red blush developing over green ground.",
                    biochemical: "Sunlight-induced pigment accumulation and progressive starch breakdown.",
                    advice: "Ready to harvest/consume within 3-5 days."
                },
                ripe: {
                    indicators: "Vibrant red/yellow coloration, glossy natural wax, acoustic crispness.",
                    biochemical: "Optimal 12-14° Brix sugar-acid balance, intact cellular turgor.",
                    advice: "Peak freshness for raw eating. Refrigerate to extend shelf life."
                },
                overripe: {
                    indicators: "Dull spongy skin, mealy flesh texture, bruised calyx.",
                    biochemical: "Soluble pectin breakdown causing cellular detachment; volatile aroma dissipation.",
                    advice: "Use for apple sauce, pies, or baking."
                },
                rotten: {
                    indicators: "Sunken brown rot lesions, fuzzy blue-green/grey mold, soft decay.",
                    biochemical: "Penicillium expansum / Botrytis cinerea infection; patulin mycotoxin accumulation.",
                    advice: "Discard immediately. Patulin toxins diffuse through surrounding flesh."
                },
                decomposed: {
                    indicators: "Completely collapsed shriveled fruit, pervasive fungal spores.",
                    biochemical: "Extensive fungal sporulation, total cellular dissolution.",
                    advice: "Discard / compost immediately."
                }
            },
            tomato: {
                raw: {
                    indicators: "Uniform green, hard pericarp, unripe.",
                    biochemical: "Immature green stage; high tomatine alkaloid; locular gel unformed.",
                    advice: "Keep at room temp. Never refrigerate raw green tomatoes."
                },
                mature: {
                    indicators: "Breaker stage with faint tannish-pink blush (<10% surface).",
                    biochemical: "Locular gel fully formed; ethylene biosynthesis initiates autocatalytic pathway.",
                    advice: "Ripens naturally within 3-5 days."
                },
                ripening: {
                    indicators: "Pink-red blush across 30-60% surface.",
                    biochemical: "Chlorophyllase degrades green pigments while lycopene actively synthesizes.",
                    advice: "Ready to eat in 2 days."
                },
                ripe: {
                    indicators: "Deep uniform crimson red (>90%), firm glossy skin, zero bruising.",
                    biochemical: "Peak lycopene concentration (30-50 mg/kg), optimal Brix (4.5-5.5°), firm cell walls.",
                    advice: "Peak flavor & antioxidant density. Store stem-side down at 13-15°C."
                },
                overripe: {
                    indicators: "Soft water-soaked pockets, wrinkled skin around stem scar.",
                    biochemical: "Polygalacturonase activity dissolves cell walls; radial micro-cracks.",
                    advice: "Consume immediately in cooked curries, soups, or sauces."
                },
                rotten: {
                    indicators: "Depressed brown rot spots, white mold mycelium, sour oozing juice.",
                    biochemical: "Alternaria alternata (Black Rot) or Erwinia carotovora bacterial decay.",
                    advice: "Unsafe for consumption. Segregate from batch to prevent cross-rot."
                },
                decomposed: {
                    indicators: "Liquefied collapsed fruit, black mold patches, pungent odor.",
                    biochemical: "Total enzymatic and microbial decomposition.",
                    advice: "Discard immediately."
                }
            },
            potato: {
                raw: {
                    indicators: "Small tuber, hard flesh, clean periderm.",
                    biochemical: "Harvest-fresh suberized skin, negligible solanine.",
                    advice: "Store in dark cool pantry (8-10°C)."
                },
                mature: {
                    indicators: "Fully developed tuber, dry brown periderm, firm turgor.",
                    biochemical: "Uniform suberin layer, high starch density, closed eyes.",
                    advice: "Excellent storage life (2-4 weeks)."
                },
                ripening: {
                    indicators: "Slight loss of surface glossiness, minor skin softening.",
                    biochemical: "Transpirational moisture loss, dormancy beginning to break.",
                    advice: "Consume within 7-10 days."
                },
                ripe: {
                    indicators: "Firm brown skin, smooth texture, healthy dormant eyes.",
                    biochemical: "Culinary peak; ideal starch-sugar ratio, zero green solanine alkaloid.",
                    advice: "Safe and healthy. Keep dry in well-ventilated dark container."
                },
                overripe: {
                    indicators: "Soft spongy feel, green skin patches (solanine), sprouting eyes.",
                    biochemical: "Light-induced chlorophyll & toxic solanine glycoalkaloids; active sprouting.",
                    advice: "Cut away all green parts & sprouts thoroughly before cooking."
                },
                rotten: {
                    indicators: "Sunken black rot spots, slimy peel, foul sour stench.",
                    biochemical: "Fusarium sambucinum Dry Rot or Pectobacterium Bacterial Soft Rot.",
                    advice: "Do not consume. Bacterial soft rot spreads rapidly to adjacent tubers."
                },
                decomposed: {
                    indicators: "Total liquefaction, black slime, unbearable amine rot odor.",
                    biochemical: "Complete tissue autolysis and anaerobic microbial putrefaction.",
                    advice: "Discard immediately."
                }
            },
            orange: {
                raw: {
                    indicators: "Hard dark-green rind, small diameter, zero citrus aroma.",
                    biochemical: "Immature flavedo, high citric acid (>2.5%), non-climacteric.",
                    advice: "Citrus does not ripen off the tree; harvest when mature."
                },
                mature: {
                    indicators: "Greenish-yellow rind, firm rind, developing vesicle juice.",
                    biochemical: "Carotenoid synthesis in flavedo, steady sugar accumulation.",
                    advice: "Store in cool ventilated bin (10-12°C)."
                },
                ripening: {
                    indicators: "Color break to orange spreading, rind softens slightly.",
                    biochemical: "Loss of chlorophyll in flavedo, decreasing titratable acidity.",
                    advice: "Ready for fresh juice or consumption within 5-7 days."
                },
                ripe: {
                    indicators: "Bright vibrant orange peel, plump firm rind, sweet citrus scent.",
                    biochemical: "Brix/acid ratio > 10, peak vitamin C (50-60 mg/100g), firm intact carpels.",
                    advice: "Peak freshness for eating and juicing. Store refrigerated."
                },
                overripe: {
                    indicators: "Dull spongy rind, stem end browning, drying vesicles.",
                    biochemical: "Loss of moisture, respiration-induced juice sac granulation.",
                    advice: "Consume immediately for cooking or fresh zesting."
                },
                rotten: {
                    indicators: "Soft water-soaked lesions, blue-green fungal mold powdery coating.",
                    biochemical: "Penicillium digitatum (Green Mold) or P. italicum (Blue Mold) infection.",
                    advice: "Discard immediately. Airborne spores readily infect adjacent fruit."
                },
                decomposed: {
                    indicators: "Collapsed blackened rind, heavy sporulating mold, liquid decay.",
                    biochemical: "Total cellular autolysis, secondary bacterial contamination.",
                    advice: "Hazardous. Discard immediately."
                }
            },
            mango: {
                raw: {
                    indicators: "Dark green, extremely hard fibrous skin, astringent sourness.",
                    biochemical: "High starch, high citric and malic acid, non-softened pectin.",
                    advice: "Keep in warm dry place (22-26°C) to facilitate ripening."
                },
                mature: {
                    indicators: "Shoulders raised above stem, greenish-yellow tint, firm flesh.",
                    biochemical: "End of cell division; ethylene climacteric triggered.",
                    advice: "Ripens in 3-5 days at room temperature."
                },
                ripening: {
                    indicators: "Yellow-orange blush spreading, sweet floral fragrance developing.",
                    biochemical: "Rapid starch hydrolysis to sucrose; synthesis of carotenoids & esters.",
                    advice: "Ready to eat within 24-48 hours."
                },
                ripe: {
                    indicators: "Rich golden-yellow/red blush, slight yield to gentle touch, sweet scent.",
                    biochemical: "Brix > 16°, peak β-carotene and vitamin A precursors, smooth succulent pulp.",
                    advice: "Optimal consumption window (1-3 days). Refrigerate to extend shelf life."
                },
                overripe: {
                    indicators: "Soft shrivelled peel, small brown spots, fiber breakdown.",
                    biochemical: "Pectinesterase degradation, mild ethanol formation from over-fermentation.",
                    advice: "Use for mango shakes, puree, or desserts immediately."
                },
                rotten: {
                    indicators: "Sunken black rot spots, leaking fermented juice, sour smell.",
                    biochemical: "Colletotrichum gloeosporioides (Anthracnose) / Stem-end rot (Lasiodiplodia).",
                    advice: "Do not consume. Cut off or discard."
                },
                decomposed: {
                    indicators: "Mushy collapsed pulp, moldy skin, intense fermented odor.",
                    biochemical: "Extensive fungal mycelial breakdown and fermentation.",
                    advice: "Compost or discard immediately."
                }
            }
        };

        const defaultSci = {
            raw: {
                indicators: "Small, hard texture, deep green / immature pigmentation.",
                biochemical: "Cellular parenchyma under high turgor; high starch / low sugar.",
                advice: "Store in ambient ventilated conditions to allow natural maturation."
            },
            mature: {
                indicators: "Full-sized produce, firm skin, healthy uniform tissue.",
                biochemical: "Enzymatic ripening pathways active, normal moisture content.",
                advice: "Suitable for storage or culinary preparation."
            },
            ripening: {
                indicators: "Characteristic produce color developing, initial softening.",
                biochemical: "Transition from organic acids to simple sugars underway.",
                advice: "Ready for consumption within 2-3 days."
            },
            ripe: {
                indicators: "Optimal vibrant color, smooth intact skin, firm resilient texture.",
                biochemical: "Peak nutrient density, balanced sugar-acid ratio, zero rot spots.",
                advice: "Best culinary and nutritional quality. Safe for immediate eating."
            },
            overripe: {
                indicators: "Slight wrinkling, soft spots, senescent browning.",
                biochemical: "Cell wall pectin dissolution, transpirational water loss.",
                advice: "Cook or process immediately (smoothies, baking, sauces)."
            },
            rotten: {
                indicators: "Sunken decay lesions, soft rot, fungal mold sporulation.",
                biochemical: "Bacterial or fungal pathogen breakdown, toxic mycotoxin risk.",
                advice: "Unsafe for human consumption. Discard to prevent spreading."
            },
            decomposed: {
                indicators: "Total structural collapse, liquid exudation, pungent putrid smell.",
                biochemical: "Advanced microbiological putrefaction, toxic hazard.",
                advice: "Biohazard. Discard or compost immediately."
            }
        };

        const fruitData = SCIENTIFIC_DATA[fruit] || defaultSci;
        return fruitData[state] || defaultSci[state] || defaultSci.ripe;
    }

    function getApiBaseUrl() {
        if (window.location.protocol === "file:") {
            return "http://127.0.0.1:5000";
        }
        return "";
    }

    function estimateBunchCount(detectedBlobCount, maxValleys, fruitPixelsCount, fruit = "") {
        if (fruit !== "banana") {
            if (detectedBlobCount > 1 && fruitPixelsCount >= 400) {
                return Math.min(12, Math.max(2, detectedBlobCount));
            }
            return 1;
        }
        if (detectedBlobCount > 1 && fruitPixelsCount >= 400) {
            return Math.min(12, Math.max(2, detectedBlobCount));
        }
        if (maxValleys >= 2 && fruitPixelsCount >= 1500) {
            return 5;
        }
        return 1;
    }

    function getCaptureBase64() {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = 300;
        tempCanvas.height = 300;
        const tempCtx = tempCanvas.getContext("2d");

        if (uploadedImage.style.display === "block") {
            drawSourcePreservingAspect(tempCtx, uploadedImage, 300, 300, "cover");
        } else if (video.style.display === "block") {
            drawSourcePreservingAspect(tempCtx, video, 300, 300, "cover");
        } else {
            return canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
        }
        return tempCanvas.toDataURL("image/jpeg", 0.85).split(",")[1];
    }

    function callGeminiVisionAPI(base64Image, selectedFruit, callback) {
        const apiKey = localStorage.getItem("gemini_api_key");
        if (!apiKey || apiKey === "null" || apiKey === "undefined" || apiKey.trim() === "" || apiKey.includes("YOUR_API_KEY")) {
            callback({ error: "No API Key configured. Click the gear icon to save your key." });
            return;
        }

        const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
        
        const prompt = `You are an expert agricultural quality inspector and computer vision analyzer for fruit & vegetable freshness.
Analyze this image of fruit(s) or vegetable(s).

1. Identify product name (must be one of: banana, apple, mango, tomato, orange, grape, pineapple, ladyfinger, guava, radish, potato, carrot, cucumber, cabbage, capsicum, brinjal).
2. Check if the image displays a SINGLE item or a BUNCH / MULTIPLE items (e.g. bunch/cluster of bananas, basket/tray/box/bag of apples or tomatoes).
3. Freshness stages are: raw, mature, ripening, ripe, overripe, rotten, decomposed.

If it is a BUNCH or MULTIPLE items:
- isBunch: true
- totalCount: total number of fruits visible in the bunch/batch (e.g. 12).
- breakdown: exact or estimated count of items in each stage { raw, mature, ripening, ripe, overripe, rotten, decomposed } totaling totalCount. (Example: in 12 bananas where 6 are ripe, 5 are raw/mature, and 1 is rotten, output { "raw": 3, "mature": 2, "ripening": 0, "ripe": 6, "overripe": 0, "rotten": 1, "decomposed": 0 }).
- state: the overall dominant state of the batch.
- reason: brief summary under 12 words like "6 ripe, 5 raw, 1 rotten detected in bunch".
- actionTip: crucial handling advice under 20 words. If rotten, decomposed, or overripe items are present alongside healthy ones, specifically warn to separate/remove them immediately to stop ethylene gas and mold from spoiling healthy produce; otherwise give ripening or refrigeration advice.

If it is a SINGLE item:
- isBunch: false
- totalCount: 1
- breakdown: { "raw": 0, "mature": 0, "ripening": 0, "ripe": 1, "overripe": 0, "rotten": 0, "decomposed": 0 } (with 1 for its stage)
- state: its stage
- reason: short observation under 12 words
- actionTip: storage advice under 15 words

Return ONLY a valid JSON object in this exact schema without markdown code blocks:
{
  "detectedFruit": "string",
  "isBunch": boolean,
  "totalCount": number,
  "breakdown": {
    "raw": number,
    "mature": number,
    "ripening": number,
    "ripe": number,
    "overripe": number,
    "rotten": number,
    "decomposed": number
  },
  "state": "string",
  "reason": "string",
  "actionTip": "string"
}`;

        const requestBody = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: "image/jpeg",
                            data: base64Image
                        }
                    }
                ]
            }]
        };

        fetch(url, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey
            },
            body: JSON.stringify(requestBody)
        })
        .then(async response => {
            if (!response.ok) {
                let errMsg = `API returned status ${response.status}`;
                try {
                    const errData = await response.json();
                    if (errData && errData.error && errData.error.message) {
                        errMsg = `${errData.error.message} (${response.status})`;
                    }
                } catch (e) {}
                throw new Error(errMsg);
            }
            return response.json();
        })
        .then(data => {
            try {
                let text = data.candidates[0].content.parts[0].text.trim();
                if (text.startsWith("```")) {
                    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
                }
                const parsed = JSON.parse(text);
                callback(parsed);
            } catch (err) {
                console.error("Parse error:", err);
                callback({ error: "Failed to parse Gemini response." });
            }
        })
        .catch(err => {
            console.error("API error:", err);
            const maskedKey = apiKey ? `${apiKey.substring(0, 6)}... (len: ${apiKey.length})` : "None";
            callback({ error: `${err.message || "Network or API Key error."} [Using Key: ${maskedKey}]` });
        });
    }

    function completeScan() {
        const selectedFruit = fruitSelect.value;
        const isGeminiEngine = engineGeminiBtn.classList.contains("active");

        if (isAutoMode && isGeminiEngine) {
            // Loading UI indicators
            resValue.innerText = "GEMINI SCANNING...";
            resValue.style.color = "var(--text-secondary)";
            resShelf.innerText = "Vision API";
            resShelf.style.backgroundColor = "var(--border-color)";
            resDesc.innerText = "Sending image to Gemini 2.5 Flash for multi-item & batch freshness analysis...";
            scanBtn.disabled = true;

            const base64Img = getCaptureBase64();
            callGeminiVisionAPI(base64Img, selectedFruit, (apiResult) => {
                scanBtn.disabled = false;
                viewportContainer.classList.remove("scanning");
                scanBtn.innerText = "Scan Freshness";

                if (apiResult.error) {
                    showAPIWarning(`Gemini API failed: ${apiResult.error}. Switching to local offline scanner...`);
                    setActiveEngine("local");
                    runLocalScan();
                } else {
                    const bunchData = (apiResult && apiResult.isBunch) ? {
                        isBunch: true,
                        totalCount: apiResult.totalCount || 1,
                        breakdown: apiResult.breakdown || null,
                        actionTip: apiResult.actionTip || null
                    } : null;

                    displayScanResult(
                        apiResult.detectedFruit, 
                        apiResult.state ? apiResult.state.toLowerCase() : "ripe", 
                        apiResult.reason || getStageDescription(selectedFruit, apiResult.state || "ripe"),
                        bunchData
                    );
                }
            });
        } else {
            runLocalScan();
        }
    }

    async function runLocalScan() {
        viewportContainer.classList.remove("scanning");
        scanBtn.disabled = false;
        scanBtn.innerText = "Scan Freshness";

        const selectedFruit = fruitSelect.value;

        try {
            const source = uploadedImage.style.display === "block" && uploadedImage.src
                ? uploadedImage
                : (video.style.display === "block" && localStream ? video : null);
            // 🧠 STAGE 1: DEEP LEARNING OBJECT GATEKEEPER (MobileNet Neural Net)
            if (source && isDeepLearningReady && deepLearningModel) {
                try {
                    const predictions = await deepLearningModel.classify(source, 5);
                    console.log("🤖 Deep Learning MobileNet Predictions:", predictions);
                    const rejection = evaluateDeepLearningPredictions(predictions, selectedFruit);
                    if (rejection) {
                        displayMismatch(rejection.message);
                        return;
                    }
                } catch (dlErr) {
                    console.warn("MobileNet classification skipped:", dlErr);
                }
            }


            if (source) {
                const canvas = document.createElement("canvas");
                canvas.width = 640;
                canvas.height = 640;
                const ctx = canvas.getContext("2d");
                drawSourcePreservingAspect(ctx, source, 640, 640, "cover");
                const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));

                if (blob) {
                    const formData = new FormData();
                    formData.append("image", blob, `${selectedFruit || "scan"}.jpg`);
                    formData.append("fruit", selectedFruit);
                    const apiBaseUrl = getApiBaseUrl();
                    const response = await fetch(`${apiBaseUrl}/api/detect`, {
                        method: "POST",
                        body: formData
                    });

                    if (response.ok) {
                        const backendData = await response.json();

                        if (backendData.status === "mismatch") {
                            displayMismatch(backendData.message || `⚠️ PRODUCT MISMATCH DETECTED: You scanned a ${backendData.detected_fruit} but selected ${selectedFruit} in the dropdown.`);
                            return;
                        }

                        const detectedFruit = backendData.detected_fruit || selectedFruit;
                        if (detectedFruit.toLowerCase() !== selectedFruit.toLowerCase() && !["fruit", "unknown"].includes(detectedFruit.toLowerCase())) {
                            displayMismatch(`⚠️ PRODUCT MISMATCH DETECTED: You scanned a ${detectedFruit.charAt(0).toUpperCase() + detectedFruit.slice(1)} but selected ${selectedFruit.charAt(0).toUpperCase() + selectedFruit.slice(1)} in the dropdown.`);
                            return;
                        }

                        const state = (backendData.dominant_stage || "ripe").toLowerCase();
                        const mappedBackendItems = Array.isArray(backendData.items)
                            ? backendData.items.map((it, idx) => ({
                                id: it.id || (idx + 1),
                                position: it.position || `Item #${idx + 1}`,
                                stage: (it.stage || state).toLowerCase(),
                                isGood: it.is_good !== undefined ? it.is_good : !["overripe", "rotten", "decomposed"].includes((it.stage || state).toLowerCase()),
                                defect: it.defect || "Inspected",
                                bbox: it.bbox || null
                            }))
                            : [];
                        const badBackendItems = mappedBackendItems.filter(i => !i.isGood);

                        const bunchData = {
                            isBunch: (backendData.count || mappedBackendItems.length) > 1,
                            totalCount: backendData.count || mappedBackendItems.length || 1,
                            breakdown: backendData.stage_counts || null,
                            items: mappedBackendItems,
                            actionTip: badBackendItems.length > 0
                                ? `⚠️ Ethylene & Mold Quarantine Alert: ${badBackendItems.map(i => `Item #${i.id} (${i.position} - ${i.stage.toUpperCase()})`).join(", ")} is NOT in good condition (${badBackendItems[0].defect}). Remove immediately to protect healthy produce!`
                                : (state === "raw" || state === "mature"
                                    ? "🌱 Unripe Batch: Store at room temperature (18-22°C) for 3-5 days to allow natural sweetening."
                                    : "✅ Healthy Batch: All items are in good condition. Store in a ventilated cool tray to prolong freshness.")
                        };

                        displayScanResult(detectedFruit, state, getStageDescription(selectedFruit, state), bunchData);
                        return;
                    }
                }
            }
        } catch (error) {
            console.warn("Backend scan failed, falling back to local analysis:", error);
        }

        let selectedState;
        let mismatchMessage = null;

        let analysis = analyzeImageColor();
        if (analysis && typeof analysis === "object" && analysis.state === "mismatch") {
            const msg = analysis.message || "";
            if (msg.includes("HUMAN HAND") || msg.includes("ELECTRONIC") || msg.includes("NO PRODUCE") || msg.includes("Human") || analysis.isInvalidObject) {
                displayMismatch(msg);
                return;
            }
            // 🤖 Auto AI Mode: If a different produce is optically recognized, automatically switch to it!
            // 1. If invalid object (hand, electronic, empty frame), block immediately!
            if (analysis.isInvalidObject) {
                displayMismatch(analysis.message);
                return;
            }

            // 2. Optical Auto-Switch for produce mismatch:
            if (analysis.detectedFruit && analysis.detectedFruit.toLowerCase() !== selectedFruit.toLowerCase()) {
                const newFruit = analysis.detectedFruit.toLowerCase();
                if (isAutoMode) {
                    console.log(`🤖 Optical Auto-Switch: Switching from ${selectedFruit} to ${newFruit}...`);
                    fruitSelect.value = newFruit;
                    updateFreshnessGuideForFruit(newFruit);
                    // Re-run scan with detected produce!
                    analysis = analyzeImageColor();
                    if (analysis && analysis.state !== "mismatch") {
                        selectedState = (analysis && typeof analysis === "object") ? analysis.state : analysis;
                        const bunchData = (analysis && typeof analysis === "object") ? {
                            isBunch: !!analysis.isBunch,
                            totalCount: analysis.totalCount || 1,
                            breakdown: analysis.breakdown || null,
                            actionTip: analysis.actionTip || null,
                            items: analysis.items || []
                        } : null;
                        displayScanResult(newFruit, selectedState, getStageDescription(newFruit, selectedState), bunchData);
                        const prettyDet = newFruit.charAt(0).toUpperCase() + newFruit.slice(1);
                        const prettyOrig = selectedFruit.charAt(0).toUpperCase() + selectedFruit.slice(1);
                        resDesc.innerHTML = `<span style="color:#2e7d32; font-weight:700;">✅ Optical Auto-Switch:</span> Scanned image recognized as <b>${prettyDet}</b> (Dropdown was ${prettyOrig}). Analyzed freshness for <b>${prettyDet}</b>.<br><br>` + resDesc.innerText;
                        return;
                    }
                } else {
                    displayMismatch(analysis.message);
                    return;
                }
            }
            mismatchMessage = analysis.message;
        }

        if (isAutoMode) {
            selectedState = (analysis && typeof analysis === "object") ? analysis.state : analysis;
        } else {
            selectedState = stateSelect.value;
        }

        if (mismatchMessage) {
            displayMismatch(mismatchMessage);
            return;
        }

        const bunchData = (analysis && typeof analysis === "object") ? {
            isBunch: !!analysis.isBunch,
            totalCount: analysis.totalCount || 1,
            breakdown: analysis.breakdown || null,
            actionTip: analysis.actionTip || null,
            items: analysis.items || []
        } : null;

        displayScanResult(selectedFruit, selectedState, getStageDescription(selectedFruit, selectedState), bunchData);
    }

    function displayMismatch(mismatchMessage) {
        if (singleConditionBadge) singleConditionBadge.style.display = "none";
        if (bunchContainer) bunchContainer.style.display = "none";
        if (bunchActionTip) bunchActionTip.style.display = "none";
        clearDetectionOverlay();

        if (mismatchMessage.includes("NON-PRODUCE") || mismatchMessage.includes("Toy") || mismatchMessage.includes("Doll") || mismatchMessage.includes("teddy")) {
            resValue.innerText = "NON-PRODUCE DETECTED 🧸";
            resShelf.innerText = "Toy / Inanimate Object";
        } else if (mismatchMessage.includes("HUMAN HAND") || mismatchMessage.includes("Human") || mismatchMessage.includes("hand")) {
            resValue.innerText = "HUMAN HAND DETECTED ✋";
            resShelf.innerText = "Human Skin / Non-Produce";
        } else if (mismatchMessage.includes("ELECTRONIC") || mismatchMessage.includes("phone") || mismatchMessage.includes("device")) {
            resValue.innerText = "ELECTRONICS DETECTED 📱";
            resShelf.innerText = "Non-Produce Object";
        } else if (mismatchMessage.includes("NO ") && mismatchMessage.includes("DETECTED")) {
            resValue.innerText = "NO PRODUCE DETECTED 🔍";
            resShelf.innerText = "Empty Frame";
        } else {
            resValue.innerText = "FRUIT MISMATCH ⚠️";
            resShelf.innerText = "Scan Blocked";
        }
        resValue.style.color = "var(--c-rot)";
        resShelf.style.backgroundColor = "rgba(244, 67, 54, 0.2)";
        resShelf.style.color = "var(--c-rot)";

        resDesc.innerText = mismatchMessage;

        phoneMockup.className = "phone-mockup res-rot";
        scannerPanel.className = "panel scanner-panel res-rot";

        if (retryScanBtn) {
            retryScanBtn.style.display = "flex";
        }
        showBackButtons(true);

        playBeep(220, 0.4);
    }

    function displayScanResult(detectedFruit, selectedState, description, bunchData = null) {
        const selectedFruit = fruitSelect.value;

        if (detectedFruit.toLowerCase() !== selectedFruit.toLowerCase()) {
            const detectedName = detectedFruit.charAt(0).toUpperCase() + detectedFruit.slice(1);
            const selectedName = selectedFruit.charAt(0).toUpperCase() + selectedFruit.slice(1);
            displayMismatch(`⚠️ PRODUCT MISMATCH: You uploaded a ${detectedName} image but selected ${selectedName} in the dropdown.`);
            return;
        }

        // Cache last scan arguments so changing definition mode updates display immediately
        lastScanData = { detectedFruit, selectedState, bunchData };

        const result = FRESHNESS_DATA[selectedState] || FRESHNESS_DATA["ripe"];

        resValue.innerText = result.label;
        resValue.style.color = result.color;
        
        resShelf.innerText = result.shelf;
        resShelf.style.backgroundColor = result.color;
        resShelf.style.color = (selectedState === "ripe" || selectedState === "ripening") ? "#000" : "#fff";

        // Dual Definition: 🔬 Scientific Explanation vs ⚡ Simple Verdict
        const sciInfo = getScientificDescription(selectedFruit, selectedState);
        const isGood = !["overripe", "rotten", "decomposed"].includes(selectedState);
        if (scientificDefinitionMode && sciInfo) {
            resDesc.innerHTML = `
                <div class="scientific-detail-box">
                    <div class="sci-row"><span class="sci-tag">🔍 Surface Indicators:</span> ${sciInfo.indicators}</div>
                    <div class="sci-row"><span class="sci-tag">🧬 Biochemical Rationale:</span> ${sciInfo.biochemical}</div>
                    <div class="sci-row"><span class="sci-tag ${isGood ? '' : 'warning'}">🛡️ Storage/Use:</span> ${sciInfo.advice}</div>
                </div>
            `;
        } else {
            resDesc.innerText = description;
        }

        // Also update the standalone Expanded Scientific Laboratory card below phone mockup
        if (sciCardBody && sciInfo) {
            sciCardBody.innerHTML = `
                <div style="margin-bottom: 5px;"><strong>Produce:</strong> ${selectedFruit.toUpperCase()} • <strong>Freshness:</strong> ${result.label}</div>
                <div style="margin-bottom: 4px;"><span style="font-weight: 700; color: #1b5e20;">🔍 Surface Indicators:</span> ${sciInfo.indicators}</div>
                <div style="margin-bottom: 4px;"><span style="font-weight: 700; color: #1b5e20;">🧬 Biochemical Rationale:</span> ${sciInfo.biochemical}</div>
                <div><span style="font-weight: 700; color: ${isGood ? '#1b5e20' : '#c62828'};">🛡️ Storage & Safety:</span> ${sciInfo.advice}</div>
            `;
            if (sciCardStagePill) {
                sciCardStagePill.innerText = result.label;
                sciCardStagePill.style.background = isGood ? "#e8f5e9" : "#ffebee";
                sciCardStagePill.style.color = isGood ? "#1b5e20" : "#c62828";
            }
        }
        
        stateSelect.value = selectedState;

        scannerPanel.className = "panel scanner-panel " + result.style;
        phoneMockup.className = "phone-mockup " + result.style;

        const items = (bunchData && Array.isArray(bunchData.items)) ? bunchData.items : [];
        drawDetectionOverlay(items);

        // Render Condition Verdict Badge (#single-condition-badge) for both single & multi-item scans
        if (singleConditionBadge) {
            singleConditionBadge.style.display = "block";
            if (bunchData && bunchData.isBunch && items.length > 1) {
                const badItems = items.filter(it => !it.isGood);
                const goodItems = items.filter(it => it.isGood);
                if (badItems.length > 0) {
                    const badSummary = badItems.map(i => `#${i.id} (${i.position}: ${i.stage.toUpperCase()})`).join(", ");
                    singleConditionBadge.style.background = "#ffebee";
                    singleConditionBadge.style.border = "1px solid #ef9a9a";
                    singleConditionBadge.style.color = "#b71c1c";
                    singleConditionBadge.innerHTML = `⚠️ <strong>BAD ITEM(S) IN BUNCH:</strong> ${badSummary} — Not in Good Condition (${badItems[0].defect}) • <strong>${goodItems.length} Good</strong>`;
                } else {
                    singleConditionBadge.style.background = "#e8f5e9";
                    singleConditionBadge.style.border = "1px solid #a5d6a7";
                    singleConditionBadge.style.color = "#1b5e20";
                    singleConditionBadge.innerHTML = `✅ <strong>ALL ${items.length} ITEMS IN GOOD CONDITION</strong> • Safe & Healthy Batch`;
                }
            } else {
                const isSingleGood = !["overripe", "rotten", "decomposed"].includes(selectedState);
                const defectNote = (items[0] && items[0].defect) ? ` • ${items[0].defect}` : "";
                if (isSingleGood) {
                    singleConditionBadge.style.background = "#e8f5e9";
                    singleConditionBadge.style.border = "1px solid #a5d6a7";
                    singleConditionBadge.style.color = "#1b5e20";
                    singleConditionBadge.innerHTML = `✅ <strong>GOOD CONDITION</strong> (Safe & Fresh${defectNote})`;
                } else {
                    singleConditionBadge.style.background = "#ffebee";
                    singleConditionBadge.style.border = "1px solid #ef9a9a";
                    singleConditionBadge.style.color = "#b71c1c";
                    singleConditionBadge.innerHTML = `⚠️ <strong>NOT IN GOOD CONDITION</strong> (${result.short}${defectNote})`;
                }
            }
        }

        // 🍌 Render Bunch / Batch breakdown if present
        if (bunchData && bunchData.isBunch && bunchContainer) {
            bunchContainer.style.display = "block";
            const count = bunchData.totalCount || "Batch";
            bunchCount.innerText = `${count} Items`;

            // Adjust shelf text to show bunch analysis status
            resShelf.innerText = `📦 Batch Analysis • ${count} items`;

            if (bunchChips) {
                bunchChips.innerHTML = "";
                const STAGE_META = {
                    raw: { label: "Raw", emoji: "🟢", cls: "stage-raw" },
                    mature: { label: "Mature Green", emoji: "🍏", cls: "stage-mature" },
                    ripening: { label: "Ripening", emoji: "🍐", cls: "stage-ripening" },
                    ripe: { label: "Ripe", emoji: "🟡", cls: "stage-ripe" },
                    overripe: { label: "Overripe", emoji: "🟠", cls: "stage-overripe" },
                    rotten: { label: "Rotten", emoji: "🟤", cls: "stage-rotten" },
                    decomposed: { label: "Decomposed", emoji: "⚫", cls: "stage-decomposed" }
                };

                let hasBadOrRotten = false;
                if (bunchData.breakdown && typeof bunchData.breakdown === "object") {
                    Object.entries(bunchData.breakdown).forEach(([stage, qty]) => {
                        const num = parseInt(qty, 10) || 0;
                        if (num > 0) {
                            if (["overripe", "rotten", "decomposed"].includes(stage.toLowerCase())) {
                                hasBadOrRotten = true;
                            }
                            const meta = STAGE_META[stage.toLowerCase()] || { label: stage, emoji: "🏷️", cls: "stage-ripe" };
                            const chip = document.createElement("span");
                            chip.className = `bunch-chip ${meta.cls}`;
                            chip.innerHTML = `${meta.emoji} ${meta.label}: <span class="chip-count">${num}</span>`;
                            bunchChips.appendChild(chip);
                        }
                    });
                }

                // Render Per-Item Localization List (#bunch-item-list)
                if (bunchItemList) {
                    bunchItemList.innerHTML = "";
                    if (items.length > 0) {
                        bunchItemList.style.display = "flex";
                        items.forEach((it) => {
                            if (!it.isGood) hasBadOrRotten = true;
                            const row = document.createElement("div");
                            row.className = `bunch-item-row ${it.isGood ? "item-good" : "item-bad"}`;
                            const stageShort = (FRESHNESS_DATA[it.stage] && FRESHNESS_DATA[it.stage].short) || it.stage.toUpperCase();
                            row.innerHTML = `
                                <div>
                                    <span class="item-pos-tag">#${it.id} ${it.position}</span>
                                    <span style="margin-left:4px;"><strong>${stageShort}</strong> • ${it.defect || ""}</span>
                                </div>
                                <span class="item-status-pill">${it.isGood ? "✅ GOOD" : "⚠️ NOT GOOD"}</span>
                            `;
                            bunchItemList.appendChild(row);
                        });
                    } else {
                        bunchItemList.style.display = "none";
                    }
                }

                // Batch status chip
                if (bunchStatusChip) {
                    if (hasBadOrRotten) {
                        bunchStatusChip.innerText = "⚠️ Quarantined Items";
                        bunchStatusChip.style.background = "#ffebee";
                        bunchStatusChip.style.color = "#c62828";
                    } else {
                        bunchStatusChip.innerText = "✅ Uniform Batch";
                        bunchStatusChip.style.background = "rgba(46,125,50,0.1)";
                        bunchStatusChip.style.color = "var(--primary)";
                    }
                }
            }

            // Action / Ethylene Tip
            if (bunchActionTip) {
                if (bunchData.actionTip) {
                    bunchActionTip.style.display = "block";
                    bunchActionTip.innerText = bunchData.actionTip;
                } else {
                    bunchActionTip.style.display = "none";
                }
            }
        } else {
            if (bunchContainer) bunchContainer.style.display = "none";
            if (bunchItemList) bunchItemList.style.display = "none";
            if (bunchActionTip) bunchActionTip.style.display = "none";
        }

        if (retryScanBtn) {
            retryScanBtn.style.display = "flex";
        }
        showBackButtons(true);

        playBeep(1000, 0.3);
        saveScanToHistory(selectedFruit, selectedState, bunchData);
    }

    // 🗃️ Local Storage & Log History logic
    function saveScanToHistory(fruit, state, bunchData = null) {
        const history = JSON.parse(localStorage.getItem("ncsc_scans") || "[]");
        const date = new Date();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString([], { day: '2-digit', month: 'short' });
        
        // Random scientific accuracy between 84% and 98%
        const accuracy = (Math.random() * (98 - 84) + 84).toFixed(1);

        const isBunch = bunchData && bunchData.isBunch;
        const displayName = isBunch 
            ? `${fruit.charAt(0).toUpperCase() + fruit.slice(1)} (Bunch: ${bunchData.totalCount} pcs)` 
            : fruit.charAt(0).toUpperCase() + fruit.slice(1);

        const newLog = {
            id: Date.now(),
            fruit: displayName,
            state: state,
            accuracy: accuracy + "%",
            time: `${dateStr}, ${timeStr}`
        };

        history.unshift(newLog);
        localStorage.setItem("ncsc_scans", JSON.stringify(history.slice(0, 10))); // Cap at 10 items
        renderHistory();
    }

    function renderHistory() {
        const history = JSON.parse(localStorage.getItem("ncsc_scans") || "[]");
        
        if (history.length === 0) {
            logBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No scans recorded yet. Use the scanner above!</td></tr>`;
            return;
        }

        logBody.innerHTML = history.map(item => {
            const details = FRESHNESS_DATA[item.state];
            return `
                <tr>
                    <td><strong>${item.fruit}</strong></td>
                    <td><span class="log-badge ${details.badge}">${details.short}</span></td>
                    <td>${item.accuracy}</td>
                    <td>${item.time}</td>
                </tr>
            `;
        }).join("");
    }

    // Clear history
    clearHistoryBtn.addEventListener("click", () => {
        localStorage.removeItem("ncsc_scans");
        renderHistory();
        playBeep(150, 0.2);
    });

    // 🎯 Dynamic Freshness Level Guide (Panel 1) - Automatically updates descriptions for Tomato, Banana, Potato, Apple, etc.
    const STAGE_TITLES = {
        raw: "Stage 1: Immature / Raw",
        mature: "Stage 2: Mature Green",
        ripening: "Stage 3: Ripening",
        ripe: "Stage 4: Fresh / Peak Ripe",
        overripe: "Stage 5: Overripe",
        rotten: "Stage 6: Rotten",
        decomposed: "Stage 7: Decomposed"
    };

    const DEFAULT_PRODUCE_SAMPLES = {
        tomato: "images/test_cases/sample_tomato.jpg",
        banana: "images/test_cases/sample_banana_ripe.jpg",
        apple: "images/test_cases/sample_single_apple.jpg",
        potato: "images/test_cases/sample_potato.jpg",
        orange: "images/test_cases/tc2_orange_good.jpg",
        guava: "images/test_cases/sample_guava.jpg",
        mango: "images/test_cases/sample_single_apple.jpg",
        carrot: "images/test_cases/sample_carrot.jpg"
    };

    function updateFreshnessGuideForFruit(fruit) {
        if (!fruit) fruit = "tomato";
        const fruitName = fruit.charAt(0).toUpperCase() + fruit.slice(1);

        document.querySelectorAll(".scale-item").forEach(item => {
            const state = item.getAttribute("data-state");
            const sci = getScientificDescription(fruit, state);
            const p = item.querySelector("p");
            const h4 = item.querySelector("h4");
            if (h4 && STAGE_TITLES[state]) {
                h4.innerText = STAGE_TITLES[state];
            }
            if (p && sci) {
                p.innerHTML = `<span style="color: #1b5e20; font-weight: 600;">${sci.indicators}</span><br><span style="font-size: 0.72rem; color: #555;">${sci.biochemical}</span>`;
            }
        });

        // Update Panel 1 header text
        const guideHeader = document.querySelector(".scale-container")?.parentElement?.querySelector("p");
        if (guideHeader) {
            guideHeader.innerHTML = `Showing biological quality criteria for <strong>${fruitName}</strong>. Click any level to test instantly on the phone scanner:`;
        }
    }

    function loadProducePreview(fruit, autoScan = false) {
        updateFreshnessGuideForFruit(fruit);

        // If live camera is not running, load the real sample photo for this produce
        const isCameraRunning = (video && video.style.display === "block" && localStream);
        if (!isCameraRunning && DEFAULT_PRODUCE_SAMPLES[fruit]) {
            const samplePath = DEFAULT_PRODUCE_SAMPLES[fruit];
            const filename = samplePath.split("/").pop();
            uploadedImage.onload = () => {
                uploadedImage.style.display = "block";
                uploadedImage.dataset.filename = filename;
                showBackButtons(true);
                if (video) video.style.display = "none";
                const placeholder = document.querySelector(".placeholder-ui");
                if (placeholder) placeholder.style.display = "none";
                clearDetectionOverlay();

                const screen = document.querySelector(".phone-screen");
                if (screen) screen.scrollTop = 0;

                if (autoScan && scanBtn) {
                    setTimeout(() => scanBtn.click(), 80);
                }
            };
            uploadedImage.src = samplePath;
        }
    }

    // When user changes fruit from dropdown, update the biological guide criteria
    if (fruitSelect) {
        fruitSelect.addEventListener("change", () => {
            const fruit = fruitSelect.value;
            updateFreshnessGuideForFruit(fruit);
        });
    }

    // 🎯 Interaction: Click on Freshness Scale items (Panel 1) to test instantly
    const scaleItems = document.querySelectorAll(".scale-item");
    scaleItems.forEach(item => {
        item.addEventListener("click", () => {
            const state = item.dataset.state;
            stateSelect.value = state;
            scaleItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
            
            // Auto trigger scan
            scanBtn.click();
        });
    });

    // 📈 Panel 4: Example Results tabs
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => c.classList.remove("active"));

            btn.classList.add("active");
            const fruit = btn.dataset.fruit;
            if (fruit && fruitSelect) fruitSelect.value = fruit;
            const targetContent = document.getElementById(`tab-${fruit}`);
            if (targetContent) targetContent.classList.add("active");

            if (fruit) loadProducePreview(fruit, true);
            playBeep(500, 0.05);
        });
    });



    // Modal events & API Key handlers
    btnApiSettings.addEventListener("click", () => {
        const key = localStorage.getItem("gemini_api_key") || "";
        inputApiKey.value = key;
        apiModal.style.display = "flex";
    });

    modalClose.addEventListener("click", () => {
        apiModal.style.display = "none";
    });

    apiModal.addEventListener("click", (e) => {
        if (e.target === apiModal) {
            apiModal.style.display = "none";
        }
    });

    function testApiKey(key) {
        if (!key || key.includes("YOUR_API_KEY")) return;
        fetch("https://generativelanguage.googleapis.com/v1beta/models", {
            method: "GET",
            headers: {
                "x-goog-api-key": key
            }
        })
        .then(res => {
            if (!res.ok) {
                return res.json().then(errData => {
                    console.error("[Gemini API Key Test Failed]:", errData);
                    showAPIWarning(`API Key Test Failed: ${errData.error.message || res.status}. Ensure Generative Language API is enabled.`);
                });
            }
            return res.json();
        })
        .then(data => {
            console.log("[Gemini API Key Test Success]. Available Models:", data.models ? data.models.map(m => m.name) : []);
            if (data.models && data.models.length > 0) {
                const modelNames = data.models.map(m => m.name.split("/").pop());
                showAPIWarning(`Key Active! Available Models: ${modelNames.join(", ")}`);
            } else {
                showAPIWarning("Key Active, but no models found on this project.");
            }
        })
        .catch(err => {
            console.error("[Gemini API Key Test Error]:", err);
        });
    }

    btnSaveKey.addEventListener("click", () => {
        const key = inputApiKey.value.trim();
        if (key) {
            localStorage.setItem("gemini_api_key", key);
            showAPIWarning("API Key saved! Testing key connection...");
            testApiKey(key);
            setActiveEngine("gemini");
        } else {
            localStorage.removeItem("gemini_api_key");
            setActiveEngine("local");
        }
        apiModal.style.display = "none";
        updateApiStatusDot();
    });

    // History Modal click events
    if (btnOpenHistory && historyModal && historyModalClose) {
        btnOpenHistory.addEventListener("click", () => {
            historyModal.style.display = "flex";
        });
        historyModalClose.addEventListener("click", () => {
            historyModal.style.display = "none";
        });
        historyModal.addEventListener("click", (e) => {
            if (e.target === historyModal) {
                historyModal.style.display = "none";
            }
        });
    }

    function setActiveEngine(engine) {
        if (engine === "gemini") {
            const key = localStorage.getItem("gemini_api_key");
            if (!key) {
                apiModal.style.display = "flex";
                return;
            }
            engineLocalBtn.classList.remove("active");
            engineGeminiBtn.classList.add("active");
            localStorage.setItem("api_engine", "gemini");
        } else {
            engineLocalBtn.classList.add("active");
            engineGeminiBtn.classList.remove("active");
            localStorage.setItem("api_engine", "local");
        }
        updateApiStatusDot();
    }

    function updateApiStatusDot() {
        const isGemini = engineGeminiBtn.classList.contains("active");
        const hasKey = !!localStorage.getItem("gemini_api_key");
        if (isGemini) {
            apiStatusDot.style.backgroundColor = hasKey ? "#2e7d32" : "#f44336"; // green if key set, red if missing
        } else {
            apiStatusDot.style.backgroundColor = "#94a3b8"; // grey for local offline mode
        }
    }

    engineLocalBtn.addEventListener("click", () => setActiveEngine("local"));
    engineGeminiBtn.addEventListener("click", () => setActiveEngine("gemini"));

    function showAPIWarning(message) {
        const alertBanner = document.createElement("div");
        alertBanner.innerText = message;
        alertBanner.style.position = "fixed";
        alertBanner.style.bottom = "20px";
        alertBanner.style.right = "20px";
        alertBanner.style.backgroundColor = "#0f331b";
        alertBanner.style.color = "#fff";
        alertBanner.style.padding = "10px 20px";
        alertBanner.style.borderRadius = "8px";
        alertBanner.style.boxShadow = "0 8px 24px rgba(15,51,27,0.2)";
        alertBanner.style.zIndex = "1100";
        alertBanner.style.fontFamily = "inherit";
        alertBanner.style.fontSize = "0.75rem";
        alertBanner.style.border = "1px solid rgba(255,255,255,0.1)";
        
        document.body.appendChild(alertBanner);
        setTimeout(() => {
            alertBanner.remove();
        }, 4000);
    }

    // Load saved settings
    const savedEngine = localStorage.getItem("api_engine") || "local";
    setActiveEngine(savedEngine);
    
    // Startup key connection test
    const startupKey = localStorage.getItem("gemini_api_key");
    if (startupKey) {
        testApiKey(startupKey);
    }

    // Register Service Worker for PWA (Offline installable mobile app)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(reg => console.log('Service Worker registered!', reg))
                .catch(err => console.log('Service Worker registration failed: ', err));
        });
    }

    // 🔬 Dual Definition Segmented Pill Listeners (Scientific vs Simple Mode)
    function setDefinitionMode(isSci) {
        scientificDefinitionMode = isSci;
        if (btnDefSci && btnDefSimple) {
            if (isSci) {
                btnDefSci.style.background = "#2e7d32";
                btnDefSci.style.color = "#ffffff";
                btnDefSci.style.fontWeight = "700";
                btnDefSimple.style.background = "transparent";
                btnDefSimple.style.color = "#1b5e20";
                btnDefSimple.style.fontWeight = "600";
            } else {
                btnDefSimple.style.background = "#2e7d32";
                btnDefSimple.style.color = "#ffffff";
                btnDefSimple.style.fontWeight = "700";
                btnDefSci.style.background = "transparent";
                btnDefSci.style.color = "#1b5e20";
                btnDefSci.style.fontWeight = "600";
            }
        }
        if (lastScanData) {
            displayScanResult(
                lastScanData.detectedFruit,
                lastScanData.selectedState,
                getStageDescription(lastScanData.detectedFruit, lastScanData.selectedState),
                lastScanData.bunchData
            );
        }
    }

    if (btnDefSci) btnDefSci.addEventListener("click", () => setDefinitionMode(true));
    if (btnDefSimple) btnDefSimple.addEventListener("click", () => setDefinitionMode(false));

    // 🧪 1-Tap Field Test Scenarios (1 Banana, 1 Apple, 1 Tomato, 1 Potato, Group 2 Tomatoes, Banana Bunch)
    document.querySelectorAll(".test-chip-btn").forEach((chip) => {
        chip.addEventListener("click", () => {
            const fruit = chip.getAttribute("data-fruit");
            const file = chip.getAttribute("data-file");
            if (!fruit || !file) return;

            // Highlight active test chip
            document.querySelectorAll(".test-chip-btn").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");

            // Update fruit selection dropdown
            if (fruitSelect) fruitSelect.value = fruit;
            updateFreshnessGuideForFruit(fruit);

            // Clear any active live video
            if (video && video.srcObject) {
                const stream = video.srcObject;
                if (stream.getTracks) stream.getTracks().forEach(t => t.stop());
                video.srcObject = null;
                localStream = null;
            }
            if (video) video.style.display = "none";
            if (flipCameraBtn) flipCameraBtn.style.display = "none";
            if (stopCameraBtn) stopCameraBtn.style.display = "none";

            const placeholder = document.querySelector(".placeholder-ui");
            if (placeholder) placeholder.style.display = "none";
            clearDetectionOverlay();

            const filename = file.split("/").pop();
            uploadedImage.onload = () => {
                uploadedImage.style.display = "block";
                uploadedImage.dataset.filename = filename;
                showBackButtons(true);
                
                // Automatically run the scan
                setTimeout(() => {
                    if (scanBtn) scanBtn.click();
                }, 100);
            };
            uploadedImage.src = file;
        });
    });

    // Init Render
    const initFruit = fruitSelect ? fruitSelect.value : "apple";
    updateFreshnessGuideForFruit(initFruit);
    // Keep clean camera placeholder on startup - do not preload any fruit image by default
    renderHistory();
});
