document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const spinButton = document.getElementById('spin-button');
    const pointsDisplay = document.getElementById('points-display');
    const multiplierDisplay = document.getElementById('multiplier-display');
    const messageDisplay = document.getElementById('message-display');
    const shopItems = document.querySelectorAll('.shop-item');
    const resetButton = document.getElementById('reset-button');

    const spinCost = 25;
    const basePointsToStart = 50; // Start with enough points for a couple of spins

    let points = 0;
    let currentMultiplier = 1;
    let purchasedMultipliers = []; // To track which ones are bought

    // Define wheel segments: { text, value (points or special string), color, size (optional, defaults to 1) }
    // Size can be used to make some segments larger than others. Sum of sizes will be total parts.
    const segments = [
        { text: '10', value: 10, color: '#3498db' },
        { text: '50', value: 50, color: '#e67e22' },
        { text: '100', value: 100, color: '#2ecc71' },
        { text: 'Try Again', value: 0, color: '#95a5a6' },
        { text: '25', value: 25, color: '#f1c40f' },
        { text: 'JACKPOT! 250', value: 250, color: '#e74c3c', size: 0.5 }, // Smaller segment
        { text: 'Bankrupt', value: 'bankrupt', color: '#34495e' },
        { text: '5', value: 5, color: '#1abc9c' },
        { text: '75', value: 75, color: '#9b59b6' },
        { text: 'BONUS 150', value: 150, color: '#d35400' },
    ];

    let currentAngle = 0;
    let isSpinning = false;
    const spinDuration = 4000; // ms
    const spinRotations = 5; // How many full rotations before stopping

    function getTotalSize() {
        return segments.reduce((sum, seg) => sum + (seg.size || 1), 0);
    }

    function drawWheel() {
        const totalSize = getTotalSize();
        let startAngle = 0;
        constcenterX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 5; // Leave a small padding

        segments.forEach(segment => {
            const angle = (segment.size || 1) / totalSize * 2 * Math.PI;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
            ctx.closePath();
            ctx.fillStyle = segment.color;
            ctx.fill();
            ctx.stroke(); // Add a border to segments

            // Draw text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + angle / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff'; // Text color
            ctx.font = 'bold 14px Arial';
            ctx.fillText(segment.text, radius - 10, 0);
            ctx.restore();

            startAngle += angle;
        });
    }

    function updatePointsDisplay() {
        pointsDisplay.textContent = points;
        spinButton.disabled = points < spinCost || isSpinning;
        // Update shop item disabled state based on points
        shopItems.forEach(item => {
            const cost = parseInt(item.dataset.cost);
            const type = item.dataset.type;
            const value = parseInt(item.dataset.value);
            if (type === "multiplier") {
                if (purchasedMultipliers.includes(value) || currentMultiplier === value) {
                    item.classList.add('purchased');
                    item.classList.remove('disabled');
                } else if (points < cost) {
                    item.classList.add('disabled');
                    item.classList.remove('purchased');
                } else {
                    item.classList.remove('disabled');
                    item.classList.remove('purchased');
                }
            } else if (type === "points"){ // For "Pick Up Trash"
                 item.classList.remove('disabled'); // Always enabled
            }
        });
    }

    function updateMultiplierDisplay() {
        multiplierDisplay.textContent = `${currentMultiplier}x`;
    }

    function showMessage(text, duration = 3000) {
        messageDisplay.textContent = text;
        if (duration > 0) {
            setTimeout(() => messageDisplay.textContent = '', duration);
        }
    }

    function spinWheel() {
        if (isSpinning) return;
        if (points < spinCost) {
            showMessage("Not enough points to spin!");
            return;
        }

        points -= spinCost;
        isSpinning = true;
        spinButton.disabled = true;
        updatePointsDisplay();
        showMessage("Spinning...");

        const totalSize = getTotalSize();
        const randomStopPoint = Math.random(); // A value between 0 and 1
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
        let targetAngle = 0;
        // Calculate midpoint of the winning segment
        let tempAngle = 0;
        for(let i=0; i < winningSegmentIndex; i++){
            tempAngle += (segments[i].size || 1) * segmentAngle;
        }
        targetAngle = tempAngle + ((segments[winningSegmentIndex].size || 1) * segmentAngle / 2);

        // Ensure it spins in the correct direction (counter-clockwise for canvas arc)
        // The pointer is at the top, so 0 radians is to the right. We want top, so -PI/2.
        const pointerOffset = -Math.PI / 2;
        const finalAngle = (spinRotations * 2 * Math.PI) - targetAngle + pointerOffset;


        let startTime = null;
        const startRotationAngle = currentAngle;

        function animateSpin(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const easedProgress = easeOutCubic(Math.min(progress / spinDuration, 1));

            currentAngle = startRotationAngle + easedProgress * (finalAngle - startRotationAngle);
            canvas.style.transform = `rotate(${currentAngle}rad)`;

            if (progress < spinDuration) {
                requestAnimationFrame(animateSpin);
            } else {
                canvas.style.transform = `rotate(${finalAngle}rad)`; // Ensure final position
                currentAngle = finalAngle % (2 * Math.PI) ; // Normalize angle
                isSpinning = false;
                spinButton.disabled = points < spinCost;
                handleSpinResult(segments[winningSegmentIndex]);
            }
        }

        requestAnimationFrame(animateSpin);
    }

    function easeOutCubic(t) {
        return (--t) * t * t + 1;
    }

    function handleSpinResult(segment) {
        let gainedPoints = 0;
        if (segment.value === 'bankrupt') {
            showMessage(`Oh no! Bankrupt! You lost all your points.`, 4000);
            points = 0; // Lose all points
        } else if (typeof segment.value === 'number') {
            gainedPoints = segment.value * currentMultiplier;
            points += gainedPoints;
            showMessage(`You won ${gainedPoints} points! (${segment.value} x ${currentMultiplier} multiplier)`, 4000);
        } else {
            showMessage(`Landed on: ${segment.text}`, 4000); // For "Try Again" or other text outcomes
        }
        updatePointsDisplay();
        saveGame();
    }

    function buyShopItem(itemElement) {
        const cost = parseInt(itemElement.dataset.cost);
        const value = parseInt(itemElement.dataset.value);
        const type = itemElement.dataset.type;

        if (type === "points") { // "Pick Up Trash"
            points += value;
            showMessage(`Picked up trash! +${value} point.`, 2000);
        } else if (type === "multiplier") {
            if (purchasedMultipliers.includes(value) || currentMultiplier === value) {
                showMessage("Multiplier already active or purchased.", 2000);
                return;
            }
            if (points >= cost) {
                points -= cost;
                currentMultiplier = value; // Set as current
                purchasedMultipliers.push(value); // Mark as purchased
                showMessage(`${value}x Multiplier Purchased!`, 3000);
                updateMultiplierDisplay();
            } else {
                showMessage("Not enough points!", 2000);
                return; // Important to stop here
            }
        }
        updatePointsDisplay();
        saveGame();
    }

    // --- Saving and Loading ---
    function saveGame() {
        const gameState = {
            points: points,
            currentMultiplier: currentMultiplier,
            purchasedMultipliers: purchasedMultipliers
        };
        localStorage.setItem('wheelOfFortuneGame', JSON.stringify(gameState));
        console.log("Game Saved");
    }

    function loadGame() {
        const savedGame = localStorage.getItem('wheelOfFortuneGame');
        if (savedGame) {
            const gameState = JSON.parse(savedGame);
            points = gameState.points || basePointsToStart;
            currentMultiplier = gameState.currentMultiplier || 1;
            purchasedMultipliers = gameState.purchasedMultipliers || [];
            console.log("Game Loaded");
        } else {
            points = basePointsToStart; // Starting points if no save
            currentMultiplier = 1;
            purchasedMultipliers = [];
            console.log("New Game Started");
        }
        updatePointsDisplay();
        updateMultiplierDisplay();
    }

    function resetGameData() {
        if (confirm("Are you sure you want to reset all game data? This cannot be undone.")) {
            localStorage.removeItem('wheelOfFortuneGame');
            points = basePointsToStart;
            currentMultiplier = 1;
            purchasedMultipliers = [];
            showMessage("Game Reset!", 3000);
            updatePointsDisplay();
            updateMultiplierDisplay();
            drawWheel(); // Redraw initial state
        }
    }


    // Event Listeners
    spinButton.addEventListener('click', spinWheel);
    resetButton.addEventListener('click', resetGameData);

    shopItems.forEach(item => {
        item.addEventListener('click', () => {
            // Prevent buying if disabled (e.g. not enough points or already purchased)
            if (!item.classList.contains('disabled') && !item.classList.contains('purchased')) {
                 buyShopItem(item);
            } else if (item.classList.contains('purchased') && item.dataset.type === "multiplier") {
                showMessage("Multiplier already active or purchased.", 2000);
            } else if (item.classList.contains('disabled')) {
                 showMessage("Cannot afford this item or it's unavailable.", 2000);
            } else if (item.id === "pickup-trash") { // Special case for pick up trash, always allow
                 buyShopItem(item);
            }
        });
    });

    // Initial Setup
    loadGame(); // Load saved game or start new
    drawWheel(); // Initial wheel draw
});
