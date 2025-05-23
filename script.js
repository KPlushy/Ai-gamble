document.addEventListener('DOMContentLoaded', () => {
    // --- Canvas & Contexts ---
    const mainWheelCanvas = document.getElementById('mainWheelCanvas'); const mainCtx = mainWheelCanvas.getContext('2d');
    const riskyWheelCanvas = document.getElementById('riskyWheelCanvas'); const riskyCtx = riskyWheelCanvas.getContext('2d');
    const demonWheelCanvas = document.getElementById('demonWheelCanvas'); const demonCtx = demonWheelCanvas.getContext('2d');

    // --- Buttons ---
    const spinMainWheelButton = document.getElementById('spin-main-wheel-button');
    const spinRiskyWheelButton = document.getElementById('spin-risky-wheel-button');
    const spinDemonWheelButton = document.getElementById('spin-demon-wheel-button');
    const autoSpinButton = document.getElementById('auto-spin-button');
    const resetButton = document.getElementById('reset-button');
    const navButtons = document.querySelectorAll('.nav-button');

    // --- Displays ---
    const pointsDisplay = document.getElementById('points-display');
    const multiplierDisplay = document.getElementById('multiplier-display');
    const spinSpeedDisplay = document.getElementById('spin-speed-display');
    const flatBonusDisplay = document.getElementById('flat-bonus-display');
    const goldenSpinStatusDisplay = document.getElementById('golden-spin-status-display');
    const negativeProtectionStatusDisplay = document.getElementById('negative-protection-status-display');
    const passiveIncomeDisplay = document.getElementById('passive-income-display');
    const shopDiscountDisplay = document.getElementById('shop-discount-display'); // New
    const messageDisplay = document.getElementById('message-display');

    // --- Shop Item Elements ---
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
    // New Shop Sections/Items
    const riskyUnlocksShopSection = document.getElementById('risky-unlocks-shop');
    const upgradeShopDiscountButton = document.getElementById('upgrade-shop-discount');
    const boost100BasePointsButton = document.getElementById('boost-100-base-points');
    const jobShopSection = document.getElementById('job-shop');
    const getAJobButton = document.getElementById('get-a-job');
    const jobPromotionButton = document.getElementById('job-promotion');
    const hireEmployeeButton = document.getElementById('hire-employee');


    // --- Game Constants ---
    const baseSpinCostMainWheel = 25; const basePointsToStart = 50;
    const riskyWheelSpinCost = 1000; const demonWheelSpinCost = 100000000;

    // --- Game State Variables ---
    let points = 0;
    let isSpinning = { main: false, risky: false, demon: false };
    const wheelCurrentAnglesRef = { main: 0, risky: 0, demon: 0 };

    let multiplierLevel = 1; let currentMultiplier = 1;
    let spinSpeedLevel = 1; let baseSpinDuration = 4000; let currentSpinDuration = baseSpinDuration;
    let isGoldenSpinActive = false; let goldenTicketPurchaseCount = 0;
    let negativeProtectionUnlocked = false;
    let flatBonusPoints = 0; let flatBonusLevel = 0; const maxFlatBonusLevel = 1000000;
    let autoSpinUnlocked = false;

    // Shop Discount
    let shopDiscountLevel = 0; let currentShopDiscountPercentage = 0; // 0 to 1
    const shopDiscountConfig = { baseCost: 50000, costMultiplier: 2.5, discountPerLevel: 0.02, maxLevel: 25 }; // Max 50% discount

    // +100 Base Points Boost
    let megaBasePointsBoostPurchased = false;
    const megaBasePointsBoostCost = 250000;

    // Brighter Wheel Colors & Segments
    let mainWheelSegmentsInitial = [
        { text: '10', value: 10, color: '#4CAF50', type: 'numeric' }, { text: '50', value: 50, color: '#FFC107', type: 'numeric' },
        { text: '100', value: 100, color: '#2196F3', type: 'numeric' }, { text: 'Try Again', value: 0, color: '#9E9E9E', type: 'neutral' },
        { text: '25', value: 25, color: '#FF9800', type: 'numeric' }, { text: 'JACKPOT! 250', value: 250, color: '#F44336', size: 0.5, type: 'numeric' },
        { text: '-500 PTS', value: 'fixed_deduction', amount: -500, color: '#795548', type: 'special_deduction' },
        { text: '5', value: 5, color: '#00BCD4', type: 'numeric' }, { text: '75', value: 75, color: '#9C27B0', type: 'numeric' },
        { text: 'BONUS 150', value: 150, color: '#E91E63', type: 'numeric' },
    ];
    let mainWheelSegments = JSON.parse(JSON.stringify(mainWheelSegmentsInitial));

    let riskyWheelUnlocked = false; const riskyWheelUnlockCost = 1000000;
    const riskyWheelSegments = [
        { text: '+100k', value: 100000, color: '#00E676', type: 'numeric', size: 0.8 },
        { text: '-250k', value: -250000, color: '#FF1744', type: 'numeric', size: 1.2 },
        { text: '+50k', value: 50000, color: '#29B6F6', type: 'numeric' },
        { text: '-100k', value: -100000, color: '#EF5350', type: 'numeric' },
        { text: '+10k', value: 10000, color: '#26A69A', type: 'numeric', size: 1.5 },
        { text: '-500k', value: -500000, color: '#FF6F00', type: 'numeric', size: 1 },
        { text: '+2.5k', value: 2500, color: '#AB47BC', type: 'numeric', size: 1.5 },
        { text: '-1M PTS', value: -1000000, color: '#607D8B', type: 'numeric_extreme', size: 0.5 },
    ];

    let demonWheelUnlocked = false; const demonWheelUnlockCost = 100000000000;
    const demonWheelSegments = [
        { text: 'TOTAL VOID', value: 'lose_all', color: '#212121', type: 'special_extreme', size: 2.5 },
        { text: '-500B', value: -500000000000, color: '#B71C1C', type: 'numeric_extreme', size: 1.5 },
        { text: '-100B', value: -100000000000, color: '#D32F2F', type: 'numeric_extreme', size: 2 },
        { text: '+1T PTS!!!', value: 1000000000000, color: '#FFF176', type: 'numeric_extreme', size: 0.05 },
        { text: '-10B', value: -10000000000, color: '#F44336', type: 'numeric_extreme', size: 2.5 },
        { text: '-1B', value: -1000000000, color: '#E57373', type: 'numeric_extreme', size: 1.45},
    ];

    // Job / Passive Income
    let jobUnlocked = false; const jobUnlockCost = 10000;
    let jobLevel = 0; // For "Get a Job" and "Job Promotion"
    let employeeCount = 0; // For "Hire Employee"
    let passiveIncomeRate = 0; let passiveIncomeInterval = null;
    const jobPromotionConfig = { baseCost: 25000, costMultiplier: 2.5, ppsIncrease: 5 };
    const employeeConfig = { baseCost: 1000000, costMultiplier: 3, ppsIncrease: 100 };


    // --- Configs ---
    const multiplierConfig = { baseCost: 100, costMultiplier: 1.8 };
    const spinSpeedConfig = { baseCost: 150, costMultiplier: 1.7, durationReductionPerLevel: 300, minDuration: 200, maxLevel: 20 };
    const goldenTicketConfig = { baseCost: 5000, costMultiplier: 2.2, activationMultiplier: 100 };
    const rerollWheelCost = 1000; const negativeProtectionCost = 7500;
    const flatBonusConfig = { baseCost: 50, costIncreasePerLevel: 100 };
    const autoSpinUnlockCost = 10000000;

    function applyShopDiscount(originalCost) {
        const discountedCost = Math.floor(originalCost * (1 - currentShopDiscountPercentage));
        return Math.max(1, discountedCost); // Ensure cost is at least 1
    }
    function calculateRampingCost(base, multiplier, level, applyDisc = true) {
        const cost = Math.floor(base * Math.pow(multiplier, level));
        return applyDisc ? applyShopDiscount(cost) : cost;
    }
    // For linear increase costs like flatBonus
    function calculateLinearIncreaseCost(base, increasePerLevel, level, applyDisc = true) {
        const cost = base + (level * increasePerLevel);
        return applyDisc ? applyShopDiscount(cost) : cost;
    }


    function showMessage(text, duration = 3000, isError = false) { /* ... (same) ... */ }
    function easeOutCubic(t) { /* ... (same) ... */ }
    function drawGenericWheel(ctx, canvasEl, segmentsArray, wheelName) { /* ... (same, ensure bright colors are used) ... */ }

    function updateDisplays() {
        pointsDisplay.textContent = points.toLocaleString();
        currentMultiplier = multiplierLevel;
        multiplierDisplay.textContent = `${currentMultiplier}x (Lv. ${multiplierLevel})`;
        spinSpeedDisplay.textContent = `Lv. ${spinSpeedLevel} (${(currentSpinDuration / 1000).toFixed(1)}s)`;
        flatBonusDisplay.textContent = `+${flatBonusPoints.toLocaleString()}`;
        goldenSpinStatusDisplay.textContent = isGoldenSpinActive ? "ACTIVE (100x Next!)" : "Inactive";
        goldenSpinStatusDisplay.style.color = isGoldenSpinActive ? "gold" : "#e8eaf6";
        negativeProtectionStatusDisplay.textContent = negativeProtectionUnlocked ? "ACTIVE" : "Inactive";
        negativeProtectionStatusDisplay.style.color = negativeProtectionUnlocked ? "lightgreen" : "#e8eaf6";
        passiveIncomeDisplay.textContent = `${passiveIncomeRate.toLocaleString()} PPS (Job Lv.${jobLevel}, Emp.${employeeCount})`;
        shopDiscountDisplay.textContent = `${(currentShopDiscountPercentage * 100).toFixed(0)}%`;


        // --- Button States & Golden Ticket Handling ---
        const canAffordMainSpin = points >= baseSpinCostMainWheel;
        // Player can spin if: not spinning AND ( (can afford main spin) OR (golden ticket is active) )
        spinMainWheelButton.disabled = isSpinning.main || (!canAffordMainSpin && !isGoldenSpinActive);

        if (isGoldenSpinActive && !isSpinning.main) {
            spinMainWheelButton.textContent = "USE GOLDEN SPIN!";
            spinMainWheelButton.classList.add('golden-active');
        } else {
            spinMainWheelButton.textContent = `Spin Main Wheel (Cost: ${baseSpinCostMainWheel} P)`;
            spinMainWheelButton.classList.remove('golden-active');
        }
        if(isSpinning.main) spinMainWheelButton.textContent = "Spinning...";


        autoSpinButton.disabled = isSpinning.main || !canAffordMainSpin || !autoSpinUnlocked || isGoldenSpinActive;

        spinRiskyWheelButton.disabled = isSpinning.risky || points < applyShopDiscount(riskyWheelSpinCost) || !riskyWheelUnlocked;
        spinDemonWheelButton.disabled = isSpinning.demon || points < applyShopDiscount(demonWheelSpinCost) || !demonWheelUnlocked;


        // --- Shop Item Updates (with discount application) ---
        pickupTrashButton.classList.remove('disabled'); // Always available

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

        const actualRerollCost = applyShopDiscount(rerollWheelCost);
        rerollWheelValuesButton.innerHTML = `Shift Main Wheel Values <br> Cost: ${actualRerollCost.toLocaleString()} P`;
        rerollWheelValuesButton.classList.toggle('disabled', points < actualRerollCost);

        const actualNegProtCost = applyShopDiscount(negativeProtectionCost);
        unlockNegativeProtectionButton.innerHTML = negativeProtectionUnlocked ? `Neg. Protection Unlocked` : `Unlock Negative Protection <br> Cost: ${actualNegProtCost.toLocaleString()} P`;
        unlockNegativeProtectionButton.classList.toggle('disabled', points < actualNegProtCost && !negativeProtectionUnlocked);
        if(negativeProtectionUnlocked) unlockNegativeProtectionButton.classList.add('purchased');

        const nextFlatBonusCost = calculateLinearIncreaseCost(flatBonusConfig.baseCost, flatBonusConfig.costIncreasePerLevel, flatBonusLevel);
        upgradeFlatBonusButton.innerHTML = `Add Base Spin Point (+${flatBonusPoints + 1}) <br> Cost: ${nextFlatBonusCost.toLocaleString()} P`;
        upgradeFlatBonusButton.classList.toggle('disabled', points < nextFlatBonusCost || flatBonusLevel >= maxFlatBonusLevel );
        if (flatBonusLevel >= maxFlatBonusLevel) upgradeFlatBonusButton.innerHTML = `Add Base Spin Point (MAX Lv.) <br> -----`;

        // Risky Unlocks Shop Section
        riskyUnlocksShopSection.style.display = riskyWheelUnlocked ? 'block' : 'none';
        if (riskyWheelUnlocked) {
            const nextShopDiscountCost = calculateRampingCost(shopDiscountConfig.baseCost, shopDiscountConfig.costMultiplier, shopDiscountLevel);
            upgradeShopDiscountButton.innerHTML = `Shop Discount (Lv. ${shopDiscountLevel + 1} - ${(currentShopDiscountPercentage * 100 + shopDiscountConfig.discountPerLevel * 100).toFixed(0)}%) <br> Cost: ${nextShopDiscountCost.toLocaleString()} P`;
            const atMaxDiscount = shopDiscountLevel >= shopDiscountConfig.maxLevel;
            upgradeShopDiscountButton.classList.toggle('disabled', points < nextShopDiscountCost || atMaxDiscount);
            if(atMaxDiscount) upgradeShopDiscountButton.innerHTML = `Shop Discount (MAX Lv. - ${(currentShopDiscountPercentage * 100).toFixed(0)}%) <br> -----`;

            const actualMegaBasePointsCost = applyShopDiscount(megaBasePointsBoostCost);
            boost100BasePointsButton.innerHTML = megaBasePointsBoostPurchased ? `MEGA Boost Purchased!` : `MEGA Base Points Boost (+100) <br> Cost: ${actualMegaBasePointsCost.toLocaleString()} P`;
            boost100BasePointsButton.classList.toggle('disabled', points < actualMegaBasePointsCost || megaBasePointsBoostPurchased);
            if(megaBasePointsBoostPurchased) boost100BasePointsButton.classList.add('one-time-purchased');
        }


        // Auto Spin Unlock
        const actualAutoSpinCost = applyShopDiscount(autoSpinUnlockCost);
        unlockAutoSpinButton.innerHTML = autoSpinUnlocked ? `Auto-Spin Unlocked` : `Unlock Auto-Spin <br> Cost: ${actualAutoSpinCost.toLocaleString()} P`;
        unlockAutoSpinButton.classList.toggle('disabled', points < actualAutoSpinCost && !autoSpinUnlocked);
        if(autoSpinUnlocked) { unlockAutoSpinButton.classList.add('purchased'); autoSpinButton.style.display = 'block'; }
        else { autoSpinButton.style.display = 'none'; }

        // Wheel Unlocks
        const actualRiskyUnlockCost = applyShopDiscount(riskyWheelUnlockCost);
        unlockRiskyWheelButton.innerHTML = riskyWheelUnlocked ? `Risky Wheel Unlocked` : `Unlock Risky Wheel <br> Cost: ${actualRiskyUnlockCost.toLocaleString()} P`;
        unlockRiskyWheelButton.classList.toggle('disabled', points < actualRiskyUnlockCost && !riskyWheelUnlocked);
        const navRisky = document.getElementById('nav-risky-wheel');
        if(riskyWheelUnlocked) {
            unlockRiskyWheelButton.classList.add('purchased');
            if(navRisky) navRisky.style.display = 'inline-block';
            jobShopSection.style.display = 'block';
            riskyUnlocksShopSection.style.display = 'block'; // Show this too
        } else {
            if(navRisky) navRisky.style.display = 'none';
            jobShopSection.style.display = 'none';
            riskyUnlocksShopSection.style.display = 'none';
        }

        const actualDemonUnlockCost = applyShopDiscount(demonWheelUnlockCost);
        unlockDemonWheelButton.innerHTML = demonWheelUnlocked ? `Demon Wheel Unlocked` : `Unlock Demon Wheel <br> Cost: ${actualDemonUnlockCost.toLocaleString()} P`;
        unlockDemonWheelButton.classList.toggle('disabled', points < actualDemonUnlockCost && !demonWheelUnlocked);
        const navDemon = document.getElementById('nav-demon-wheel');
        if(demonWheelUnlocked) {
            unlockDemonWheelButton.classList.add('purchased');
            if(navDemon) navDemon.style.display = 'inline-block';
        } else {
            if(navDemon) navDemon.style.display = 'none';
        }

        // Job Shop
        if (riskyWheelUnlocked) { // Job items appear after risky wheel
            const actualJobCost = applyShopDiscount(jobUnlockCost);
            getAJobButton.innerHTML = jobUnlocked ? `Employed (Base)` : `Get a Job (1 PPS) <br> Cost: ${actualJobCost.toLocaleString()} P`;
            getAJobButton.classList.toggle('disabled', points < actualJobCost && !jobUnlocked);
            if (jobUnlocked) getAJobButton.classList.add('purchased'); // Base job only bought once

            const nextPromotionCost = calculateRampingCost(jobPromotionConfig.baseCost, jobPromotionConfig.costMultiplier, jobLevel);
            jobPromotionButton.innerHTML = `Job Promotion (+${jobPromotionConfig.ppsIncrease} PPS) <br> Cost: ${nextPromotionCost.toLocaleString()} P`;
            jobPromotionButton.classList.toggle('disabled', points < nextPromotionCost || !jobUnlocked); // Must have base job
            jobPromotionButton.style.display = jobUnlocked ? 'block' : 'none';

            const nextEmployeeCost = calculateRampingCost(employeeConfig.baseCost, employeeConfig.costMultiplier, employeeCount);
            hireEmployeeButton.innerHTML = `Hire Employee (+${employeeConfig.ppsIncrease} PPS) <br> (Count: ${employeeCount}) <br> Cost: ${nextEmployeeCost.toLocaleString()} P`;
            hireEmployeeButton.classList.toggle('disabled', points < nextEmployeeCost || !jobUnlocked); // Must have base job
            hireEmployeeButton.style.display = jobUnlocked ? 'block' : 'none';
        }
    }


    function genericSpinWheelLogic(wheelType, canvasEl, segmentsArray, spinCost, currentAngles, handleResultFunc, spinDurationOverride = null) {
        if (isSpinning[wheelType]) return;

        let actualSpinCost = applyShopDiscount(spinCost); // Apply discount to wheel spin costs too
        let isThisGoldenSpin = false;

        if (wheelType === 'main' && isGoldenSpinActive) {
            isThisGoldenSpin = true;
            // Golden spin is "free" at the point of spinning; cost was paid to activate it.
        } else if (points < actualSpinCost) {
            showMessage(`Not enough points for ${wheelType} wheel! (Need ${actualSpinCost.toLocaleString()})`, 3000, true);
            return;
        }

        if (!isThisGoldenSpin) { // Deduct points only if it's not a golden spin
            points -= actualSpinCost;
        }

        isSpinning[wheelType] = true;
        updateDisplays(); // Update points and button states immediately
        showMessage(`Spinning ${wheelType} wheel...${isThisGoldenSpin ? " (Golden!)" : ""}`);

        const totalSize = segmentsArray.reduce((sum, seg) => sum + (seg.size || 1), 0);
        const randomStopPoint = Math.random();
        let accumulatedSize = 0; let winningSegmentIndex = 0;
        for (let i = 0; i < segmentsArray.length; i++) {
            accumulatedSize += (segmentsArray[i].size || 1) / totalSize;
            if (randomStopPoint <= accumulatedSize) { winningSegmentIndex = i; break; }
        }

        const segmentAngle = 2 * Math.PI / totalSize;
        let targetSegmentMidAngle = 0;
        for(let i=0; i < winningSegmentIndex; i++){ targetSegmentMidAngle += (segmentsArray[i].size || 1) * segmentAngle; }
        targetSegmentMidAngle += ((segmentsArray[winningSegmentIndex].size || 1) * segmentAngle / 2);

        const pointerOffset = -Math.PI / 2;
        const fullRotations = (wheelType === 'main') ? (5 + spinSpeedLevel) : (wheelType === 'demon' ? 3 : 4);
        const finalTargetAngle = (fullRotations * 2 * Math.PI) - targetSegmentMidAngle + pointerOffset;

        let startTime = null;
        const startRotationAngle = currentAngles[wheelType];
        const effectiveSpinDuration = spinDurationOverride || (wheelType === 'main' ? currentSpinDuration : (wheelType === 'demon' ? 4500 : 3000) );

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
                currentAngles[wheelType] = finalTargetAngle % (2 * Math.PI);
                isSpinning[wheelType] = false;
                handleResultFunc(segmentsArray[winningSegmentIndex]); // This handles points, messages, save, and updates displays
                // Auto-spin for main wheel only
                if (wheelType === 'main' && document.getElementById('auto-spin-button').dataset.autoSpinActive === "true" && autoSpinUnlocked && points >= applyShopDiscount(baseSpinCostMainWheel) && !isGoldenSpinActive) {
                    setTimeout(() => genericSpinWheelLogic('main', mainWheelCanvas, mainWheelSegments, baseSpinCostMainWheel, wheelCurrentAnglesRef, handleMainWheelSpinResult), 1200);
                } else if (wheelType === 'main' && document.getElementById('auto-spin-button').dataset.autoSpinActive === "true") {
                    document.getElementById('auto-spin-button').dataset.autoSpinActive = "false"; // Stop if can't afford or golden now active
                    if (autoSpinButton) autoSpinButton.textContent = "Auto-Spin Main Wheel"; // Reset text
                    updateDisplays(); // Ensure button state is correct
                } else {
                    updateDisplays(); // Final display update for non-auto-spin or end of auto-spin
                }
            }
        }
        requestAnimationFrame(animateSpin);
    }


    function handleMainWheelSpinResult(segment) { /* ... (same robust version from previous step) ... */ }
    function handleRiskyWheelSpinResult(segment) { /* ... (same robust version from previous step) ... */ }
    function handleDemonWheelSpinResult(segment) { /* ... (same robust version from previous step) ... */ }


    // --- Shop Logic ---
    pickupTrashButton.addEventListener('click', () => { points += 1; showMessage("+1 Point!", 1500); updateDisplays(); saveGame(); });

    upgradeMultiplierButton.addEventListener('click', () => {
        const cost = calculateRampingCost(multiplierConfig.baseCost, multiplierConfig.costMultiplier, multiplierLevel);
        if (points >= cost) {
            points -= cost; multiplierLevel++;
            showMessage(`Main Multiplier Lv ${multiplierLevel} (${multiplierLevel}x)!`, 2500);
            updateDisplays(); saveGame();
        } else { showMessage("Not enough points!", 2000, true); }
    });
    upgradeSpinSpeedButton.addEventListener('click', () => {
        if (spinSpeedLevel >= spinSpeedConfig.maxLevel || currentSpinDuration <= spinSpeedConfig.minDuration) {showMessage("Spin speed at max/min!", 2000, true); return;}
        const cost = calculateRampingCost(spinSpeedConfig.baseCost, spinSpeedConfig.costMultiplier, spinSpeedLevel);
        if (points >= cost) {
            points -= cost; spinSpeedLevel++;
            currentSpinDuration = Math.max(spinSpeedConfig.minDuration, baseSpinDuration - (spinSpeedLevel - 1) * spinSpeedConfig.durationReductionPerLevel);
            showMessage(`Main Spin speed Lv ${spinSpeedLevel}! (${(currentSpinDuration/1000).toFixed(1)}s)`, 2500);
            updateDisplays(); saveGame();
        } else { showMessage("Not enough points!", 2000, true); }
    });
    activateGoldenSpinButton.addEventListener('click', () => {
        if (isGoldenSpinActive) { showMessage("Golden Spin already active!", 2000, true); return; }
        const cost = calculateRampingCost(goldenTicketConfig.baseCost, goldenTicketConfig.costMultiplier, goldenTicketPurchaseCount);
        if (points >= cost) {
            points -= cost; isGoldenSpinActive = true; goldenTicketPurchaseCount++;
            showMessage(`Golden Spin (100x) ACTIVATED!`, 3000);
            updateDisplays(); saveGame();
        } else { showMessage("Not enough points!", 2000, true); }
    });
    rerollWheelValuesButton.addEventListener('click', () => {
        const cost = applyShopDiscount(rerollWheelCost);
        if (points >= cost) {
            points -= cost;
            mainWheelSegments.forEach(seg => {
                if (seg.type === 'numeric') {
                    seg.value = Math.floor(Math.random() * 3501) - 500;
                    seg.text = seg.value > 999 || seg.value < -999 ? (seg.value/1000).toFixed(1)+"k" : seg.value.toString();
                }
            });
            drawGenericWheel(mainCtx, mainWheelCanvas, mainWheelSegments, "Main Wheel");
            showMessage("Main Wheel values shifted!", 3000); updateDisplays(); saveGame();
        } else { showMessage("Not enough points!", 2000, true); }
    });
    unlockNegativeProtectionButton.addEventListener('click', () => {
        if (negativeProtectionUnlocked) { showMessage("Already unlocked!", 2000, true); return; }
        const cost = applyShopDiscount(negativeProtectionCost);
        if (points >= cost) {
            points -= cost; negativeProtectionUnlocked = true;
            showMessage("Negative Point Protection Unlocked!", 3000); updateDisplays(); saveGame();
        } else { showMessage("Not enough points!", 2000, true); }
    });
    upgradeFlatBonusButton.addEventListener('click', () => {
        if (flatBonusLevel >= maxFlatBonusLevel) { showMessage("Max flat bonus!", 2000, true); return;}
        const cost = calculateLinearIncreaseCost(flatBonusConfig.baseCost, flatBonusConfig.costIncreasePerLevel, flatBonusLevel);
        if (points >= cost) {
            points -= cost; flatBonusLevel++; flatBonusPoints++;
            showMessage(`Base Spin Bonus to +${flatBonusPoints}!`, 2500); updateDisplays(); saveGame();
        } else { showMessage("Not enough points!", 2000, true); }
    });

    // New Shop Items Logic
    upgradeShopDiscountButton.addEventListener('click', () => {
        if (shopDiscountLevel >= shopDiscountConfig.maxLevel) { showMessage("Max shop discount reached!", 2000, true); return; }
        const cost = calculateRampingCost(shopDiscountConfig.baseCost, shopDiscountConfig.costMultiplier, shopDiscountLevel, false); // Discount doesn't apply to its own upgrade cost
        if (points >= cost) {
            points -= cost; shopDiscountLevel++;
            currentShopDiscountPercentage = Math.min(0.5, shopDiscountLevel * shopDiscountConfig.discountPerLevel); // Cap at 50%
            showMessage(`Shop Discount increased to ${(currentShopDiscountPercentage * 100).toFixed(0)}%!`, 3000);
            updateDisplays(); saveGame();
        } else { showMessage("Not enough points for discount upgrade!", 2000, true); }
    });

    boost100BasePointsButton.addEventListener('click', () => {
        if (megaBasePointsBoostPurchased) { showMessage("MEGA Boost already purchased!", 2000, true); return; }
        const cost = applyShopDiscount(megaBasePointsBoostCost);
        if (points >= cost) {
            points -= cost; megaBasePointsBoostPurchased = true;
            flatBonusPoints += 100;
            showMessage("MEGA Base Points Boost! +100 to base spin points!", 3000);
            updateDisplays(); saveGame();
        } else { showMessage("Not enough points for MEGA Boost!", 2000, true); }
    });


    // Auto Spin Unlock
    unlockAutoSpinButton.addEventListener('click', () => { /* ... (same, but use applyShopDiscount) ... */ });
    unlockRiskyWheelButton.addEventListener('click', () => { /* ... (same, but use applyShopDiscount) ... */ });
    unlockDemonWheelButton.addEventListener('click', () => { /* ... (same, but use applyShopDiscount) ... */ });

    // Job System
    getAJobButton.addEventListener('click', () => {
        if (jobUnlocked) { showMessage("You already have a base job!", 2000, true); return; }
        const cost = applyShopDiscount(jobUnlockCost);
        if (points >= cost) {
            points -= cost; jobUnlocked = true; jobLevel = 1; // Base job is level 1
            passiveIncomeRate += 1; // Initial job PPS
            startPassiveIncome();
            showMessage("You got a job! Earning 1 point per second.", 3000);
            updateDisplays(); saveGame();
        } else { showMessage("Not enough points to get a job.", 2000, true); }
    });

    jobPromotionButton.addEventListener('click', () => {
        if (!jobUnlocked) { showMessage("Get a job first!", 2000, true); return; }
        // jobLevel is current level. Cost for next promotion. Base job is level 1. First promo makes it level 2.
        const cost = calculateRampingCost(jobPromotionConfig.baseCost, jobPromotionConfig.costMultiplier, jobLevel -1); // Cost for (current jobLevel) promo
        if (points >= cost) {
            points -= cost; jobLevel++;
            passiveIncomeRate += jobPromotionConfig.ppsIncrease;
            showMessage(`Job Promotion! Now earning ${passiveIncomeRate} PPS.`, 3000);
            updateDisplays(); saveGame();
        } else { showMessage("Not enough points for a promotion.", 2000, true); }
    });

    hireEmployeeButton.addEventListener('click', () => {
        if (!jobUnlocked) { showMessage("Get a base job first to manage employees!", 2000, true); return;}
        const cost = calculateRampingCost(employeeConfig.baseCost, employeeConfig.costMultiplier, employeeCount);
        if (points >= cost) {
            points -= cost; employeeCount++;
            passiveIncomeRate += employeeConfig.ppsIncrease;
            showMessage(`Hired an Employee! (+${employeeConfig.ppsIncrease} PPS). Total PPS: ${passiveIncomeRate}`, 3000);
            updateDisplays(); saveGame();
        } else { showMessage("Not enough points to hire an employee.", 2000, true); }
    });


    function startPassiveIncome() { /* ... (same) ... */ }
    function stopPassiveIncome() { /* ... (same) ... */ }

    // --- Spin Button Event Listeners ---
    spinMainWheelButton.addEventListener('click', () => genericSpinWheelLogic('main', mainWheelCanvas, mainWheelSegments, baseSpinCostMainWheel, wheelCurrentAnglesRef, handleMainWheelSpinResult));
    spinRiskyWheelButton.addEventListener('click', () => genericSpinWheelLogic('risky', riskyWheelCanvas, riskyWheelSegments, riskyWheelSpinCost, wheelCurrentAnglesRef, handleRiskyWheelSpinResult));
    spinDemonWheelButton.addEventListener('click', () => genericSpinWheelLogic('demon', demonWheelCanvas, demonWheelSegments, demonWheelSpinCost, wheelCurrentAnglesRef, handleDemonWheelSpinResult));
    autoSpinButton.addEventListener('click', () => { /* ... (Ensure it checks applyShopDiscount(baseSpinCostMainWheel) for affordability) ... */ });
    navButtons.forEach(button => { /* ... (same) ... */ });

    function saveGame() {
        const gameState = {
            points, multiplierLevel, spinSpeedLevel, currentSpinDuration, isGoldenSpinActive, goldenTicketPurchaseCount,
            negativeProtectionUnlocked, flatBonusPoints, flatBonusLevel, autoSpinUnlocked, mainWheelSegments,
            wheelCurrentAngles: wheelCurrentAnglesRef,
            riskyWheelUnlocked, demonWheelUnlocked,
            jobUnlocked, jobLevel, employeeCount, passiveIncomeRate, // Added employeeCount
            shopDiscountLevel, currentShopDiscountPercentage, megaBasePointsBoostPurchased // New save states
        };
        localStorage.setItem('WheelOfFortuneGalacticGamble', JSON.stringify(gameState)); // New save key
    }

    function loadGame() {
        const savedGame = localStorage.getItem('WheelOfFortuneGalacticGamble');
        if (savedGame) {
            const gs = JSON.parse(savedGame);
            points = Number(gs.points) || basePointsToStart;
            multiplierLevel = Number(gs.multiplierLevel) || 1; spinSpeedLevel = Number(gs.spinSpeedLevel) || 1;
            currentSpinDuration = Number(gs.currentSpinDuration) || baseSpinDuration;
            isGoldenSpinActive = gs.isGoldenSpinActive || false; goldenTicketPurchaseCount = Number(gs.goldenTicketPurchaseCount) || 0;
            negativeProtectionUnlocked = gs.negativeProtectionUnlocked || false;
            flatBonusPoints = Number(gs.flatBonusPoints) || 0; flatBonusLevel = Number(gs.flatBonusLevel) || 0;
            autoSpinUnlocked = gs.autoSpinUnlocked || false;
            mainWheelSegments = gs.mainWheelSegments || JSON.parse(JSON.stringify(mainWheelSegmentsInitial));
            
            wheelCurrentAnglesRef.main = Number(gs.wheelCurrentAngles?.main) || 0;
            wheelCurrentAnglesRef.risky = Number(gs.wheelCurrentAngles?.risky) || 0;
            wheelCurrentAnglesRef.demon = Number(gs.wheelCurrentAngles?.demon) || 0;
            if(mainWheelCanvas) mainWheelCanvas.style.transform = `rotate(${wheelCurrentAnglesRef.main}rad)`;
            if(riskyWheelCanvas) riskyWheelCanvas.style.transform = `rotate(${wheelCurrentAnglesRef.risky}rad)`;
            if(demonWheelCanvas) demonWheelCanvas.style.transform = `rotate(${wheelCurrentAnglesRef.demon}rad)`;

            riskyWheelUnlocked = gs.riskyWheelUnlocked || false;
            demonWheelUnlocked = gs.demonWheelUnlocked || false;
            jobUnlocked = gs.jobUnlocked || false;
            jobLevel = Number(gs.jobLevel) || 0;
            employeeCount = Number(gs.employeeCount) || 0; // Load employeeCount
            passiveIncomeRate = Number(gs.passiveIncomeRate) || 0;

            shopDiscountLevel = Number(gs.shopDiscountLevel) || 0; // Load discount
            currentShopDiscountPercentage = Number(gs.currentShopDiscountPercentage) || 0;
            megaBasePointsBoostPurchased = gs.megaBasePointsBoostPurchased || false; // Load boost status


            if (jobUnlocked && passiveIncomeRate > 0) startPassiveIncome();
        } else {
            points = basePointsToStart; mainWheelSegments = JSON.parse(JSON.stringify(mainWheelSegmentsInitial));
        }
        currentSpinDuration = Math.max(spinSpeedConfig.minDuration, baseSpinDuration - (spinSpeedLevel - 1) * spinSpeedConfig.durationReductionPerLevel);
        currentMultiplier = multiplierLevel; // Ensure this is set on load
        // Recalculate passive income based on levels if not directly saved, or ensure saved passiveIncomeRate is accurate
        recalculatePassiveIncome(); // Add this function
    }
    function recalculatePassiveIncome() {
        let basePpsFromJob = jobUnlocked ? 1 : 0;
        let ppsFromPromotions = jobUnlocked ? (jobLevel -1) * jobPromotionConfig.ppsIncrease : 0;
        if (ppsFromPromotions < 0) ppsFromPromotions = 0; // Ensure it doesn't go negative if jobLevel is 0 but jobUnlocked somehow true
        let ppsFromEmployees = employeeCount * employeeConfig.ppsIncrease;
        passiveIncomeRate = basePpsFromJob + ppsFromPromotions + ppsFromEmployees;
    }


    function resetGameData() { /* ... (Ensure new state variables are reset) ... */ }
    resetButton.addEventListener('click', resetGameData);

    // Initial Setup
    loadGame();
    drawGenericWheel(mainCtx, mainWheelCanvas, mainWheelSegments, "Main Wheel");
    if (riskyWheelUnlocked && riskyCtx) drawGenericWheel(riskyCtx, riskyWheelCanvas, riskyWheelSegments, "Risky Wheel");
    if (demonWheelUnlocked && demonCtx) drawGenericWheel(demonCtx, demonWheelCanvas, demonWheelSegments, "Demon Wheel");
    updateDisplays();
});

// Make sure to complete the handleMainWheelSpinResult, handleRiskyWheelSpinResult, handleDemonWheelSpinResult,
// and the autoSpinButton logic where applyShopDiscount needs to be called for spin costs.
// Also ensure all new state variables are properly reset in resetGameData.
