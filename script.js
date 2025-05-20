document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const spinButton = document.getElementById('spin-button');
    const autoSpinButton = document.getElementById('auto-spin-button');
    const pointsDisplay = document.getElementById('points-display');
    const multiplierDisplay = document.getElementById('multiplier-display');
    const spinSpeedDisplay = document.getElementById('spin-speed-display');
    const goldenTicketsDisplay = document.getElementById('golden-tickets-display');
    const messageDisplay = document.getElementById('message-display');
    const resetButton = document.getElementById('reset-button');
    const activeGoldenSpinIndicator = document.getElementById('active-golden-spin-indicator');

    // Shop Item Elements
    const pickupTrashButton = document.getElementById('pickup-trash');
    const upgradeMultiplierButton = document.getElementById('upgrade-multiplier');
    const upgradeSpinSpeedButton = document.getElementById('upgrade-spin-speed');
    const buyGoldenTicketButton = document.getElementById('buy-golden-ticket');
    const unlockAutoSpinButton = document.getElementById('unlock-auto-spin');


    const baseSpinCost = 25;
    const basePointsToStart = 50;

    let points = 0;
    let currentAngle = 0;
    let isSpinning = false;

    // --- Game State Variables ---
    let multiplierLevel = 1; // For 1x, 2x, etc.
    let currentMultiplier = 1;

    let spinSpeedLevel = 1;
    let baseSpinDuration = 4000; // ms
    let currentSpinDuration = baseSpinDuration;

    let goldenSpinTickets = 0;
    let activateNextSpinAsGolden = false;

    let autoSpinUnlocked = false;

    // --- Shop Item Configs ---
    const multiplierConfig = {
        baseCost: 100,
        costMultiplier: 1.8, // Price increases by 80% each time
        maxLevel: 10, // Example max
    };
    const spinSpeedConfig = {
        baseCost: 150,
        costMultiplier: 1.7,
        durationReductionPerLevel: 300, // ms
        minDuration: 500, // Minimum spin duration
        maxLevel: 10,
    };
    const goldenTicketConfig = {
        baseCost: 5000,
        costMultiplier: 2.5, // Golden tickets get expensive fast
        pointsMultiplier: 100, // The 1000x from prompt, let's use 100x as 1000x is huge
    };
    const autoSpinUnlockCost = 100000000;


    const segments = [
        { text: '10', value: 10, color: '#3498db' },
        { text: '50', value: 50, color: '#e67e22' },
        { text: '100', value: 100, color: '#2ecc71' },
        { text: 'Try Again', value: 0, color: '#95a5a6' },
        { text: '25', value: 25, color: '#f1c40f' },
        { text: 'JACKPOT! 250', value: 250, color: '#e74c3c', size: 0.5 },
        { text: 'Bankrupt', value: 'bankrupt', color: '#34495e' },
        { text: '5', value: 5, color: '#1abc9c' },
        { text: '75', value: 75, color: '#9b59b6' },
        { text: 'BONUS 150', value: 150, color: '#d35400' },
    ];

    function getTotalSize() {
        return segments.reduce((sum, seg) => sum + (seg.size || 1), 0);
    }

    function drawWheel() {
        if (!ctx) return; // Ensure context exists
        const totalSize = getTotalSize();
        let currentDrawAngle = 0;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 8; // Add a bit more padding

        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas before redraw

        segments.forEach(segment => {
            const angle = (segment.size || 1) / totalSize * 2 * Math.PI;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentDrawAngle, currentDrawAngle + angle);
            ctx.closePath();
            ctx.fillStyle = segment.color;
            ctx.fill();
            ctx.strokeStyle = '#444'; // Darker border for segments
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(currentDrawAngle + angle / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 13px Arial'; // Slightly smaller text for crowded wheels
            // Adjust text position for better visibility
            if (segment.text.length > 8) { // If text is long
                 ctx.fillText(segment.text, radius - 5, 5);
            } else {
                 ctx.fillText(segment.text, radius - 10, 5); // y changed to 5 for vertical centering
            }
            ctx.restore();
            currentDrawAngle += angle;
        });
         // console.log("Wheel Drawn");
    }

    function updateDisplays() {
        pointsDisplay.textContent = points.toLocaleString(); // Format points
        currentMultiplier = multiplierLevel; // Direct mapping for now
        multiplierDisplay.textContent = `${currentMultiplier}x (Lv. ${multiplierLevel})`;
        spinSpeedDisplay.textContent = `Lv. ${spinSpeedLevel} (${(currentSpinDuration / 1000).toFixed(1)}s)`;
        goldenTicketsDisplay.textContent = goldenSpinTickets;

        const canAffordSpin = points >= baseSpinCost;
        spinButton.disabled = isSpinning || !canAffordSpin;
        autoSpinButton.disabled = isSpinning || !canAffordSpin || !autoSpinUnlocked;

        // Update Shop Item Texts & Disabled States
        // Pickup Trash
        pickupTrashButton.classList.remove('disabled'); // Always enabled

        // Multiplier
        const nextMultiplierCost = calculateCost(multiplierConfig.baseCost, multiplierConfig.costMultiplier, multiplierLevel);
        upgradeMultiplierButton.innerHTML = `Upgrade Multiplier (Lv. ${multiplierLevel + 1}) <br> Cost: ${nextMultiplierCost.toLocaleString()} P`;
        if (multiplierLevel >= multiplierConfig.maxLevel) {
            upgradeMultiplierButton.innerHTML = `Upgrade Multiplier (MAX Lv.) <br> -----`;
            upgradeMultiplierButton.classList.add('disabled');
        } else {
            upgradeMultiplierButton.classList.toggle('disabled', points < nextMultiplierCost);
        }

        // Spin Speed
        const nextSpinSpeedCost = calculateCost(spinSpeedConfig.baseCost, spinSpeedConfig.costMultiplier, spinSpeedLevel);
        upgradeSpinSpeedButton.innerHTML = `Upgrade Spin Speed (Lv. ${spinSpeedLevel + 1}) <br> Cost: ${nextSpinSpeedCost.toLocaleString()} P`;
        if (spinSpeedLevel >= spinSpeedConfig.maxLevel || currentSpinDuration <= spinSpeedConfig.minDuration) {
            upgradeSpinSpeedButton.innerHTML = `Upgrade Spin Speed (MAX Lv.) <br> -----`;
            upgradeSpinSpeedButton.classList.add('disabled');
        } else {
            upgradeSpinSpeedButton.classList.toggle('disabled', points < nextSpinSpeedCost);
        }

        // Golden Ticket
        const nextGoldenTicketCost = calculateCost(goldenTicketConfig.baseCost, goldenTicketConfig.costMultiplier, goldenSpinTickets);
        buyGoldenTicketButton.innerHTML = `Buy Golden Ticket (x${goldenSpinTickets}) <br> Cost: ${nextGoldenTicketCost.toLocaleString()} P`;
        buyGoldenTicketButton.classList.toggle('disabled', points < nextGoldenTicketCost);

        // Auto Spin Unlock
        if (autoSpinUnlocked) {
            unlockAutoSpinButton.innerHTML = `Auto-Spin Unlocked <br> -----`;
            unlockAutoSpinButton.classList.add('disabled'); // Show as purchased
            autoSpinButton.style.display = 'block';
        } else {
            unlockAutoSpinButton.innerHTML = `Unlock Auto-Spin <br> Cost: ${autoSpinUnlockCost.toLocaleString()} P`;
            unlockAutoSpinButton.classList.toggle('disabled', points < autoSpinUnlockCost);
            autoSpinButton.style.display = 'none';
        }
         activeGoldenSpinIndicator.style.display = activateNextSpinAsGolden ? 'block' : 'none';
    }

    function calculateCost(base, multiplier, level) {
        return Math.floor(base * Math.pow(multiplier, level -1)); // For level 1, it's base cost
    }
    function calculateNextPurchaseCost(base, multiplier, count) { // For items like tickets where count increases
        return Math.floor(base * Math.pow(multiplier, count));
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
            return;
        }

        if (goldenSpinTickets > 0 && !activateNextSpinAsGolden) {
             if (confirm("You have Golden Tickets! Use one for this spin for a 100x point bonus? (Cancelling will save the ticket)")) {
                activateNextSpinAsGolden = true;
             }
        }
        activeGoldenSpinIndicator.style.display = activateNextSpinAsGolden ? 'block' : 'none';


        points -= baseSpinCost;
        isSpinning = true;
        updateDisplays(); // Update points and disable buttons
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

        const pointerOffset = -Math.PI / 2; // Pointer is at the top
        const fullRotations = 5 + spinSpeedLevel; // More speed = more visual rotations
        const finalTargetAngle = (fullRotations * 2 * Math.PI) - targetSegmentMidAngle + pointerOffset;

        let startTime = null;
        const startRotationAngle = currentAngle; // Keep track of current visual rotation

        function animateSpin(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const easedProgress = easeOutCubic(Math.min(progress / currentSpinDuration, 1));

            // Rotate the canvas element for visual spin
            const visualAngle = startRotationAngle + easedProgress * (finalTargetAngle - startRotationAngle);
            canvas.style.transform = `rotate(${visualAngle}rad)`;

            if (progress < currentSpinDuration) {
                requestAnimationFrame(animateSpin);
            } else {
                canvas.style.transform = `rotate(${finalTargetAngle}rad)`; // Ensure final position
                currentAngle = finalTargetAngle % (2 * Math.PI); // Store the actual end angle for next spin start
                isSpinning = false;
                handleSpinResult(segments[winningSegmentIndex]);
                if (isAutoSpin && autoSpinUnlocked && points >= baseSpinCost) {
                    setTimeout(() => spinWheelLogic(true), 1000); // Brief pause before auto-spinning again
                } else {
                    updateDisplays(); // Re-enable buttons if not auto-spinning or can't afford
                }
            }
        }
        requestAnimationFrame(animateSpin);
    }

    function easeOutCubic(t) { return (--t) * t * t + 1; }

    function handleSpinResult(segment) {
        let gainedPoints = 0;
        let message = "";

        if (segment.value === 'bankrupt') {
            message = `Oh no! Bankrupt! You lost all your points.`;
            points = 0;
        } else if (typeof segment.value === 'number' && segment.value > 0) {
            gainedPoints = segment.value * currentMultiplier;
            let goldenBonus = 0;

            if (activateNextSpinAsGolden) {
                goldenBonus = gainedPoints * (goldenTicketConfig.pointsMultiplier -1); // -1 because base gain is already counted
                gainedPoints += goldenBonus;
                goldenSpinTickets--;
                activateNextSpinAsGolden = false; // Consume ticket
                message = `GOLDEN SPIN! You won ${gainedPoints.toLocaleString()} points! (${segment.value} x ${currentMultiplier} + Golden x${goldenTicketConfig.pointsMultiplier}!)`;
            } else {
                 message = `You won ${gainedPoints.toLocaleString()} points! (${segment.value} x ${currentMultiplier})`;
            }
            points += gainedPoints;
        } else { // Try Again or 0 points
            message = `Landed on: ${segment.text}. No points this time.`;
        }
        showMessage(message, 4000);
        updateDisplays();
        saveGame();
    }

    // --- Shop Logic ---
    pickupTrashButton.addEventListener('click', () => {
        points += 1;
        showMessage("+1 Point from picking up trash!", 2000);
        updateDisplays();
        saveGame();
    });

    upgradeMultiplierButton.addEventListener('click', () => {
        if (multiplierLevel >= multiplierConfig.maxLevel) {
            showMessage("Multiplier is already at max level!", 2000, true);
            return;
        }
        const cost = calculateCost(multiplierConfig.baseCost, multiplierConfig.costMultiplier, multiplierLevel);
        if (points >= cost) {
            points -= cost;
            multiplierLevel++;
            currentMultiplier = multiplierLevel; // Update immediately
            showMessage(`Multiplier upgraded to Level ${multiplierLevel} (${currentMultiplier}x)!`, 3000);
            updateDisplays();
            saveGame();
        } else {
            showMessage("Not enough points to upgrade multiplier!", 2000, true);
        }
    });

    upgradeSpinSpeedButton.addEventListener('click', () => {
        if (spinSpeedLevel >= spinSpeedConfig.maxLevel || currentSpinDuration <= spinSpeedConfig.minDuration) {
            showMessage("Spin speed is already at max level or fastest!", 2000, true);
            return;
        }
        const cost = calculateCost(spinSpeedConfig.baseCost, spinSpeedConfig.costMultiplier, spinSpeedLevel);
        if (points >= cost) {
            points -= cost;
            spinSpeedLevel++;
            currentSpinDuration = Math.max(spinSpeedConfig.minDuration, baseSpinDuration - (spinSpeedLevel-1) * spinSpeedConfig.durationReductionPerLevel);
            showMessage(`Spin speed upgraded to Level ${spinSpeedLevel}! Duration: ${(currentSpinDuration/1000).toFixed(1)}s`, 3000);
            updateDisplays();
            saveGame();
        } else {
            showMessage("Not enough points to upgrade spin speed!", 2000, true);
        }
    });

    buyGoldenTicketButton.addEventListener('click', () => {
        const cost = calculateNextPurchaseCost(goldenTicketConfig.baseCost, goldenTicketConfig.costMultiplier, goldenSpinTickets);
        if (points >= cost) {
            points -= cost;
            goldenSpinTickets++;
            showMessage(`Golden Spin Ticket purchased! You have ${goldenSpinTickets}.`, 3000);
            updateDisplays();
            saveGame();
        } else {
            showMessage("Not enough points to buy a Golden Ticket!", 2000, true);
        }
    });

    unlockAutoSpinButton.addEventListener('click', () => {
        if (autoSpinUnlocked) {
            showMessage("Auto-Spin is already unlocked!", 2000, true);
            return;
        }
        if (points >= autoSpinUnlockCost) {
            points -= autoSpinUnlockCost;
            autoSpinUnlocked = true;
            showMessage("Auto-Spin Unlocked! The Auto-Spin button is now available.", 4000);
            updateDisplays();
            saveGame();
        } else {
            showMessage("Not enough points to unlock Auto-Spin!", 2000, true);
        }
    });


    // --- Core Game Actions ---
    spinButton.addEventListener('click', () => spinWheelLogic(false));
    autoSpinButton.addEventListener('click', () => {
        if(autoSpinUnlocked && !isSpinning && points >= baseSpinCost) {
            spinWheelLogic(true); // Start auto-spinning sequence
        } else if (!autoSpinUnlocked) {
            showMessage("Unlock Auto-Spin first!", 2000, true);
        } else if (isSpinning) {
            // Optionally, could make this button stop auto-spinning if implemented that way
        } else {
            showMessage("Not enough points for Auto-Spin!", 2000, true);
        }
    });


    // --- Saving and Loading ---
    function saveGame() {
        const gameState = {
            points,
            multiplierLevel,
            currentMultiplier, // Though derived, saving it is fine
            spinSpeedLevel,
            currentSpinDuration,
            goldenSpinTickets,
            autoSpinUnlocked,
            currentAngle // Save visual angle of the wheel
        };
        localStorage.setItem('wheelOfFortuneDeluxeGame', JSON.stringify(gameState));
        // console.log("Game Saved:", gameState);
    }

    function loadGame() {
        const savedGame = localStorage.getItem('wheelOfFortuneDeluxeGame');
        if (savedGame) {
            const gameState = JSON.parse(savedGame);
            points = gameState.points || basePointsToStart;
            multiplierLevel = gameState.multiplierLevel || 1;
            currentMultiplier = gameState.currentMultiplier || 1;
            spinSpeedLevel = gameState.spinSpeedLevel || 1;
            currentSpinDuration = gameState.currentSpinDuration || baseSpinDuration;
            goldenSpinTickets = gameState.goldenSpinTickets || 0;
            autoSpinUnlocked = gameState.autoSpinUnlocked || false;
            currentAngle = gameState.currentAngle || 0;
            canvas.style.transform = `rotate(${currentAngle}rad)`; // Restore visual wheel position
            // console.log("Game Loaded:", gameState);
        } else {
            points = basePointsToStart;
            // Initialize others to default if no save
            multiplierLevel = 1; currentMultiplier = 1;
            spinSpeedLevel = 1; currentSpinDuration = baseSpinDuration;
            goldenSpinTickets = 0; autoSpinUnlocked = false;
            currentAngle = 0;
            // console.log("New Game Started");
        }
    }

    function resetGameData() {
        if (confirm("Are you sure you want to reset all game data? This cannot be undone.")) {
            localStorage.removeItem('wheelOfFortuneDeluxeGame');
            // Reset all variables to initial states
            points = basePointsToStart;
            multiplierLevel = 1; currentMultiplier = 1;
            spinSpeedLevel = 1; currentSpinDuration = baseSpinDuration;
            goldenSpinTickets = 0; activateNextSpinAsGolden = false;
            autoSpinUnlocked = false;
            currentAngle = 0;
            canvas.style.transform = `rotate(0rad)`;

            showMessage("Game Reset!", 3000);
            updateDisplays();
            drawWheel(); // Redraw initial static state of wheel
        }
    }
    resetButton.addEventListener('click', resetGameData);

    // Initial Setup
    loadGame();
    drawWheel(); // Draw the static segments of the wheel
    updateDisplays(); // Update all UI elements based on loaded/default state
});
