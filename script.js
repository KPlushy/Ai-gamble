document.addEventListener('DOMContentLoaded', () => {
    // --- Canvas Elements ---
    const mainWheelCanvas = document.getElementById('mainWheelCanvas');
    const mainCtx = mainWheelCanvas.getContext('2d');
    const riskyWheelCanvas = document.getElementById('riskyWheelCanvas');
    const riskyCtx = riskyWheelCanvas.getContext('2d');
    const demonWheelCanvas = document.getElementById('demonWheelCanvas');
    const demonCtx = demonWheelCanvas.getContext('2d');

    // --- Button Elements ---
    const spinMainWheelButton = document.getElementById('spin-main-wheel-button');
    const spinRiskyWheelButton = document.getElementById('spin-risky-wheel-button');
    const spinDemonWheelButton = document.getElementById('spin-demon-wheel-button');
    const autoSpinButton = document.getElementById('auto-spin-button');
    const resetButton = document.getElementById('reset-button');
    const navButtons = document.querySelectorAll('.nav-button');

    // --- Display Elements ---
    const pointsDisplay = document.getElementById('points-display');
    const multiplierDisplay = document.getElementById('multiplier-display');
    const spinSpeedDisplay = document.getElementById('spin-speed-display');
    const flatBonusDisplay = document.getElementById('flat-bonus-display');
    const goldenSpinStatusDisplay = document.getElementById('golden-spin-status-display');
    const negativeProtectionStatusDisplay = document.getElementById('negative-protection-status-display');
    const passiveIncomeDisplay = document.getElementById('passive-income-display');
    const messageDisplay = document.getElementById('message-display');

    // --- Shop Item Elements (selected, many more to get by ID) ---
    const pickupTrashButton = document.getElementById('pickup-trash');
    const upgradeMultiplierButton = document.getElementById('upgrade-multiplier');
    const upgradeSpinSpeedButton = document.getElementById('upgrade-spin-speed');
    const activateGoldenSpinButton = document.getElementById('activate-golden-spin');
    const rerollWheelValuesButton = document.getElementById('reroll-wheel-values');
    const unlockNegativeProtectionButton = document.getElementById('unlock-negative-protection');
    const upgradeFlatBonusButton = document.getElementById('upgrade-flat-bonus');
    const unlockAutoSpinButton = document.getElementById('unlock-auto-spin');
    const unlockRiskyWheelButton = document.getElementById('unlock-risky-wheel');
    const unlockDemonWheelButton = document.getElementById('unlock-demon-wheel');
    const getAJobButton = document.getElementById('get-a-job');
    const jobPromotionButton = document.getElementById('job-promotion');
    const jobShopSection = document.getElementById('job-shop');


    // --- Game Constants ---
    const baseSpinCostMainWheel = 25;
    const basePointsToStart = 50;
    const riskyWheelSpinCost = 1000;
    const demonWheelSpinCost = 100000000; // 100 Million

    // --- Game State Variables ---
    let points = 0;
    let currentAngleMain = 0, currentAngleRisky = 0, currentAngleDemon = 0;
    let isSpinning = { main: false, risky: false, demon: false }; // Track spinning per wheel

    // Main Wheel Stats
    let multiplierLevel = 1;
    let currentMultiplier = 1;
    let spinSpeedLevel = 1;
    let baseSpinDuration = 4000;
    let currentSpinDuration = baseSpinDuration;
    let isGoldenSpinActive = false;
    let goldenTicketPurchaseCount = 0;
    let negativeProtectionUnlocked = false;
    let flatBonusPoints = 0;
    let flatBonusLevel = 0;
    const maxFlatBonusLevel = 1000000;
    let autoSpinUnlocked = false;
    let mainWheelSegmentsInitial = [ // Keep initial for reset of reroll
        { text: '10', value: 10, color: '#3498db', type: 'numeric' }, { text: '50', value: 50, color: '#e67e22', type: 'numeric' },
        { text: '100', value: 100, color: '#2ecc71', type: 'numeric' }, { text: 'Try Again', value: 0, color: '#95a5a6', type: 'neutral' },
        { text: '25', value: 25, color: '#f1c40f', type: 'numeric' }, { text: 'JACKPOT! 250', value: 250, color: '#e74c3c', size: 0.5, type: 'numeric' },
        { text: '-500 PTS', value: 'fixed_deduction', amount: -500, color: '#7f8c8d', type: 'special_deduction' },
        { text: '5', value: 5, color: '#1abc9c', type: 'numeric' }, { text: '75', value: 75, color: '#9b59b6', type: 'numeric' },
        { text: 'BONUS 150', value: 150, color: '#d35400', type: 'numeric' },
    ];
    let mainWheelSegments = JSON.parse(JSON.stringify(mainWheelSegmentsInitial)); // Operative copy

    // Risky Wheel
    let riskyWheelUnlocked = false;
    const riskyWheelUnlockCost = 1000000;
    const riskyWheelSegments = [
        { text: '+100,000', value: 100000, color: '#2ecc71', type: 'numeric', size: 0.5 },
        { text: '-25,000', value: -25000, color: '#e74c3c', type: 'numeric' },
        { text: '+50,000', value: 50000, color: '#3498db', type: 'numeric' },
        { text: '-100,000', value: -100000, color: '#c0392b', type: 'numeric' },
        { text: '+10,000', value: 10000, color: '#1abc9c', type: 'numeric' },
        { text: '-500,000', value: -500000, color: '#d35400', type: 'numeric', size: 1.5 },
        { text: '+2,500', value: 2500, color: '#9b59b6', type: 'numeric' },
        { text: '-1,000,000', value: -1000000, color: '#34495e', type: 'numeric', size: 2 },
    ];

    // Demon Wheel
    let demonWheelUnlocked = false;
    const demonWheelUnlockCost = 100000000000; // 100 Billion
    const demonWheelSegments = [
        { text: 'LOSE ALL!', value: 'lose_all', color: '#000000', type: 'special_extreme', size: 1.5 },
        { text: '-500B PTS', value: -500000000000, color: '#4b0000', type: 'numeric_extreme' },
        { text: '-100B PTS', value: -100000000000, color: '#6e0000', type: 'numeric_extreme' },
        { text: '+1T PTS!!!', value: 1000000000000, color: '#FFD700', type: 'numeric_extreme', size: 0.2 }, // Trillion
        { text: '-10B PTS', value: -10000000000, color: '#8B0000', type: 'numeric_extreme', size: 2 },
        { text: '-1B PTS', value: -1000000000, color: '#A52A2A', type: 'numeric_extreme', size: 1.3},
    ];

    // Job / Passive Income
    let jobUnlocked = false;
    const jobUnlockCost = 10000;
    let jobLevel = 0; // 0 = no job, 1 = base job, 2+ = promotions
    let passiveIncomeRate = 0; // Points per second
    let passiveIncomeInterval = null;
    const jobPromotionConfig = { baseCost: 25000, costMultiplier: 2.5, ppsIncrease: 5 };

    // --- Shop Item Configs (updated) ---
    const multiplierConfig = { baseCost: 100, costMultiplier: 1.8 }; // No maxLevel
    const spinSpeedConfig = { baseCost: 150, costMultiplier: 1.7, durationReductionPerLevel: 300, minDuration: 200, maxLevel: 20 }; // minDuration 0.2s, maxLevel for practical cap
    const goldenTicketConfig = { baseCost: 5000, costMultiplier: 2.2, activationMultiplier: 100 };
    const rerollWheelCost = 1000; // Main wheel only
    const negativeProtectionCost = 7500;
    const flatBonusConfig = { baseCost: 50, costIncreasePerLevel: 100 };
    const autoSpinUnlockCost = 10000000;

    // --- Utility Functions ---
    function calculateRampingCost(base, multiplier, level) { return Math.floor(base * Math.pow(multiplier, level)); }
    function showMessage(text, duration = 3000, isError = false) {
        messageDisplay.textContent = text;
        messageDisplay.style.color = isError ? '#e74c3c' : '#f1c40f';
        if (duration > 0) setTimeout(() => messageDisplay.textContent = '', duration);
    }
    function easeOutCubic(t) { return (--t) * t * t + 1; }

    // --- Wheel Drawing ---
    function drawGenericWheel(ctx, canvasEl, segmentsArray, wheelName) {
        if (!ctx) { console.error(`No context for ${wheelName}`); return; }
        const totalSize = segmentsArray.reduce((sum, seg) => sum + (seg.size || 1), 0);
        let currentDrawAngle = 0;
        const centerX = canvasEl.width / 2;
        const centerY = canvasEl.height / 2;
        const radius = Math.min(centerX, centerY) - 8;

        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        segmentsArray.forEach(segment => {
            const angle = (segment.size || 1) / totalSize * 2 * Math.PI;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentDrawAngle, currentDrawAngle + angle);
            ctx.closePath();
            ctx.fillStyle = segment.color;
            ctx.fill();
            ctx.strokeStyle = '#1a2b3c'; ctx.lineWidth = 2; ctx.stroke();

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(currentDrawAngle + angle / 2);
            ctx.textAlign = 'right'; ctx.fillStyle = '#fff';
            ctx.font = (canvasEl.width > 380) ? 'bold 12px Arial' : 'bold 10px Arial'; // Smaller font for smaller wheels
            // Basic text length check for wrapping (very simple)
            let Stext = segment.text;
            if (Stext.length > 12 && wheelName !== "Demon Wheel") { // Demon wheel has specific large text
                 Stext = Stext.substring(0,10) + "..";
            } else if (Stext.length > 10 && wheelName === "Demon Wheel"){
                 ctx.font = 'bold 9px Arial'; // Even smaller for demon wheel long text
            }

            ctx.fillText(Stext, radius - 7, 4);
            ctx.restore();
            currentDrawAngle += angle;
        });
    }

    // --- Update Displays (Massive Expansion Needed) ---
    function updateDisplays() {
        pointsDisplay.textContent = points.toLocaleString();
        currentMultiplier = multiplierLevel;
        multiplierDisplay.textContent = `${currentMultiplier}x (Lv. ${multiplierLevel})`;
        spinSpeedDisplay.textContent = `Lv. ${spinSpeedLevel} (${(currentSpinDuration / 1000).toFixed(1)}s)`;
        flatBonusDisplay.textContent = `+${flatBonusPoints.toLocaleString()}`;
        goldenSpinStatusDisplay.textContent = isGoldenSpinActive ? "ACTIVE (100x Next!)" : "Inactive";
        goldenSpinStatusDisplay.style.color = isGoldenSpinActive ? "gold" : "#e0e7ef";
        negativeProtectionStatusDisplay.textContent = negativeProtectionUnlocked ? "ACTIVE" : "Inactive";
        negativeProtectionStatusDisplay.style.color = negativeProtectionUnlocked ? "lightgreen" : "#e0e7ef";
        passiveIncomeDisplay.textContent = `${passiveIncomeRate.toLocaleString()} PPS (Lv. ${jobLevel})`;

        // Button states (main wheel for now, expand for others)
        const canAffordMainSpin = points >= baseSpinCostMainWheel;
        spinMainWheelButton.disabled = isSpinning.main || !canAffordMainSpin || isGoldenSpinActive;
        if(isGoldenSpinActive) spinMainWheelButton.title = "Spin to use your Golden Spin!"; else spinMainWheelButton.title = "";
        autoSpinButton.disabled = isSpinning.main || !canAffordMainSpin || !autoSpinUnlocked || isGoldenSpinActive;

        spinRiskyWheelButton.disabled = isSpinning.risky || points < riskyWheelSpinCost || !riskyWheelUnlocked;
        spinDemonWheelButton.disabled = isSpinning.demon || points < demonWheelSpinCost || !demonWheelUnlocked;


        // --- Shop Item Updates ---
        pickupTrashButton.classList.remove('disabled');

        const nextMultiplierCost = calculateRampingCost(multiplierConfig.baseCost, multiplierConfig.costMultiplier, multiplierLevel);
        upgradeMultiplierButton.innerHTML = `Upgrade Multiplier (Lv. ${multiplierLevel + 1}) <br> Cost: ${nextMultiplierCost.toLocaleString()} P`;
        upgradeMultiplierButton.classList.toggle('disabled', points < nextMultiplierCost);

        const nextSpinSpeedCost = calculateRampingCost(spinSpeedConfig.baseCost, spinSpeedConfig.costMultiplier, spinSpeedLevel);
        upgradeSpinSpeedButton.innerHTML = `Upgrade Spin Speed (Lv. ${spinSpeedLevel + 1}) <br> Cost: ${nextSpinSpeedCost.toLocaleString()} P`;
        const atMaxSpeed = spinSpeedLevel >= spinSpeedConfig.maxLevel || currentSpinDuration <= spinSpeedConfig.minDuration;
        upgradeSpinSpeedButton.classList.toggle('disabled', points < nextSpinSpeedCost || atMaxSpeed);
        if (atMaxSpeed) upgradeSpinSpeedButton.innerHTML = `Upgrade Spin Speed (MAX Lv.) <br> -----`;

        const nextGoldenTicketCost = calculateRampingCost(goldenTicketConfig.baseCost, goldenTicketConfig.costMultiplier, goldenTicketPurchaseCount);
        activateGoldenSpinButton.innerHTML = isGoldenSpinActive ? `Golden Spin ACTIVE!` : `Activate Golden Spin (100x) <br> Cost: ${nextGoldenTicketCost.toLocaleString()} P`;
        activateGoldenSpinButton.classList.toggle('disabled', points < nextGoldenTicketCost && !isGoldenSpinActive);
        activateGoldenSpinButton.classList.toggle('active', isGoldenSpinActive);

        rerollWheelValuesButton.innerHTML = `Shift Main Wheel Values <br> Cost: ${rerollWheelCost.toLocaleString()} P`;
        rerollWheelValuesButton.classList.toggle('disabled', points < rerollWheelCost);

        unlockNegativeProtectionButton.innerHTML = negativeProtectionUnlocked ? `Neg. Protection Unlocked` : `Unlock Negative Protection <br> Cost: ${negativeProtectionCost.toLocaleString()} P`;
        unlockNegativeProtectionButton.classList.toggle('disabled', points < negativeProtectionCost && !negativeProtectionUnlocked);
        if(negativeProtectionUnlocked) unlockNegativeProtectionButton.classList.add('purchased');

        const nextFlatBonusCost = flatBonusConfig.baseCost + (flatBonusLevel * flatBonusConfig.costIncreasePerLevel);
        upgradeFlatBonusButton.innerHTML = `Add Base Spin Point (+${flatBonusPoints + 1}) <br> Cost: ${nextFlatBonusCost.toLocaleString()} P`;
        upgradeFlatBonusButton.classList.toggle('disabled', points < nextFlatBonusCost || flatBonusLevel >= maxFlatBonusLevel );
        if (flatBonusLevel >= maxFlatBonusLevel) upgradeFlatBonusButton.innerHTML = `Add Base Spin Point (MAX Lv.) <br> -----`;

        // Auto Spin Unlock
        unlockAutoSpinButton.innerHTML = autoSpinUnlocked ? `Auto-Spin Unlocked` : `Unlock Auto-Spin <br> Cost: ${autoSpinUnlockCost.toLocaleString()} P`;
        unlockAutoSpinButton.classList.toggle('disabled', points < autoSpinUnlockCost && !autoSpinUnlocked);
        if(autoSpinUnlocked) { unlockAutoSpinButton.classList.add('purchased'); autoSpinButton.style.display = 'block'; }
        else { autoSpinButton.style.display = 'none'; }

        // Wheel Unlocks
        unlockRiskyWheelButton.innerHTML = riskyWheelUnlocked ? `Risky Wheel Unlocked` : `Unlock Risky Wheel <br> Cost: ${riskyWheelUnlockCost.toLocaleString()} P`;
        unlockRiskyWheelButton.classList.toggle('disabled', points < riskyWheelUnlockCost && !riskyWheelUnlocked);
        if(riskyWheelUnlocked) {
            unlockRiskyWheelButton.classList.add('purchased');
            document.getElementById('nav-risky-wheel').style.display = 'inline-block';
            jobShopSection.style.display = 'block'; // Show job shop
        } else {
            document.getElementById('nav-risky-wheel').style.display = 'none';
            jobShopSection.style.display = 'none'; // Hide job shop
        }


        unlockDemonWheelButton.innerHTML = demonWheelUnlocked ? `Demon Wheel Unlocked` : `Unlock Demon Wheel <br> Cost: ${demonWheelUnlockCost.toLocaleString()} P`;
        unlockDemonWheelButton.classList.toggle('disabled', points < demonWheelUnlockCost && !demonWheelUnlocked);
        if(demonWheelUnlocked) {
            unlockDemonWheelButton.classList.add('purchased');
            document.getElementById('nav-demon-wheel').style.display = 'inline-block';
        } else {
            document.getElementById('nav-demon-wheel').style.display = 'none';
        }

        // Job Shop
        if (riskyWheelUnlocked) { // Only show job items if risky wheel is unlocked
            getAJobButton.innerHTML = jobUnlocked ? `Employed (${passiveIncomeRate} PPS)` : `Get a Job (1 PPS) <br> Cost: ${jobUnlockCost.toLocaleString()} P`;
            getAJobButton.classList.toggle('disabled', points < jobUnlockCost && !jobUnlocked);
            if (jobUnlocked) getAJobButton.classList.add('purchased');

            const nextPromotionCost = calculateRampingCost(jobPromotionConfig.baseCost, jobPromotionConfig.costMultiplier, jobLevel); // jobLevel is 0 for first job, 1 for first promo
            jobPromotionButton.innerHTML = `Job Promotion (+${jobPromotionConfig.ppsIncrease} PPS) <br> Cost: ${nextPromotionCost.toLocaleString()} P`;
            jobPromotionButton.classList.toggle('disabled', points < nextPromotionCost || !jobUnlocked); // Must have a job to get promoted
            jobPromotionButton.style.display = jobUnlocked ? 'block' : 'none'; // Only show if employed
        }
    }


    // --- Generic Spin Logic ---
    function genericSpinWheelLogic(wheelType, canvasEl, segmentsArray, spinCost, currentAngleRef, handleResultFunc, spinDurationOverride = null) {
        if (isSpinning[wheelType]) return;
        if (points < spinCost) {
            showMessage(`Not enough points for ${wheelType} wheel!`, 3000, true);
            return;
        }
        // Special check for main wheel golden spin
        if (wheelType === 'main' && isGoldenSpinActive && spinMainWheelButton.disabled) {
             showMessage("Use your active Golden Spin!", 2000, true);
             return;
        }


        points -= spinCost;
        isSpinning[wheelType] = true;
        updateDisplays();
        showMessage(`Spinning ${wheelType} wheel...`);

        const totalSize = segmentsArray.reduce((sum, seg) => sum + (seg.size || 1), 0);
        const randomStopPoint = Math.random();
        let accumulatedSize = 0;
        let winningSegmentIndex = 0;
        for (let i = 0; i < segmentsArray.length; i++) {
            accumulatedSize += (segmentsArray[i].size || 1) / totalSize;
            if (randomStopPoint <= accumulatedSize) { winningSegmentIndex = i; break; }
        }

        const segmentAngle = 2 * Math.PI / totalSize;
        let targetSegmentMidAngle = 0;
        for(let i=0; i < winningSegmentIndex; i++){ targetSegmentMidAngle += (segmentsArray[i].size || 1) * segmentAngle; }
        targetSegmentMidAngle += ((segmentsArray[winningSegmentIndex].size || 1) * segmentAngle / 2);

        const pointerOffset = -Math.PI / 2;
        const fullRotations = (wheelType === 'main') ? (5 + spinSpeedLevel) : 5; // Main wheel speed varies
        const finalTargetAngle = (fullRotations * 2 * Math.PI) - targetSegmentMidAngle + pointerOffset;

        let startTime = null;
        const startRotationAngle = currentAngleRef[wheelType]; // Get current visual angle for this wheel
        const effectiveSpinDuration = spinDurationOverride || (wheelType === 'main' ? currentSpinDuration : 3000); // Other wheels fixed duration for now

        function animateSpin(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const easedProgress = easeOutCubic(Math.min(progress / effectiveSpinDuration, 1));
            const visualAngle = startRotationAngle + easedProgress * (finalTargetAngle - startRotationAngle);
            canvasEl.style.transform = `rotate(${visualAngle}rad)`;

            if (progress < effectiveSpinDuration) {
                requestAnimationFrame(animateSpin);
            } else {
                canvasEl.style.transform = `rotate(${finalTargetAngle}rad)`;
                currentAngleRef[wheelType] = finalTargetAngle % (2 * Math.PI); // Store this wheel's end angle
                isSpinning[wheelType] = false;
                handleResultFunc(segmentsArray[winningSegmentIndex]); // This will updateDisplays and save
                // Auto-spin for main wheel only
                if (wheelType === 'main' && document.getElementById('auto-spin-button').dataset.autoSpinActive === "true" && autoSpinUnlocked && points >= baseSpinCostMainWheel && !isGoldenSpinActive) {
                    setTimeout(() => genericSpinWheelLogic('main', mainWheelCanvas, mainWheelSegments, baseSpinCostMainWheel, {main: currentAngleMain}, handleMainWheelSpinResult), 1200);
                } else if (wheelType === 'main' && document.getElementById('auto-spin-button').dataset.autoSpinActive === "true") {
                    document.getElementById('auto-spin-button').dataset.autoSpinActive = "false"; // Stop if can't afford or golden active
                    updateDisplays();
                } else {
                    updateDisplays();
                }
            }
        }
        requestAnimationFrame(animateSpin);
    }


    // --- Result Handlers ---
    function handleMainWheelSpinResult(segment) {
        let actualGainedPoints = 0;
        let message = "";
        let spinValueWithBonus = 0; // Ensure defined

        if (segment.type === 'numeric') {
            spinValueWithBonus = (segment.value || 0) + flatBonusPoints; // Ensure segment.value is treated as number

            if (spinValueWithBonus < 0 && negativeProtectionUnlocked) {
                actualGainedPoints = 25;
                message = `Landed on ${segment.text}. Negative Protection: +25 points!`;
            } else {
                actualGainedPoints = spinValueWithBonus * currentMultiplier;
                if (isGoldenSpinActive) {
                    if (spinValueWithBonus > 0) { // Only apply golden if base is positive
                        actualGainedPoints *= goldenTicketConfig.activationMultiplier;
                        message = `GOLDEN SPIN! Landed on ${segment.text}. Value: ${spinValueWithBonus}, with x${currentMultiplier} & GOLDEN x${goldenTicketConfig.activationMultiplier}, you get ${actualGainedPoints.toLocaleString()} points!`;
                    } else {
                         message = `Landed on ${segment.text}. Value: ${spinValueWithBonus}. Golden spin not applied to non-positive result. Points: ${actualGainedPoints.toLocaleString()}`;
                    }
                    isGoldenSpinActive = false; // Consume golden ticket
                } else {
                    message = `Landed on ${segment.text}. Value: ${spinValueWithBonus}, with x${currentMultiplier} multiplier, you get ${actualGainedPoints.toLocaleString()} points.`;
                }
            }
        } else if (segment.type === 'special_deduction') {
            actualGainedPoints = segment.amount || 0;
            message = `Landed on ${segment.text}. You lose ${Math.abs(actualGainedPoints).toLocaleString()} points.`;
        } else if (segment.type === 'neutral') {
            actualGainedPoints = 0;
            message = `Landed on ${segment.text}. No change in points.`;
        } else {
            message = `Landed on ${segment.text}. (Unknown segment type)`;
        }

        points += actualGainedPoints;
        if (points < 0) points = 0;
        showMessage(message, 5000);
        updateDisplays(); saveGame();
    }

    function handleRiskyWheelSpinResult(segment) {
        let actualGainedPoints = segment.value || 0;
        points += actualGainedPoints;
        if (points < 0) points = 0;
        showMessage(`Risky Wheel: ${segment.text}! You ${actualGainedPoints >= 0 ? 'gained' : 'lost'} ${Math.abs(actualGainedPoints).toLocaleString()} points.`, 4000);
        updateDisplays(); saveGame();
    }

    function handleDemonWheelSpinResult(segment) {
        let actualGainedPoints = 0;
        let message = "";
        if (segment.value === 'lose_all') {
            actualGainedPoints = -points; // Lose all current points
            message = "DEMON WHEEL: YOU LOST EVERYTHING!";
        } else if (segment.type === 'numeric_extreme') {
            actualGainedPoints = segment.value || 0;
            message = `DEMON WHEEL: ${segment.text}! Outcome: ${actualGainedPoints.toLocaleString()} points!`;
        } else {
            message = "DEMON WHEEL: An unknown fate...";
        }
        points += actualGainedPoints;
        if (points < 0) points = 0;
        showMessage(message, 6000, actualGainedPoints < 0 && segment.value !== 'lose_all'); // Error style for big losses
        updateDisplays(); saveGame();
    }


    // --- Shop Logic ---
    pickupTrashButton.addEventListener('click', () => { points += 1; showMessage("+1 Point!", 1500); updateDisplays(); saveGame(); });

    upgradeMultiplierButton.addEventListener('click', () => {
        const cost = calculateRampingCost(multiplierConfig.baseCost, multiplierConfig.costMultiplier, multiplierLevel);
        if (points >= cost) {
            points -= cost; multiplierLevel++;
            showMessage(`Main Multiplier upgraded to Lv ${multiplierLevel} (${multiplierLevel}x)!`, 2500);
            updateDisplays(); saveGame();
        } else { showMessage("Not enough points!", 2000, true); }
    });

    upgradeSpinSpeedButton.addEventListener('click', () => {
        if (spinSpeedLevel >= spinSpeedConfig.maxLevel || currentSpinDuration <= spinSpeedConfig.minDuration) return;
        const cost = calculateRampingCost(spinSpeedConfig.baseCost, spinSpeedConfig.costMultiplier, spinSpeedLevel);
        if (points >= cost) {
            points -= cost; spinSpeedLevel++;
            currentSpinDuration = Math.max(spinSpeedConfig.minDuration, baseSpinDuration - (spinSpeedLevel - 1) * spinSpeedConfig.durationReductionPerLevel);
            showMessage(`Main Spin speed upgraded to Lv ${spinSpeedLevel}!`, 2500);
            updateDisplays(); saveGame();
        } else { showMessage("Not enough points!", 2000, true); }
    });
    activateGoldenSpinButton.addEventListener('click', () => {
        if (isGoldenSpinActive) return;
        const cost = calculateRampingCost(goldenTicketConfig.baseCost, goldenTicketConfig.costMultiplier, goldenTicketPurchaseCount);
        if (points >= cost) {
            points -= cost; isGoldenSpinActive = true; goldenTicketPurchaseCount++;
            showMessage(`Golden Spin (100x) ACTIVATED for next main wheel spin!`, 3000);
            updateDisplays(); saveGame();
        } else { showMessage("Not enough points!", 2000, true); }
    });
    rerollWheelValuesButton.addEventListener('click', () => {
        if (points >= rerollWheelCost) {
            points -= rerollWheelCost;
            mainWheelSegments.forEach(seg => {
                if (seg.type === 'numeric') {
                    seg.value = Math.floor(Math.random() * 3501) - 500;
                    seg.text = seg.value > 999 ? (seg.value/1000).toFixed(1)+"k" : seg.value.toString();
                }
            });
            drawGenericWheel(mainCtx, mainWheelCanvas, mainWheelSegments, "Main Wheel");
            showMessage("Main Wheel values shifted!", 3000); updateDisplays(); saveGame();
        } else { showMessage("Not enough points!", 2000, true); }
    });
    unlockNegativeProtectionButton.addEventListener('click', () => {
        if (negativeProtectionUnlocked) return;
        if (points >= negativeProtectionCost) {
            points -= negativeProtectionCost; negativeProtectionUnlocked = true;
            showMessage("Negative Point Protection Unlocked!", 3000); updateDisplays(); saveGame();
        } else { showMessage("Not enough points!", 2000, true); }
    });
    upgradeFlatBonusButton.addEventListener('click', () => {
        if (flatBonusLevel >= maxFlatBonusLevel) return;
        const cost = flatBonusConfig.baseCost + (flatBonusLevel * flatBonusConfig.costIncreasePerLevel);
        if (points >= cost) {
            points -= cost; flatBonusLevel++; flatBonusPoints++;
            showMessage(`Base Spin Bonus to +${flatBonusPoints}!`, 2500); updateDisplays(); saveGame();
        } else { showMessage("Not enough points!", 2000, true); }
    });
    unlockAutoSpinButton.addEventListener('click', () => {
        if (autoSpinUnlocked) return;
        if (points >= autoSpinUnlockCost) {
            points -= autoSpinUnlockCost; autoSpinUnlocked = true;
            showMessage("Auto-Spin for Main Wheel Unlocked!", 3000); updateDisplays(); saveGame();
        } else { showMessage("Not enough points!", 2000, true); }
    });

    // New Wheel Unlocks
    unlockRiskyWheelButton.addEventListener('click', () => {
        if (riskyWheelUnlocked) return;
        if (points >= riskyWheelUnlockCost) {
            points -= riskyWheelUnlockCost; riskyWheelUnlocked = true;
            showMessage("Risky Wheel Unlocked!", 3000);
            drawGenericWheel(riskyCtx, riskyWheelCanvas, riskyWheelSegments, "Risky Wheel");
            updateDisplays(); saveGame();
        } else { showMessage("Not enough points for Risky Wheel!", 2000, true); }
    });
    unlockDemonWheelButton.addEventListener('click', () => {
        if (demonWheelUnlocked) return;
        if (points >= demonWheelUnlockCost) {
            points -= demonWheelUnlockCost; demonWheelUnlocked = true;
            showMessage("The DEMON WHEEL is Unlocked... if you dare.", 4000);
            drawGenericWheel(demonCtx, demonWheelCanvas, demonWheelSegments, "Demon Wheel");
            updateDisplays(); saveGame();
        } else { showMessage("Not nearly enough points for the Demon Wheel!", 3000, true); }
    });

    // Job System
    getAJobButton.addEventListener('click', () => {
        if (jobUnlocked) return;
        if (points >= jobUnlockCost) {
            points -= jobUnlockCost; jobUnlocked = true; jobLevel = 1; passiveIncomeRate = 1;
            startPassiveIncome();
            showMessage("You got a job! Earning 1 point per second.", 3000);
            updateDisplays(); saveGame();
        } else { showMessage("Not enough points to get a job.", 2000, true); }
    });
    jobPromotionButton.addEventListener('click', () => {
        if (!jobUnlocked) return; // Should not happen if button is hidden
        const cost = calculateRampingCost(jobPromotionConfig.baseCost, jobPromotionConfig.costMultiplier, jobLevel -1); // level 1 is first promo, so cost index 0
        if (points >= cost) {
            points -= cost; jobLevel++; passiveIncomeRate += jobPromotionConfig.ppsIncrease;
            // Interval is already running, rate change will be picked up
            showMessage(`Job Promotion! Now earning ${passiveIncomeRate} PPS.`, 3000);
            updateDisplays(); saveGame();
        } else { showMessage("Not enough points for a promotion.", 2000, true); }
    });

    function startPassiveIncome() {
        if (passiveIncomeInterval) clearInterval(passiveIncomeInterval);
        if (jobUnlocked && passiveIncomeRate > 0) {
            passiveIncomeInterval = setInterval(() => {
                points += passiveIncomeRate;
                updateDisplays(); // Might be too frequent, consider batching updates or direct DOM manipulation for points only
                // saveGame(); // Saving every second is too much. Save on other significant events.
            }, 1000);
        }
    }
    function stopPassiveIncome() {
        if (passiveIncomeInterval) clearInterval(passiveIncomeInterval);
        passiveIncomeInterval = null;
    }

    // --- Spin Button Event Listeners ---
    const wheelCurrentAngles = { main: 0, risky: 0, demon: 0 }; // Object to pass by reference

    spinMainWheelButton.addEventListener('click', () => genericSpinWheelLogic('main', mainWheelCanvas, mainWheelSegments, baseSpinCostMainWheel, wheelCurrentAngles, handleMainWheelSpinResult));
    spinRiskyWheelButton.addEventListener('click', () => genericSpinWheelLogic('risky', riskyWheelCanvas, riskyWheelSegments, riskyWheelSpinCost, wheelCurrentAngles, handleRiskyWheelSpinResult));
    spinDemonWheelButton.addEventListener('click', () => genericSpinWheelLogic('demon', demonWheelCanvas, demonWheelSegments, demonWheelSpinCost, wheelCurrentAngles, handleDemonWheelSpinResult));

    autoSpinButton.addEventListener('click', () => {
        const autoSpinState = autoSpinButton.dataset.autoSpinActive === "true";
        if (!autoSpinUnlocked) { showMessage("Unlock Auto-Spin first!", 2000, true); return; }

        if (autoSpinState) {
            autoSpinButton.dataset.autoSpinActive = "false";
            autoSpinButton.textContent = "Auto-Spin Main Wheel";
            showMessage("Auto-Spin Deactivated.", 2000);
        } else {
            if (points < baseSpinCostMainWheel) { showMessage("Not enough points to start Auto-Spin!", 2000, true); return; }
            if (isGoldenSpinActive) { showMessage("Cannot Auto-Spin with Golden Spin active!", 2000, true); return; }
            autoSpinButton.dataset.autoSpinActive = "true";
            autoSpinButton.textContent = "Stop Auto-Spin";
            showMessage("Auto-Spin Activated!", 2000);
            genericSpinWheelLogic('main', mainWheelCanvas, mainWheelSegments, baseSpinCostMainWheel, wheelCurrentAngles, handleMainWheelSpinResult);
        }
    });


    // --- Navigation ---
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.wheel-section').forEach(sec => sec.classList.remove('active-wheel-section'));
            document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active-nav'));
            document.getElementById(`${button.dataset.wheel}-wheel-area`).classList.add('active-wheel-section');
            button.classList.add('active-nav');
        });
    });


    // --- Saving and Loading ---
    function saveGame() {
        const gameState = {
            points, multiplierLevel, spinSpeedLevel, currentSpinDuration, isGoldenSpinActive, goldenTicketPurchaseCount,
            negativeProtectionUnlocked, flatBonusPoints, flatBonusLevel, autoSpinUnlocked, mainWheelSegments,
            wheelCurrentAngles, // Save current visual angles for all wheels
            riskyWheelUnlocked, demonWheelUnlocked,
            jobUnlocked, jobLevel, passiveIncomeRate
        };
        localStorage.setItem('WheelOfFortuneUltimateGamble', JSON.stringify(gameState));
    }

    function loadGame() {
        const savedGame = localStorage.getItem('WheelOfFortuneUltimateGamble');
        if (savedGame) {
            const gs = JSON.parse(savedGame);
            points = gs.points || basePointsToStart;
            multiplierLevel = gs.multiplierLevel || 1; spinSpeedLevel = gs.spinSpeedLevel || 1;
            currentSpinDuration = gs.currentSpinDuration || baseSpinDuration;
            isGoldenSpinActive = gs.isGoldenSpinActive || false; goldenTicketPurchaseCount = gs.goldenTicketPurchaseCount || 0;
            negativeProtectionUnlocked = gs.negativeProtectionUnlocked || false;
            flatBonusPoints = gs.flatBonusPoints || 0; flatBonusLevel = gs.flatBonusLevel || 0;
            autoSpinUnlocked = gs.autoSpinUnlocked || false;
            mainWheelSegments = gs.mainWheelSegments || JSON.parse(JSON.stringify(mainWheelSegmentsInitial));
            
            wheelCurrentAngles.main = gs.wheelCurrentAngles?.main || 0;
            wheelCurrentAngles.risky = gs.wheelCurrentAngles?.risky || 0;
            wheelCurrentAngles.demon = gs.wheelCurrentAngles?.demon || 0;
            mainWheelCanvas.style.transform = `rotate(${wheelCurrentAngles.main}rad)`;
            riskyWheelCanvas.style.transform = `rotate(${wheelCurrentAngles.risky}rad)`;
            demonWheelCanvas.style.transform = `rotate(${wheelCurrentAngles.demon}rad)`;

            riskyWheelUnlocked = gs.riskyWheelUnlocked || false;
            demonWheelUnlocked = gs.demonWheelUnlocked || false;
            jobUnlocked = gs.jobUnlocked || false;
            jobLevel = gs.jobLevel || 0;
            passiveIncomeRate = gs.passiveIncomeRate || 0;

            if (jobUnlocked && passiveIncomeRate > 0) startPassiveIncome();
        } else {
            // Initialize new game defaults
            points = basePointsToStart; mainWheelSegments = JSON.parse(JSON.stringify(mainWheelSegmentsInitial));
        }
    }

    function resetGameData() {
        if (confirm("Are you sure you want to reset ALL game data? This is irreversible!")) {
            stopPassiveIncome(); // Crucial to stop intervals
            localStorage.removeItem('WheelOfFortuneUltimateGamble');
            // Reset all state variables to their initial default values
            points = basePointsToStart; multiplierLevel = 1; currentMultiplier = 1;
            spinSpeedLevel = 1; currentSpinDuration = baseSpinDuration;
            isGoldenSpinActive = false; goldenTicketPurchaseCount = 0;
            negativeProtectionUnlocked = false; flatBonusPoints = 0; flatBonusLevel = 0;
            autoSpinUnlocked = false; mainWheelSegments = JSON.parse(JSON.stringify(mainWheelSegmentsInitial));
            
            wheelCurrentAngles.main = 0; wheelCurrentAngles.risky = 0; wheelCurrentAngles.demon = 0;
            mainWheelCanvas.style.transform = `rotate(0rad)`;
            riskyWheelCanvas.style.transform = `rotate(0rad)`;
            demonWheelCanvas.style.transform = `rotate(0rad)`;

            riskyWheelUnlocked = false; demonWheelUnlocked = false;
            jobUnlocked = false; jobLevel = 0; passiveIncomeRate = 0;

            autoSpinButton.dataset.autoSpinActive = "false";
            autoSpinButton.textContent = "Auto-Spin Main Wheel";


            showMessage("Game Reset! Starting fresh.", 3000);
            drawGenericWheel(mainCtx, mainWheelCanvas, mainWheelSegments, "Main Wheel");
            if(riskyWheelUnlocked) drawGenericWheel(riskyCtx, riskyWheelCanvas, riskyWheelSegments, "Risky Wheel");
            if(demonWheelUnlocked) drawGenericWheel(demonCtx, demonWheelCanvas, demonWheelSegments, "Demon Wheel");
            updateDisplays();
        }
    }
    resetButton.addEventListener('click', resetGameData);

    // Initial Setup
    loadGame();
    drawGenericWheel(mainCtx, mainWheelCanvas, mainWheelSegments, "Main Wheel");
    if (riskyWheelUnlocked) drawGenericWheel(riskyCtx, riskyWheelCanvas, riskyWheelSegments, "Risky Wheel");
    if (demonWheelUnlocked) drawGenericWheel(demonCtx, demonWheelCanvas, demonWheelSegments, "Demon Wheel");
    updateDisplays();
});
