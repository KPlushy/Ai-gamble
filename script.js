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
    const shopDiscountDisplay = document.getElementById('shop-discount-display'); // New
    const messageDisplay = document.getElementById('message-display');

    // --- Shop Item Elements (selected) ---
    const pickupTrashButton = document.getElementById('pickup-trash');
    const upgradeMultiplierButton = document.getElementById('upgrade-multiplier');
    const upgradeSpinSpeedButton = document.getElementById('upgrade-spin-speed');
    const activateGoldenSpinButton = document.getElementById('activate-golden-spin');
    const rerollWheelValuesButton = document.getElementById('reroll-wheel-values');
    const unlockNegativeProtectionButton = document.getElementById('unlock-negative-protection');
    const upgradeFlatBonusButton = document.getElementById('upgrade-flat-bonus'); // The +1 bonus
    const unlockAutoSpinButton = document.getElementById('unlock-auto-spin');
    const unlockRiskyWheelButton = document.getElementById('unlock-risky-wheel');
    const unlockDemonWheelButton = document.getElementById('unlock-demon-wheel');
    const getAJobButton = document.getElementById('get-a-job');
    const jobPromotionButton = document.getElementById('job-promotion');
    // New Shop Item Buttons
    const upgradeShopDiscountButton = document.getElementById('upgrade-shop-discount');
    const hireEmployeeButton = document.getElementById('hire-employee');
    const upgradePlus100BaseButton = document.getElementById('upgrade-plus-100-base');
    // Shop Sections
    const advancedUpgradesShopSection = document.getElementById('advanced-upgrades-shop');
    const employmentShopSection = document.getElementById('employment-shop');


    // --- Game Constants ---
    const baseSpinCostMainWheel = 25;
    const basePointsToStart = 50;
    const riskyWheelSpinCost = 1000;
    const demonWheelSpinCost = 100000000;

    // --- Game State Variables ---
    let points = 0;
    let wheelCurrentAngles = { main: 0, risky: 0, demon: 0 }; // Store visual angles
    let isSpinning = { main: false, risky: false, demon: false };

    let multiplierLevel = 1;
    let currentMultiplier = 1;
    let spinSpeedLevel = 1;
    let baseSpinDuration = 4000;
    let currentSpinDuration = baseSpinDuration;
    let isGoldenSpinActive = false;
    let goldenTicketPurchaseCount = 0;
    let negativeProtectionUnlocked = false;
    let flatBonusPoints = 0;
    let flatBonusLevel = 0; // For the +1 bonus
    const maxFlatBonusLevel = 1000000;
    let autoSpinUnlocked = false;

    let shopDiscountLevel = 0;
    let shopDiscountPercentage = 0; // 0 to 100

    let plus100BaseLevel = 0; // For the +100 base points upgrade

    let mainWheelSegmentsInitial = [
        { text: '10', value: 10, color: '#3498db', type: 'numeric' }, { text: '50', value: 50, color: '#e67e22', type: 'numeric' },
        { text: '100', value: 100, color: '#2ecc71', type: 'numeric' }, { text: 'Try Again', value: 0, color: '#95a5a6', type: 'neutral' },
        { text: '25', value: 25, color: '#f1c40f', type: 'numeric' }, { text: 'JACKPOT! 250', value: 250, color: '#e74c3c', size: 0.5, type: 'numeric' },
        { text: '-500 PTS', value: 'fixed_deduction', amount: -500, color: '#7f8c8d', type: 'special_deduction' },
        { text: '5', value: 5, color: '#1abc9c', type: 'numeric' }, { text: '75', value: 75, color: '#9b59b6', type: 'numeric' },
        { text: 'BONUS 150', value: 150, color: '#d35400', type: 'numeric' },
    ];
    let mainWheelSegments = JSON.parse(JSON.stringify(mainWheelSegmentsInitial));

    let riskyWheelUnlocked = false;
    const riskyWheelUnlockCost = 1000000;
    const riskyWheelSegments = [ /* As before */
        { text: '+100,000', value: 100000, color: '#2ecc71', type: 'numeric', size: 0.5 }, { text: '-25,000', value: -25000, color: '#e74c3c', type: 'numeric' },
        { text: '+50,000', value: 50000, color: '#3498db', type: 'numeric' }, { text: '-100,000', value: -100000, color: '#c0392b', type: 'numeric' },
        { text: '+10,000', value: 10000, color: '#1abc9c', type: 'numeric' }, { text: '-500,000', value: -500000, color: '#d35400', type: 'numeric', size: 1.5 },
        { text: '+2,500', value: 2500, color: '#9b59b6', type: 'numeric' }, { text: '-1,000,000', value: -1000000, color: '#34495e', type: 'numeric', size: 2 },
    ];
    let demonWheelUnlocked = false;
    const demonWheelUnlockCost = 100000000000;
    const demonWheelSegments = [ /* As before */
        { text: 'LOSE ALL!', value: 'lose_all', color: '#000000', type: 'special_extreme', size: 1.5 }, { text: '-500B PTS', value: -500000000000, color: '#4b0000', type: 'numeric_extreme' },
        { text: '-100B PTS', value: -100000000000, color: '#6e0000', type: 'numeric_extreme' }, { text: '+1T PTS!!!', value: 1000000000000, color: '#FFD700', type: 'numeric_extreme', size: 0.2 },
        { text: '-10B PTS', value: -10000000000, color: '#8B0000', type: 'numeric_extreme', size: 2 }, { text: '-1B PTS', value: -1000000000, color: '#A52A2A', type: 'numeric_extreme', size: 1.3},
    ];

    let jobUnlocked = false;
    const jobUnlockCost = 10000;
    let jobLevel = 0; // For promotions
    let employeeLevel = 0; // For "Hire Employee"
    let passiveIncomeRate = 0;
    let passiveIncomeInterval = null;

    // --- Shop Item Configs ---
    const multiplierConfig = { baseCost: 100, costMultiplier: 1.8 };
    const spinSpeedConfig = { baseCost: 150, costMultiplier: 1.7, durationReductionPerLevel: 300, minDuration: 200, maxLevel: 20 }; // Max level for practical cap
    const goldenTicketConfig = { baseCost: 5000, costMultiplier: 2.2, activationMultiplier: 100 };
    const rerollWheelCost = 1000;
    const negativeProtectionCost = 7500;
    const flatBonusConfig = { baseCost: 50, costIncreasePerLevel: 100 }; // For +1 bonus
    const autoSpinUnlockCost = 10000000;
    // New item configs
    const shopDiscountItemConfig = { baseCost: 50000, costMultiplier: 3, discountPerLevel: 2, maxLevel: 25 }; // Max 50% discount
    const plus100BaseConfig = { baseCost: 30000, costMultiplier: 2.1 };
    const jobPromotionConfig = { baseCost: 25000, costMultiplier: 2.5, ppsIncrease: 5 };
    const hireEmployeeConfig = { baseCost: 500000, costMultiplier: 3.5, ppsIncrease: 100 };


    // --- Utility Functions ---
    function applyShopDiscount(cost) {
        return Math.floor(cost * (1 - shopDiscountPercentage / 100));
    }
    function calculateRampingCost(base, multiplier, level, applyDisc = true) {
        let cost = Math.floor(base * Math.pow(multiplier, level));
        return applyDisc ? applyShopDiscount(cost) : cost;
    }
    function calculateLinearCost(base, increasePerLevel, level, applyDisc = true) { // For flat bonus
        let cost = base + (level * increasePerLevel);
        return applyDisc ? applyShopDiscount(cost) : cost;
    }

    function showMessage(text, duration = 3000, isError = false) { /* As before */
        messageDisplay.textContent = text;
        messageDisplay.style.color = isError ? '#e74c3c' : '#f0b90b';
        if (duration > 0) setTimeout(() => messageDisplay.textContent = '', duration);
    }
    function easeOutCubic(t) { return (--t) * t * t + 1; }

    // --- Wheel Drawing (Generic) ---
    function drawGenericWheel(ctx, canvasEl, segmentsArray, wheelName) { /* As before, ensure font sizes are okay */
        if (!ctx) { console.error(`No context for ${wheelName}`); return; }
        const totalSize = segmentsArray.reduce((sum, seg) => sum + (seg.size || 1), 0);
        let currentDrawAngle = 0;
        const centerX = canvasEl.width / 2; const centerY = canvasEl.height / 2;
        const radius = Math.min(centerX, centerY) - 9; // Slightly more padding

        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        segmentsArray.forEach(segment => {
            const angle = (segment.size || 1) / totalSize * 2 * Math.PI;
            ctx.beginPath(); ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentDrawAngle, currentDrawAngle + angle);
            ctx.closePath(); ctx.fillStyle = segment.color; ctx.fill();
            ctx.strokeStyle = '#1a1a2c'; ctx.lineWidth = 2; ctx.stroke(); // Darker stroke

            ctx.save(); ctx.translate(centerX, centerY); ctx.rotate(currentDrawAngle + angle / 2);
            ctx.textAlign = 'right'; ctx.fillStyle = '#f0f0f0'; // Brighter text
            ctx.font = (canvasEl.width > 380) ? 'bold 11px Segoe UI' : 'bold 10px Segoe UI';
            let Stext = segment.text;
            if (Stext.length > 12 && wheelName !== "Demon Wheel") Stext = Stext.substring(0,10) + "..";
            else if (Stext.length > 10 && wheelName === "Demon Wheel") ctx.font = 'bold 9px Segoe UI';
            ctx.fillText(Stext, radius - 8, 4); // Adjusted position
            ctx.restore();
            currentDrawAngle += angle;
        });
    }

    // --- Update Displays ---
    function updateDisplays() {
        pointsDisplay.textContent = points.toLocaleString();
        currentMultiplier = multiplierLevel; // Direct for now
        multiplierDisplay.textContent = `${currentMultiplier}x (Lv. ${multiplierLevel})`;
        spinSpeedDisplay.textContent = `Lv. ${spinSpeedLevel} (${(currentSpinDuration / 1000).toFixed(1)}s)`;
        flatBonusDisplay.textContent = `+${flatBonusPoints.toLocaleString()}`;
        goldenSpinStatusDisplay.textContent = isGoldenSpinActive ? "ACTIVE (100x Next!)" : "Inactive";
        goldenSpinStatusDisplay.style.color = isGoldenSpinActive ? "#f0b90b" : "#d8d8e8";
        negativeProtectionStatusDisplay.textContent = negativeProtectionUnlocked ? "ACTIVE" : "Inactive";
        negativeProtectionStatusDisplay.style.color = negativeProtectionUnlocked ? "lightgreen" : "#d8d8e8";
        passiveIncomeDisplay.textContent = `${passiveIncomeRate.toLocaleString()} PPS`;
        shopDiscountDisplay.textContent = `${shopDiscountPercentage}%`;

        // --- Main Wheel Button State (Critical for Golden Ticket) ---
        const canAffordMainSpin = points >= baseSpinCostMainWheel;
        if (isGoldenSpinActive) {
            spinMainWheelButton.textContent = "Use Golden Spin! (FREE)";
            spinMainWheelButton.disabled = isSpinning.main; // Only disabled if actually spinning
        } else {
            spinMainWheelButton.textContent = `Spin Main Wheel (Cost: ${baseSpinCostMainWheel.toLocaleString()} P)`;
            spinMainWheelButton.disabled = isSpinning.main || !canAffordMainSpin;
        }
        spinMainWheelButton.title = isGoldenSpinActive ? "Your next spin is FREE and GOLDEN!" : "";

        autoSpinButton.disabled = isSpinning.main || !canAffordMainSpin || !autoSpinUnlocked || isGoldenSpinActive;

        // Other wheel buttons
        spinRiskyWheelButton.disabled = isSpinning.risky || points < applyShopDiscount(riskyWheelSpinCost) || !riskyWheelUnlocked; // Apply discount to spin cost if desired
        spinRiskyWheelButton.textContent = `Spin Risky Wheel (Cost: ${applyShopDiscount(riskyWheelSpinCost).toLocaleString()} P)`;

        spinDemonWheelButton.disabled = isSpinning.demon || points < applyShopDiscount(demonWheelSpinCost) || !demonWheelUnlocked;
        spinDemonWheelButton.textContent = `Spin Demon Wheel (Cost: ${applyShopDiscount(demonWheelSpinCost).toLocaleString()} P)`;


        // --- Shop Item Updates (with discount application) ---
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
        activateGoldenSpinButton.classList.toggle('disabled', (points < nextGoldenTicketCost && !isGoldenSpinActive) || isGoldenSpinActive); // Disable if active or cannot afford
        activateGoldenSpinButton.classList.toggle('active', isGoldenSpinActive);


        const actualRerollCost = applyShopDiscount(rerollWheelCost);
        rerollWheelValuesButton.innerHTML = `Shift Main Wheel Values <br> Cost: ${actualRerollCost.toLocaleString()} P`;
        rerollWheelValuesButton.classList.toggle('disabled', points < actualRerollCost);

        const actualNegProtCost = applyShopDiscount(negativeProtectionCost);
        unlockNegativeProtectionButton.innerHTML = negativeProtectionUnlocked ? `Neg. Protection Unlocked` : `Unlock Negative Protection <br> Cost: ${actualNegProtCost.toLocaleString()} P`;
        unlockNegativeProtectionButton.classList.toggle('disabled', points < actualNegProtCost && !negativeProtectionUnlocked);
        if(negativeProtectionUnlocked) unlockNegativeProtectionButton.classList.add('purchased');

        const nextFlatBonusCost = calculateLinearCost(flatBonusConfig.baseCost, flatBonusConfig.costIncreasePerLevel, flatBonusLevel);
        upgradeFlatBonusButton.innerHTML = `Add Base Spin Point (+${flatBonusPoints + 1}) <br> Cost: ${nextFlatBonusCost.toLocaleString()} P`;
        upgradeFlatBonusButton.classList.toggle('disabled', points < nextFlatBonusCost || flatBonusLevel >= maxFlatBonusLevel );
        if (flatBonusLevel >= maxFlatBonusLevel) upgradeFlatBonusButton.innerHTML = `Add Base Spin Point (MAX Lv.) <br> -----`;

        // New Shop Items updates
        const nextShopDiscountCost = calculateRampingCost(shopDiscountItemConfig.baseCost, shopDiscountItemConfig.costMultiplier, shopDiscountLevel);
        upgradeShopDiscountButton.innerHTML = `Improve Shop Discount (${shopDiscountPercentage + shopDiscountItemConfig.discountPerLevel}%) <br> Cost: ${nextShopDiscountCost.toLocaleString()} P`;
        const atMaxDiscount = shopDiscountLevel >= shopDiscountItemConfig.maxLevel;
        upgradeShopDiscountButton.classList.toggle('disabled', points < nextShopDiscountCost || atMaxDiscount);
        if(atMaxDiscount) upgradeShopDiscountButton.innerHTML = `Shop Discount (MAX ${shopDiscountPercentage}%) <br> -----`;

        const nextPlus100BaseCost = calculateRampingCost(plus100BaseConfig.baseCost, plus100BaseConfig.costMultiplier, plus100BaseLevel);
        upgradePlus100BaseButton.innerHTML = `Boost Base Points (+100) (Lv. ${plus100BaseLevel + 1}) <br> Cost: ${nextPlus100BaseCost.toLocaleString()} P`;
        upgradePlus100BaseButton.classList.toggle('disabled', points < nextPlus100BaseCost);


        // Auto Spin Unlock
        const actualAutoSpinCost = applyShopDiscount(autoSpinUnlockCost);
        unlockAutoSpinButton.innerHTML = autoSpinUnlocked ? `Auto-Spin Unlocked` : `Unlock Auto-Spin <br> Cost: ${actualAutoSpinCost.toLocaleString()} P`;
        unlockAutoSpinButton.classList.toggle('disabled', points < actualAutoSpinCost && !autoSpinUnlocked);
        if(autoSpinUnlocked) { unlockAutoSpinButton.classList.add('purchased'); autoSpinButton.style.display = 'block'; }
        else { autoSpinButton.style.display = 'none'; }

        // Wheel Unlocks & Conditional Shop Sections
        const actualRiskyUnlockCost = applyShopDiscount(riskyWheelUnlockCost); // Assuming unlock costs can be discounted
        unlockRiskyWheelButton.innerHTML = riskyWheelUnlocked ? `Risky Wheel Unlocked` : `Unlock Risky Wheel <br> Cost: ${actualRiskyUnlockCost.toLocaleString()} P`;
        unlockRiskyWheelButton.classList.toggle('disabled', points < actualRiskyUnlockCost && !riskyWheelUnlocked);
        if(riskyWheelUnlocked) {
            unlockRiskyWheelButton.classList.add('purchased');
            document.getElementById('nav-risky-wheel').style.display = 'inline-block';
            employmentShopSection.style.display = 'block';
            advancedUpgradesShopSection.style.display = 'block';
        } else {
            document.getElementById('nav-risky-wheel').style.display = 'none';
            employmentShopSection.style.display = 'none';
            advancedUpgradesShopSection.style.display = 'none';
        }

        const actualDemonUnlockCost = applyShopDiscount(demonWheelUnlockCost);
        unlockDemonWheelButton.innerHTML = demonWheelUnlocked ? `Demon Wheel Unlocked` : `Unlock Demon Wheel <br> Cost: ${actualDemonUnlockCost.toLocaleString()} P`;
        unlockDemonWheelButton.classList.toggle('disabled', points < actualDemonUnlockCost && !demonWheelUnlocked);
        if(demonWheelUnlocked) {
            unlockDemonWheelButton.classList.add('purchased');
            document.getElementById('nav-demon-wheel').style.display = 'inline-block';
        } else {
            document.getElementById('nav-demon-wheel').style.display = 'none';
        }

        // Employment Shop
        if (riskyWheelUnlocked) {
            const actualJobCost = applyShopDiscount(jobUnlockCost);
            getAJobButton.innerHTML = jobUnlocked ? `Employed (Base PPS Active)` : `Get a Job (1 PPS) <br> Cost: ${actualJobCost.toLocaleString()} P`;
            getAJobButton.classList.toggle('disabled', points < actualJobCost && !jobUnlocked);
            if (jobUnlocked) getAJobButton.classList.add('purchased');

            const nextPromotionCost = calculateRampingCost(jobPromotionConfig.baseCost, jobPromotionConfig.costMultiplier, jobLevel);
            jobPromotionButton.innerHTML = `Job Promotion (+${jobPromotionConfig.ppsIncrease} PPS) <br> Cost: ${nextPromotionCost.toLocaleString()} P`;
            jobPromotionButton.classList.toggle('disabled', points < nextPromotionCost || !jobUnlocked);
            jobPromotionButton.style.display = jobUnlocked ? 'block' : 'none';

            const nextEmployeeCost = calculateRampingCost(hireEmployeeConfig.baseCost, hireEmployeeConfig.costMultiplier, employeeLevel);
            hireEmployeeButton.innerHTML = `Hire Employee (+${hireEmployeeConfig.ppsIncrease} PPS) <br> Cost: ${nextEmployeeCost.toLocaleString()} P`;
            hireEmployeeButton.classList.toggle('disabled', points < nextEmployeeCost || !jobUnlocked); // Need a job to hire employees under you
             hireEmployeeButton.style.display = jobUnlocked ? 'block' : 'none';
        }
    }

    // --- Generic Spin Logic (Critical Golden Ticket Change Here) ---
    function genericSpinWheelLogic(wheelType, canvasEl, segmentsArray, baseSpinCost, wheelAngleRef, handleResultFunc, spinDurationOverride = null) {
        if (isSpinning[wheelType]) return;

        let actualSpinCost = baseSpinCost;
        if (wheelType === 'main' && isGoldenSpinActive) {
            actualSpinCost = 0; // Golden spin on Main Wheel is FREE
        }
        // For other wheels, apply shop discount to their spin costs if those were variables
        // For simplicity, risky/demon spin costs are constants in this version but could be made variables from shop
        if (wheelType === 'risky') actualSpinCost = applyShopDiscount(riskyWheelSpinCost);
        if (wheelType === 'demon') actualSpinCost = applyShopDiscount(demonWheelSpinCost);


        if (points < actualSpinCost && !(wheelType === 'main' && isGoldenSpinActive)) { // Don't check points if it's a free golden spin
            showMessage(`Not enough points for ${wheelType} wheel! Need ${actualSpinCost.toLocaleString()}`, 3000, true);
            return;
        }

        if (!(wheelType === 'main' && isGoldenSpinActive)) { // Don't deduct points for golden spin
            points -= actualSpinCost;
        }

        isSpinning[wheelType] = true;
        updateDisplays(); // Update points and button states immediately
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
        const fullRotations = (wheelType === 'main') ? (5 + spinSpeedLevel) : (wheelType === 'risky' ? 4 : 3); // Vary rotations
        const finalTargetAngle = (fullRotations * 2 * Math.PI) - targetSegmentMidAngle + pointerOffset;

        let startTime = null;
        const startRotationAngle = wheelAngleRef[wheelType];
        const effectiveSpinDuration = spinDurationOverride || (wheelType === 'main' ? currentSpinDuration : (wheelType === 'risky' ? 3000 : 2500));

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
                wheelAngleRef[wheelType] = finalTargetAngle % (2 * Math.PI);
                isSpinning[wheelType] = false;
                handleResultFunc(segmentsArray[winningSegmentIndex], wheelType); // Pass wheelType
                // Auto-spin logic remains similar, but ensure golden ticket state is respected
                if (wheelType === 'main' && document.getElementById('auto-spin-button').dataset.autoSpinActive === "true" && autoSpinUnlocked && points >= baseSpinCostMainWheel && !isGoldenSpinActive) {
                    setTimeout(() => genericSpinWheelLogic('main', mainWheelCanvas, mainWheelSegments, baseSpinCostMainWheel, wheelCurrentAngles, handleMainWheelSpinResult), 1200);
                } else if (wheelType === 'main' && document.getElementById('auto-spin-button').dataset.autoSpinActive === "true") {
                    autoSpinButton.dataset.autoSpinActive = "false";
                    autoSpinButton.textContent = "Auto-Spin Main Wheel";
                    // No need to show message here, updateDisplays will handle button text
                }
                updateDisplays(); // Crucial final update
            }
        }
        requestAnimationFrame(animateSpin);
    }


    // --- Result Handlers (Pass wheelType to main handler if it influences golden ticket) ---
    function handleMainWheelSpinResult(segment, wheelType) { // wheelType included for clarity, though golden is specific to main
        let actualGainedPoints = 0;
        let message = "";
        let spinValueWithBonus = 0;

        if (segment.type === 'numeric') {
            spinValueWithBonus = (segment.value || 0) + flatBonusPoints;
            if (spinValueWithBonus < 0 && negativeProtectionUnlocked) {
                actualGainedPoints = 25;
                message = `Landed on ${segment.text}. Negative Protection: +25 points!`;
            } else {
                actualGainedPoints = spinValueWithBonus * currentMultiplier;
                // Golden Spin Logic - now check current isGoldenSpinActive state
                if (isGoldenSpinActive && wheelType === 'main') { // Ensure it's for the main wheel
                    if (spinValueWithBonus > 0) {
                        actualGainedPoints *= goldenTicketConfig.activationMultiplier;
                        message = `GOLDEN SPIN! Landed on ${segment.text}. Base: ${spinValueWithBonus}, x${currentMultiplier} & GOLDEN x${goldenTicketConfig.activationMultiplier} = ${actualGainedPoints.toLocaleString()} P!`;
                    } else {
                         message = `Landed on ${segment.text}. Golden spin not applied to non-positive value. Points: ${actualGainedPoints.toLocaleString()}`;
                    }
                    // Consume the golden ticket AFTER its effect is determined for THIS spin
                    isGoldenSpinActive = false;
                } else {
                    message = `Landed on ${segment.text}. Base: ${spinValueWithBonus}, x${currentMultiplier} multiplier = ${actualGainedPoints.toLocaleString()} P.`;
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
        // updateDisplays() and saveGame() will be called by the generic spin logic's completion
    }

    function handleRiskyWheelSpinResult(segment) { /* As before */
        let actualGainedPoints = segment.value || 0;
        points += actualGainedPoints;
        if (points < 0) points = 0;
        showMessage(`Risky Wheel: ${segment.text}! Outcome: ${actualGainedPoints.toLocaleString()} points.`, 4000);
    }

    function handleDemonWheelSpinResult(segment) { /* As before */
        let actualGainedPoints = 0; let message = "";
        if (segment.value === 'lose_all') { actualGainedPoints = -points; message = "DEMON WHEEL: YOU LOST EVERYTHING!"; }
        else if (segment.type === 'numeric_extreme') { actualGainedPoints = segment.value || 0; message = `DEMON WHEEL: ${segment.text}! Outcome: ${actualGainedPoints.toLocaleString()} points!`;}
        else { message = "DEMON WHEEL: An unknown fate..."; }
        points += actualGainedPoints; if (points < 0) points = 0;
        showMessage(message, 6000, actualGainedPoints < 0 && segment.value !== 'lose_all');
    }

    // --- Shop Logic (with new items) ---
    pickupTrashButton.addEventListener('click', () => { points += 1; showMessage("+1 Point!", 1500); updateDisplays(); saveGame(); });

    upgradeMultiplierButton.addEventListener('click', () => {
        const cost = calculateRampingCost(multiplierConfig.baseCost, multiplierConfig.costMultiplier, multiplierLevel);
        if (points >= cost) { points -= cost; multiplierLevel++; showMessage(`Main Multiplier to Lv ${multiplierLevel}!`, 2500); updateDisplays(); saveGame(); }
        else { showMessage("Not enough points!", 2000, true); }
    });
    upgradeSpinSpeedButton.addEventListener('click', () => {
        if (spinSpeedLevel >= spinSpeedConfig.maxLevel || currentSpinDuration <= spinSpeedConfig.minDuration) return;
        const cost = calculateRampingCost(spinSpeedConfig.baseCost, spinSpeedConfig.costMultiplier, spinSpeedLevel);
        if (points >= cost) {
            points -= cost; spinSpeedLevel++;
            currentSpinDuration = Math.max(spinSpeedConfig.minDuration, baseSpinDuration - (spinSpeedLevel - 1) * spinSpeedConfig.durationReductionPerLevel);
            showMessage(`Main Spin speed to Lv ${spinSpeedLevel}!`, 2500); updateDisplays(); saveGame();
        } else { showMessage("Not enough points!", 2000, true); }
    });
    activateGoldenSpinButton.addEventListener('click', () => {
        if (isGoldenSpinActive) return; // Already active
        const cost = calculateRampingCost(goldenTicketConfig.baseCost, goldenTicketConfig.costMultiplier, goldenTicketPurchaseCount);
        if (points >= cost) {
            points -= cost; isGoldenSpinActive = true; goldenTicketPurchaseCount++;
            showMessage(`Golden Spin (100x) ACTIVATED for next main wheel spin!`, 3000);
            updateDisplays(); saveGame(); // updateDisplays will fix button text
        } else { showMessage("Not enough points for Golden Spin!", 2000, true); }
    });
    rerollWheelValuesButton.addEventListener('click', () => {
        const cost = applyShopDiscount(rerollWheelCost);
        if (points >= cost) {
            points -= cost; mainWheelSegments.forEach(seg => { /* ... reroll logic ... */
                if (seg.type === 'numeric') { seg.value = Math.floor(Math.random() * 3501) - 500; seg.text = seg.value > 999 ? (seg.value/1000).toFixed(1)+"k" : seg.value.toString(); }
            });
            drawGenericWheel(mainCtx, mainWheelCanvas, mainWheelSegments, "Main Wheel");
            showMessage("Main Wheel values shifted!", 3000); updateDisplays(); saveGame();
        } else { showMessage("Not enough points!", 2000, true); }
    });
    unlockNegativeProtectionButton.addEventListener('click', () => {
        if (negativeProtectionUnlocked) return;
        const cost = applyShopDiscount(negativeProtectionCost);
        if (points >= cost) { points -= cost; negativeProtectionUnlocked = true; showMessage("Negative Pt Protection Unlocked!", 3000); updateDisplays(); saveGame(); }
        else { showMessage("Not enough points!", 2000, true); }
    });
    upgradeFlatBonusButton.addEventListener('click', () => { // The +1 bonus
        if (flatBonusLevel >= maxFlatBonusLevel) return;
        const cost = calculateLinearCost(flatBonusConfig.baseCost, flatBonusConfig.costIncreasePerLevel, flatBonusLevel);
        if (points >= cost) { points -= cost; flatBonusLevel++; flatBonusPoints++; showMessage(`Base Spin Bonus to +${flatBonusPoints}!`, 2500); updateDisplays(); saveGame(); }
        else { showMessage("Not enough points!", 2000, true); }
    });
    // New Shop Item Listeners
    upgradeShopDiscountButton.addEventListener('click', () => {
        if (shopDiscountLevel >= shopDiscountItemConfig.maxLevel) return;
        const cost = calculateRampingCost(shopDiscountItemConfig.baseCost, shopDiscountItemConfig.costMultiplier, shopDiscountLevel, false); // Discount doesn't apply to its own upgrade cost
        if (points >= cost) {
            points -= cost; shopDiscountLevel++;
            shopDiscountPercentage = Math.min(100, shopDiscountLevel * shopDiscountItemConfig.discountPerLevel);
            showMessage(`Shop Discount improved to ${shopDiscountPercentage}%!`, 3000);
            updateDisplays(); saveGame();
        } else { showMessage("Not enough points for discount upgrade!", 2000, true); }
    });
    upgradePlus100BaseButton.addEventListener('click', () => {
        const cost = calculateRampingCost(plus100BaseConfig.baseCost, plus100BaseConfig.costMultiplier, plus100BaseLevel);
        if (points >= cost) {
            points -= cost; plus100BaseLevel++; flatBonusPoints += 100;
            showMessage(`Base Spin Bonus massively increased by +100! Total: +${flatBonusPoints}`, 3000);
            updateDisplays(); saveGame();
        } else { showMessage("Not enough points for +100 Base boost!", 2000, true); }
    });
    hireEmployeeButton.addEventListener('click', () => {
        if (!jobUnlocked) { showMessage("Get a job first!", 2000, true); return; }
        const cost = calculateRampingCost(hireEmployeeConfig.baseCost, hireEmployeeConfig.costMultiplier, employeeLevel);
        if (points >= cost) {
            points -= cost; employeeLevel++; passiveIncomeRate += hireEmployeeConfig.ppsIncrease;
            showMessage(`Hired an Employee! Passive income +${hireEmployeeConfig.ppsIncrease} PPS! Total: ${passiveIncomeRate} PPS`, 3000);
            updateDisplays(); saveGame();
        } else { showMessage("Not enough points to hire an Employee.", 2000, true); }
    });


    unlockAutoSpinButton.addEventListener('click', () => {
        if (autoSpinUnlocked) return;
        const cost = applyShopDiscount(autoSpinUnlockCost);
        if (points >= cost) { points -= cost; autoSpinUnlocked = true; showMessage("Auto-Spin for Main Wheel Unlocked!", 3000); updateDisplays(); saveGame(); }
        else { showMessage("Not enough points!", 2000, true); }
    });
    unlockRiskyWheelButton.addEventListener('click', () => {
        if (riskyWheelUnlocked) return;
        const cost = applyShopDiscount(riskyWheelUnlockCost);
        if (points >= cost) {
            points -= cost; riskyWheelUnlocked = true; showMessage("Risky Wheel Unlocked!", 3000);
            drawGenericWheel(riskyCtx, riskyWheelCanvas, riskyWheelSegments, "Risky Wheel");
            updateDisplays(); saveGame();
        } else { showMessage("Not enough points!", 2000, true); }
    });
    unlockDemonWheelButton.addEventListener('click', () => {
        if (demonWheelUnlocked) return;
        const cost = applyShopDiscount(demonWheelUnlockCost);
        if (points >= cost) {
            points -= cost; demonWheelUnlocked = true; showMessage("The DEMON WHEEL is Unlocked...", 4000);
            drawGenericWheel(demonCtx, demonWheelCanvas, demonWheelSegments, "Demon Wheel");
            updateDisplays(); saveGame();
        } else { showMessage("Not nearly enough for the Demon Wheel!", 3000, true); }
    });

    // Job System
    getAJobButton.addEventListener('click', () => {
        if (jobUnlocked) return;
        const cost = applyShopDiscount(jobUnlockCost);
        if (points >= cost) {
            points -= cost; jobUnlocked = true; jobLevel = 0; // Level 0 is base job before first promotion
            passiveIncomeRate += 1; // Initial 1 PPS
            startPassiveIncome(); showMessage("You got a job! Earning 1 point per second.", 3000);
            updateDisplays(); saveGame();
        } else { showMessage("Not enough points for a job.", 2000, true); }
    });
    jobPromotionButton.addEventListener('click', () => {
        if (!jobUnlocked) return;
        const cost = calculateRampingCost(jobPromotionConfig.baseCost, jobPromotionConfig.costMultiplier, jobLevel);
        if (points >= cost) {
            points -= cost; jobLevel++; passiveIncomeRate += jobPromotionConfig.ppsIncrease;
            showMessage(`Job Promotion! Now earning ${passiveIncomeRate} PPS.`, 3000);
            updateDisplays(); saveGame();
        } else { showMessage("Not enough for a promotion.", 2000, true); }
    });

    function startPassiveIncome() { /* As before */
        if (passiveIncomeInterval) clearInterval(passiveIncomeInterval);
        if (jobUnlocked && passiveIncomeRate > 0) {
            passiveIncomeInterval = setInterval(() => { points += passiveIncomeRate; updateDisplays(); /* saveGame removed */ }, 1000);
        }
    }
    function stopPassiveIncome() { /* As before */ if (passiveIncomeInterval) clearInterval(passiveIncomeInterval); passiveIncomeInterval = null; }


    // --- Spin Button Event Listeners ---
    spinMainWheelButton.addEventListener('click', () => genericSpinWheelLogic('main', mainWheelCanvas, mainWheelSegments, baseSpinCostMainWheel, wheelCurrentAngles, handleMainWheelSpinResult));
    spinRiskyWheelButton.addEventListener('click', () => genericSpinWheelLogic('risky', riskyWheelCanvas, riskyWheelSegments, riskyWheelSpinCost, wheelCurrentAngles, handleRiskyWheelSpinResult));
    spinDemonWheelButton.addEventListener('click', () => genericSpinWheelLogic('demon', demonWheelCanvas, demonWheelSegments, demonWheelSpinCost, wheelCurrentAngles, handleDemonWheelSpinResult));
    autoSpinButton.addEventListener('click', () => { /* Auto-spin logic as before, ensure it respects golden ticket */
        const autoSpinState = autoSpinButton.dataset.autoSpinActive === "true";
        if (!autoSpinUnlocked) { showMessage("Unlock Auto-Spin first!", 2000, true); return; }
        if (autoSpinState) {
            autoSpinButton.dataset.autoSpinActive = "false"; autoSpinButton.textContent = "Auto-Spin Main Wheel";
            showMessage("Auto-Spin Deactivated.", 2000);
        } else {
            if (points < baseSpinCostMainWheel && !isGoldenSpinActive) { showMessage("Not enough points to start Auto-Spin!", 2000, true); return; }
            if (isGoldenSpinActive) { showMessage("Cannot Auto-Spin with Golden Spin active!", 2000, true); return; }
            autoSpinButton.dataset.autoSpinActive = "true"; autoSpinButton.textContent = "Stop Auto-Spin";
            showMessage("Auto-Spin Activated!", 2000);
            genericSpinWheelLogic('main', mainWheelCanvas, mainWheelSegments, baseSpinCostMainWheel, wheelCurrentAngles, handleMainWheelSpinResult);
        }
    });

    // --- Navigation ---
    navButtons.forEach(button => { /* As before */
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
            negativeProtectionUnlocked, flatBonusPoints, flatBonusLevel, plus100BaseLevel, autoSpinUnlocked, mainWheelSegments,
            wheelCurrentAngles, riskyWheelUnlocked, demonWheelUnlocked,
            jobUnlocked, jobLevel, employeeLevel, passiveIncomeRate,
            shopDiscountLevel, shopDiscountPercentage
        };
        localStorage.setItem('WheelOfFortuneGalacticGamble', JSON.stringify(gameState));
    }
    function loadGame() {
        const savedGame = localStorage.getItem('WheelOfFortuneGalacticGamble');
        if (savedGame) {
            const gs = JSON.parse(savedGame);
            points = gs.points || basePointsToStart;
            multiplierLevel = gs.multiplierLevel || 1; spinSpeedLevel = gs.spinSpeedLevel || 1;
            currentSpinDuration = gs.currentSpinDuration || baseSpinDuration;
            isGoldenSpinActive = gs.isGoldenSpinActive || false; goldenTicketPurchaseCount = gs.goldenTicketPurchaseCount || 0;
            negativeProtectionUnlocked = gs.negativeProtectionUnlocked || false;
            flatBonusPoints = gs.flatBonusPoints || 0; flatBonusLevel = gs.flatBonusLevel || 0;
            plus100BaseLevel = gs.plus100BaseLevel || 0; // Load new
            autoSpinUnlocked = gs.autoSpinUnlocked || false;
            mainWheelSegments = gs.mainWheelSegments || JSON.parse(JSON.stringify(mainWheelSegmentsInitial));
            wheelCurrentAngles = gs.wheelCurrentAngles || { main: 0, risky: 0, demon: 0 };
            mainWheelCanvas.style.transform = `rotate(${wheelCurrentAngles.main}rad)`;
            riskyWheelCanvas.style.transform = `rotate(${wheelCurrentAngles.risky}rad)`;
            demonWheelCanvas.style.transform = `rotate(${wheelCurrentAngles.demon}rad)`;
            riskyWheelUnlocked = gs.riskyWheelUnlocked || false; demonWheelUnlocked = gs.demonWheelUnlocked || false;
            jobUnlocked = gs.jobUnlocked || false; jobLevel = gs.jobLevel || 0; employeeLevel = gs.employeeLevel || 0; // Load new
            passiveIncomeRate = gs.passiveIncomeRate || 0;
            shopDiscountLevel = gs.shopDiscountLevel || 0; shopDiscountPercentage = gs.shopDiscountPercentage || 0; // Load new

            if (jobUnlocked && passiveIncomeRate > 0) startPassiveIncome();
        } else { points = basePointsToStart; mainWheelSegments = JSON.parse(JSON.stringify(mainWheelSegmentsInitial)); }
    }
    function resetGameData() { /* As before, ensure all new state variables are reset */
        if (confirm("Are you sure you want to reset ALL game data? This is irreversible!")) {
            stopPassiveIncome();
            localStorage.removeItem('WheelOfFortuneGalacticGamble');
            // Reset all state variables
            points = basePointsToStart; multiplierLevel = 1; currentMultiplier = 1; spinSpeedLevel = 1; currentSpinDuration = baseSpinDuration;
            isGoldenSpinActive = false; goldenTicketPurchaseCount = 0; negativeProtectionUnlocked = false;
            flatBonusPoints = 0; flatBonusLevel = 0; plus100BaseLevel = 0; autoSpinUnlocked = false;
            mainWheelSegments = JSON.parse(JSON.stringify(mainWheelSegmentsInitial));
            wheelCurrentAngles = { main: 0, risky: 0, demon: 0 };
            mainWheelCanvas.style.transform = `rotate(0rad)`; riskyWheelCanvas.style.transform = `rotate(0rad)`; demonWheelCanvas.style.transform = `rotate(0rad)`;
            riskyWheelUnlocked = false; demonWheelUnlocked = false;
            jobUnlocked = false; jobLevel = 0; employeeLevel = 0; passiveIncomeRate = 0;
            shopDiscountLevel = 0; shopDiscountPercentage = 0;
            autoSpinButton.dataset.autoSpinActive = "false"; autoSpinButton.textContent = "Auto-Spin Main Wheel";
            showMessage("Game Reset! Starting fresh.", 3000);
            drawGenericWheel(mainCtx, mainWheelCanvas, mainWheelSegments, "Main Wheel");
            // Only draw other wheels if they *would* be unlocked by default (they are not, so this is fine)
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
