document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const spinButton = document.getElementById('spin-button');
    const autoSpinButton = document.getElementById('auto-spin-button');
    const pointsDisplay = document.getElementById('points-display');
    const multiplierDisplay = document.getElementById('multiplier-display');
    const spinSpeedDisplay = document.getElementById('spin-speed-display');
    const flatBonusDisplay = document.getElementById('flat-bonus-display');
    const goldenSpinStatusDisplay = document.getElementById('golden-spin-status-display');
    const negativeProtectionStatusDisplay = document.getElementById('negative-protection-status-display');
    const messageDisplay = document.getElementById('message-display');
    const resetButton = document.getElementById('reset-button');

    // Shop Item Elements
    const pickupTrashButton = document.getElementById('pickup-trash');
    const upgradeMultiplierButton = document.getElementById('upgrade-multiplier');
    const upgradeSpinSpeedButton = document.getElementById('upgrade-spin-speed');
    const activateGoldenSpinButton = document.getElementById('activate-golden-spin');
    const rerollWheelValuesButton = document.getElementById('reroll-wheel-values');
    const unlockNegativeProtectionButton = document.getElementById('unlock-negative-protection');
    const upgradeFlatBonusButton = document.getElementById('upgrade-flat-bonus');
    const unlockAutoSpinButton = document.getElementById('unlock-auto-spin');

    const baseSpinCost = 25;
    const basePointsToStart = 50;

    let points = 0;
    let currentAngle = 0;
    let isSpinning = false;

    // --- Game State Variables ---
    let multiplierLevel = 1;
    let currentMultiplier = 1;

    let spinSpeedLevel = 1;
    let baseSpinDuration = 4000;
    let currentSpinDuration = baseSpinDuration;

    let isGoldenSpinActive = false;
    let goldenTicketPurchaseCount = 0; // Tracks how many times golden ticket was bought for price ramp

    let negativeProtectionUnlocked = false;

    let flatBonusPoints = 0;
    let flatBonusLevel = 0; // Level 0 means +0 bonus, level 1 means +1 bonus
    const maxFlatBonusLevel = 1000000; // Practical limit for flat bonus

    let autoSpinUnlocked = false;

    // --- Shop Item Configs ---
    const multiplierConfig = { baseCost: 100, costMultiplier: 1.8, maxLevel: 10 };
    const spinSpeedConfig = { baseCost: 150, costMultiplier: 1.7, durationReductionPerLevel: 300, minDuration: 500, maxLevel: 10 };
    const goldenTicketConfig = { baseCost: 5000, costMultiplier: 2.2, activationMultiplier: 100 };
    const rerollWheelCost = 1000;
    const negativeProtectionCost = 7500;
    const flatBonusConfig = { baseCost: 50, costIncreasePerLevel: 100 };
    const autoSpinUnlockCost = 100000000;

    let segments = [ // Added 'type' for easier handling
        { text: '10', value: 10, color: '#3498db', type: 'numeric' },
        { text: '50', value: 50, color: '#e67e22', type: 'numeric' },
        { text: '100', value: 100, color: '#2ecc71', type: 'numeric' },
        { text: 'Try Again', value: 0, color: '#95a5a6', type: 'neutral' }, // Neutral, not rerolled, not affected by most things
        { text: '25', value: 25, color: '#f1c40f', type: 'numeric' },
        { text: 'JACKPOT! 250', value: 250, color: '#e74c3c', size: 0.5, type: 'numeric' },
        { text: '-500 PTS', value: 'fixed_deduction', amount: -500, color: '#7f8c8d', type: 'special_deduction' },
        { text: '5', value: 5, color: '#1abc9c', type: 'numeric' },
        { text: '75', value: 75, color: '#9b59b6', type: 'numeric' },
        { text: 'BONUS 150', value: 150, color: '#d35400', type: 'numeric' },
    ];

    function getTotalSize() {
        return segments.reduce((sum, seg) => sum + (seg.size || 1), 0);
    }

    function drawWheel() {
        if (!ctx) return;
        const totalSize = getTotalSize();
        let currentDrawAngle = 0;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 8;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        segments.forEach(segment => {
            const angle = (segment.size || 1) / totalSize * 2 * Math.PI;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentDrawAngle, currentDrawAngle + angle);
            ctx.closePath();
            ctx.fillStyle = segment.color;
            ctx.fill();
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(currentDrawAngle + angle / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Arial'; // Adjusted font for potentially longer text after reroll
            ctx.fillText(segment.text, radius - 7, 4);
            ctx.restore();
            currentDrawAngle += angle;
        });
    }

    function updateDisplays() {
        pointsDisplay.textContent = points.toLocaleString();
        currentMultiplier = multiplierLevel;
        multiplierDisplay.textContent = `${currentMultiplier}x (Lv. ${multiplierLevel})`;
        spinSpeedDisplay.textContent = `Lv. ${spinSpeedLevel} (${(currentSpinDuration / 1000).toFixed(1)}s)`;
        flatBonusDisplay.textContent = `+${flatBonusPoints}`;
        goldenSpinStatusDisplay.textContent = isGoldenSpinActive ? "ACTIVE (100x Next!)" : "Inactive";
        goldenSpinStatusDisplay.style.color = isGoldenSpinActive ? "gold" : "#e0e0e0";
        negativeProtectionStatusDisplay.textContent = negativeProtectionUnlocked ? "ACTIVE" : "Inactive";
        negativeProtectionStatusDisplay.style.color = negativeProtectionUnlocked ? "lightgreen" : "#e0e0e0";


        const canAffordSpin = points >= baseSpinCost;
        spinButton.disabled = isSpinning || !canAffordSpin || isGoldenSpinActive; // Disable spin if golden is active (must spin to use it)
         if(isGoldenSpinActive) spinButton.title = "Spin to use your Golden Spin!"; else spinButton.title = "";
        autoSpinButton.disabled = isSpinning || !canAffordSpin || !autoSpinUnlocked || isGoldenSpinActive;


        // --- Update Shop Item Texts & Disabled States ---
        pickupTrashButton.classList.remove('disabled');

        const nextMultiplierCost = calculateRampingCost(multiplierConfig.baseCost, multiplierConfig.costMultiplier, multiplierLevel);
        upgradeMultiplierButton.innerHTML = `Upgrade Multiplier (Lv. ${multiplierLevel + 1}) <br> Cost: ${nextMultiplierCost.toLocaleString()} P`;
        upgradeMultiplierButton.classList.toggle('disabled', points < nextMultiplierCost || multiplierLevel >= multiplierConfig.maxLevel);
        if (multiplierLevel >= multiplierConfig.maxLevel) upgradeMultiplierButton.innerHTML = `Upgrade Multiplier (MAX Lv.) <br> -----`;

        const nextSpinSpeedCost = calculateRampingCost(spinSpeedConfig.baseCost, spinSpeedConfig.costMultiplier, spinSpeedLevel);
        upgradeSpinSpeedButton.innerHTML = `Upgrade Spin Speed (Lv. ${spinSpeedLevel + 1}) <br> Cost: ${nextSpinSpeedCost.toLocaleString()} P`;
        upgradeSpinSpeedButton.classList.toggle('disabled', points < nextSpinSpeedCost || spinSpeedLevel >= spinSpeedConfig.maxLevel || currentSpinDuration <= spinSpeedConfig.minDuration);
        if (spinSpeedLevel >= spinSpeedConfig.maxLevel || currentSpinDuration <= spinSpeedConfig.minDuration) upgradeSpinSpeedButton.innerHTML = `Upgrade Spin Speed (MAX Lv.) <br> -----`;

        const nextGoldenTicketCost = calculateRampingCost(goldenTicketConfig.baseCost, goldenTicketConfig.costMultiplier, goldenTicketPurchaseCount);
        activateGoldenSpinButton.innerHTML = isGoldenSpinActive ? `Golden Spin ACTIVE!` : `Activate Golden Spin (100x) <br> Cost: ${nextGoldenTicketCost.toLocaleString()} P`;
        activateGoldenSpinButton.classList.toggle('disabled', points < nextGoldenTicketCost && !isGoldenSpinActive);
        activateGoldenSpinButton.classList.toggle('active', isGoldenSpinActive);


        rerollWheelValuesButton.innerHTML = `Shift Wheel Values <br> Cost: ${rerollWheelCost.toLocaleString()} P`;
        rerollWheelValuesButton.classList.toggle('disabled', points < rerollWheelCost);

        unlockNegativeProtectionButton.innerHTML = negativeProtectionUnlocked ? `Neg. Protection Unlocked` : `Unlock Negative Protection <br> Cost: ${negativeProtectionCost.toLocaleString()} P`;
        unlockNegativeProtectionButton.classList.toggle('disabled', points < negativeProtectionCost && !negativeProtectionUnlocked);
        if(negativeProtectionUnlocked) unlockNegativeProtectionButton.classList.add('purchased');


        const nextFlatBonusCost = flatBonusConfig.baseCost + (flatBonusLevel * flatBonusConfig.costIncreasePerLevel); // Level 0 is base_cost, level 1 is base_cost + inc etc.
        upgradeFlatBonusButton.innerHTML = `Add Base Spin Point (+${flatBonusPoints + 1}) <br> Cost: ${nextFlatBonusCost.toLocaleString()} P`;
        upgradeFlatBonusButton.classList.toggle('disabled', points < nextFlatBonusCost || flatBonusLevel >= maxFlatBonusLevel );
        if (flatBonusLevel >= maxFlatBonusLevel) upgradeFlatBonusButton.innerHTML = `Add Base Spin Point (MAX Lv.) <br> -----`;


        if (autoSpinUnlocked) {
            unlockAutoSpinButton.innerHTML = `Auto-Spin Unlocked <br> -----`;
            unlockAutoSpinButton.classList.add('purchased');
            autoSpinButton.style.display = 'block';
        } else {
            unlockAutoSpinButton.innerHTML = `Unlock Auto-Spin <br> Cost: ${autoSpinUnlockCost.toLocaleString()} P`;
            unlockAutoSpinButton.classList.toggle('disabled', points < autoSpinUnlockCost);
            autoSpinButton.style.display = 'none';
        }
    }

    function calculateRampingCost(base, multiplier, level) { // For costs that multiply each level
        return Math.floor(base * Math.pow(multiplier, level)); // level 0 = base, level 1 = base*multi, etc.
    }

    function showMessage(text, duration = 3000, isError = false) {
        messageDisplay.textContent = text;
        messageDisplay.style.color = isError ? '#e74c3c' : '#f1c40f';
        if (duration > 0) {
            setTimeout(() => messageDisplay.textContent = '', duration);
        }
    }

    function spinWheelLogic(isAutoSpin = false) {
        if (isSpinning) return;
        if (points < baseSpinCost) {
            showMessage("Not enough points to spin!", 3000, true);
            if (isAutoSpin) autoSpinButton.disabled = true; // Stop auto if cannot afford
            return;
        }

        points -= baseSpinCost;
        isSpinning = true;
        updateDisplays();
        showMessage("Spinning...");

        const totalSize = getTotalSize();
        const randomStopPoint = Math.random();
        let accumulatedSize = 0;
        let winningSegmentIndex = 0;

        for (let i = 0; i < segments.length; i++) {
            accumulatedSize += (segments[i].size || 1) / totalSize;
            if (randomStopPoint <= accumulatedSize) {
                winningSegmentIndex = i;
                break;
            }
        }

        const segmentAngle = 2 * Math.PI / totalSize;
        let targetSegmentMidAngle = 0;
        for(let i=0; i < winningSegmentIndex; i++){
            targetSegmentMidAngle += (segments[i].size || 1) * segmentAngle;
        }
        targetSegmentMidAngle += ((segments[winningSegmentIndex].size || 1) * segmentAngle / 2);

        const pointerOffset = -Math.PI / 2;
        const fullRotations = 5 + spinSpeedLevel;
        const finalTargetAngle = (fullRotations * 2 * Math.PI) - targetSegmentMidAngle + pointerOffset;

        let startTime = null;
        const startRotationAngle = currentAngle;

        function animateSpin(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const easedProgress = easeOutCubic(Math.min(progress / currentSpinDuration, 1));
            const visualAngle = startRotationAngle + easedProgress * (finalTargetAngle - startRotationAngle);
            canvas.style.transform = `rotate(${visualAngle}rad)`;

            if (progress < currentSpinDuration) {
                requestAnimationFrame(animateSpin);
            } else {
                canvas.style.transform = `rotate(${finalTargetAngle}rad)`;
                currentAngle = finalTargetAngle % (2 * Math.PI);
                isSpinning = false;
                handleSpinResult(segments[winningSegmentIndex]); // This will also update displays and save
                if (isAutoSpin && autoSpinUnlocked && points >= baseSpinCost && !isGoldenSpinActive) { // Don't auto-spin if golden is now active waiting for manual spin
                    setTimeout(() => spinWheelLogic(true), 1200); // Slightly longer pause for readability
                } else {
                    updateDisplays(); // Ensure buttons are correctly enabled/disabled
                }
            }
        }
        requestAnimationFrame(animateSpin);
    }

    function easeOutCubic(t) { return (--t) * t * t + 1; }

    function handleSpinResult(segment) {
        let actualGainedPoints = 0;
        let message = "";

        if (segment.type === 'special_deduction') {
            actualGainedPoints = segment.amount; // e.g., -500
            message = `Landed on ${segment.text}. You lose ${Math.abs(actualGainedPoints)} points.`;
        } else if (segment.type === 'neutral') { // e.g., Try Again (value 0)
            actualGainedPoints = 0;
            message = `Landed on ${segment.text}. No change in points.`;
        } else if (segment.type === 'numeric') {
            let baseValue = segment.value;
            let spinValueWithBonus = baseValue + flatBonusPoints;

            if (spinValueWithBonus < 0 && negativeProtectionUnlocked) {
                actualGainedPoints = 25; // Negative protection outcome
                message = `Landed on ${baseValue}. Negative Protection changed it to +25 points!`;
            } else {
                actualGainedPoints = spinValueWithBonus * currentMultiplier;

                if (isGoldenSpinActive && spinValueWithBonus > 0) { // Golden spin only applies if base value + flat bonus was positive
                    actualGainedPoints *= goldenTicketConfig.activationMultiplier;
                    message = `GOLDEN SPIN! Landed on ${baseValue}. With bonuses & x${currentMultiplier} & GOLDEN x${goldenTicketConfig.activationMultiplier}, you get ${actualGainedPoints.toLocaleString()} points!`;
                    isGoldenSpinActive = false; // Consume golden ticket
                } else if (isGoldenSpinActive && spinValueWithBonus <= 0) {
                     message = `Landed on ${baseValue}. Golden spin not applied to non-positive outcome. Points: ${actualGainedPoints.toLocaleString()}`;
                     isGoldenSpinActive = false; // Still consume it as an attempt was made
                }
                else {
                    message = `Landed on ${baseValue}. With +${flatBonusPoints} bonus & x${currentMultiplier} multiplier, you get ${actualGainedPoints.toLocaleString()} points.`;
                }
            }
        } else {
            message = `Landed on ${segment.text}. (Unknown segment type)`;
        }

        points += actualGainedPoints;
        if (points < 0) points = 0; // Prevent negative total points

        showMessage(message, 5000);
        updateDisplays();
        saveGame();
    }

    // --- Shop Logic ---
    pickupTrashButton.addEventListener('click', () => {
        points += 1;
        showMessage("+1 Point!", 2000);
        updateDisplays(); saveGame();
    });

    upgradeMultiplierButton.addEventListener('click', () => {
        if (multiplierLevel >= multiplierConfig.maxLevel) return;
        const cost = calculateRampingCost(multiplierConfig.baseCost, multiplierConfig.costMultiplier, multiplierLevel);
        if (points >= cost) {
            points -= cost; multiplierLevel++;
            showMessage(`Multiplier upgraded to Lv ${multiplierLevel} (${multiplierLevel}x)!`, 3000);
            updateDisplays(); saveGame();
        } else { showMessage("Not enough points!", 2000, true); }
    });

    upgradeSpinSpeedButton.addEventListener('click', () => {
        if (spinSpeedLevel >= spinSpeedConfig.maxLevel || currentSpinDuration <= spinSpeedConfig.minDuration) return;
        const cost = calculateRampingCost(spinSpeedConfig.baseCost, spinSpeedConfig.costMultiplier, spinSpeedLevel);
        if (points >= cost) {
            points -= cost; spinSpeedLevel++;
            currentSpinDuration = Math.max(spinSpeedConfig.minDuration, baseSpinDuration - (spinSpeedLevel - 1) * spinSpeedConfig.durationReductionPerLevel);
            showMessage(`Spin speed upgraded to Lv ${spinSpeedLevel}!`, 3000);
            updateDisplays(); saveGame();
        } else { showMessage("Not enough points!", 2000, true); }
    });

    activateGoldenSpinButton.addEventListener('click', () => {
        if (isGoldenSpinActive) return;
        const cost = calculateRampingCost(goldenTicketConfig.baseCost, goldenTicketConfig.costMultiplier, goldenTicketPurchaseCount);
        if (points >= cost) {
            points -= cost;
            isGoldenSpinActive = true;
            goldenTicketPurchaseCount++;
            showMessage(`Golden Spin (100x) ACTIVATED for next spin!`, 3000);
            updateDisplays(); saveGame();
        } else { showMessage("Not enough points for Golden Spin!", 2000, true); }
    });

    rerollWheelValuesButton.addEventListener('click', () => {
        if (points >= rerollWheelCost) {
            points -= rerollWheelCost;
            segments.forEach(seg => {
                if (seg.type === 'numeric') {
                    seg.value = Math.floor(Math.random() * 3501) - 500; // -500 to 3000
                    seg.text = seg.value.toString(); // Basic text update
                    if (seg.value > 1000) seg.text = (seg.value / 1000).toFixed(1) + "k";
                    else if (seg.value < -99) seg.text = seg.value.toString();
                }
            });
            drawWheel();
            showMessage("Wheel values have been shifted!", 3000);
            updateDisplays(); saveGame();
        } else { showMessage("Not enough points to shift wheel values!", 2000, true); }
    });

    unlockNegativeProtectionButton.addEventListener('click', () => {
        if (negativeProtectionUnlocked) return;
        if (points >= negativeProtectionCost) {
            points -= negativeProtectionCost;
            negativeProtectionUnlocked = true;
            showMessage("Negative Point Protection Unlocked!", 3000);
            updateDisplays(); saveGame();
        } else { showMessage("Not enough points for Negative Protection!", 2000, true); }
    });

    upgradeFlatBonusButton.addEventListener('click', () => {
        if (flatBonusLevel >= maxFlatBonusLevel) return;
        const cost = flatBonusConfig.baseCost + (flatBonusLevel * flatBonusConfig.costIncreasePerLevel);
        if (points >= cost) {
            points -= cost;
            flatBonusLevel++;
            flatBonusPoints++; // Each level adds 1 point to the bonus
            showMessage(`Base Spin Bonus upgraded to +${flatBonusPoints}!`, 3000);
            updateDisplays(); saveGame();
        } else { showMessage("Not enough points to upgrade Base Spin Bonus!", 2000, true); }
    });

    unlockAutoSpinButton.addEventListener('click', () => {
        if (autoSpinUnlocked) return;
        if (points >= autoSpinUnlockCost) {
            points -= autoSpinUnlockCost; autoSpinUnlocked = true;
            showMessage("Auto-Spin Unlocked!", 4000);
            updateDisplays(); saveGame();
        } else { showMessage("Not enough points for Auto-Spin!", 2000, true); }
    });

    spinButton.addEventListener('click', () => spinWheelLogic(false));
    autoSpinButton.addEventListener('click', () => {
        if(autoSpinUnlocked && !isSpinning && points >= baseSpinCost && !isGoldenSpinActive) {
            spinWheelLogic(true);
        } else if (isGoldenSpinActive) {
            showMessage("Spin manually to use your Golden Spin!", 2000, true);
        } else if (!autoSpinUnlocked) {
            showMessage("Unlock Auto-Spin first!", 2000, true);
        } else {
            showMessage("Cannot Auto-Spin now (not enough points or already spinning).", 2000, true);
        }
    });

    function saveGame() {
        const gameState = {
            points, multiplierLevel, spinSpeedLevel, currentSpinDuration,
            isGoldenSpinActive, goldenTicketPurchaseCount,
            negativeProtectionUnlocked,
            flatBonusPoints, flatBonusLevel,
            autoSpinUnlocked, currentAngle, segments // Save segments if they are rerolled
        };
        localStorage.setItem('wheelOfFortuneDeluxeII', JSON.stringify(gameState));
    }

    function loadGame() {
        const savedGame = localStorage.getItem('wheelOfFortuneDeluxeII');
        if (savedGame) {
            const gs = JSON.parse(savedGame);
            points = gs.points || basePointsToStart;
            multiplierLevel = gs.multiplierLevel || 1;
            spinSpeedLevel = gs.spinSpeedLevel || 1;
            currentSpinDuration = gs.currentSpinDuration || baseSpinDuration;
            isGoldenSpinActive = gs.isGoldenSpinActive || false;
            goldenTicketPurchaseCount = gs.goldenTicketPurchaseCount || 0;
            negativeProtectionUnlocked = gs.negativeProtectionUnlocked || false;
            flatBonusPoints = gs.flatBonusPoints || 0;
            flatBonusLevel = gs.flatBonusLevel || 0;
            autoSpinUnlocked = gs.autoSpinUnlocked || false;
            currentAngle = gs.currentAngle || 0;
            if (gs.segments) segments = gs.segments; // Load saved wheel segments

            canvas.style.transform = `rotate(${currentAngle}rad)`;
        } else {
            // Initialize new game defaults
            points = basePointsToStart; multiplierLevel = 1; spinSpeedLevel = 1; currentSpinDuration = baseSpinDuration;
            isGoldenSpinActive = false; goldenTicketPurchaseCount = 0; negativeProtectionUnlocked = false;
            flatBonusPoints = 0; flatBonusLevel = 0; autoSpinUnlocked = false; currentAngle = 0;
        }
    }

    function resetGameData() {
        if (confirm("Are you sure you want to reset ALL game data?")) {
            localStorage.removeItem('wheelOfFortuneDeluxeII');
            // Re-initialize default segments in case they were modified
            segments = [
                { text: '10', value: 10, color: '#3498db', type: 'numeric' },
                { text: '50', value: 50, color: '#e67e22', type: 'numeric' },
                { text: '100', value: 100, color: '#2ecc71', type: 'numeric' },
                { text: 'Try Again', value: 0, color: '#95a5a6', type: 'neutral' },
                { text: '25', value: 25, color: '#f1c40f', type: 'numeric' },
                { text: 'JACKPOT! 250', value: 250, color: '#e74c3c', size: 0.5, type: 'numeric' },
                { text: '-500 PTS', value: 'fixed_deduction', amount: -500, color: '#7f8c8d', type: 'special_deduction' },
                { text: '5', value: 5, color: '#1abc9c', type: 'numeric' },
                { text: '75', value: 75, color: '#9b59b6', type: 'numeric' },
                { text: 'BONUS 150', value: 150, color: '#d35400', type: 'numeric' },
            ];
            loadGame(); // This will set fresh defaults
            showMessage("Game Reset!", 3000);
            drawWheel();
            updateDisplays();
        }
    }
    resetButton.addEventListener('click', resetGameData);

    // Initial Setup
    loadGame();
    drawWheel();
    updateDisplays();
});
