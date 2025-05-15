document.addEventListener('DOMContentLoaded', () => {
    // Screens
    const screens = document.querySelectorAll('.screen');
    const startScreen = document.getElementById('start-screen');
    const mainMenuScreen = document.getElementById('main-menu-screen');

    // Buttons
    const playButton = document.getElementById('play-button');
    const menuButtons = document.querySelectorAll('.menu-button');
    const backToMenuButtons = document.querySelectorAll('.back-to-menu');
    const buyMultiplierButton = document.getElementById('buy-multiplier');
    const buyHorseUpgradeButton = document.getElementById('buy-horse-upgrade');
    const spinSlotsButton = document.getElementById('spin-button'); // Slots spin

    // Displays
    const pointsDisplays = Array.from(document.querySelectorAll('[id^="points-display"]')); // Selects all point display spans
    const multiplierCostDisplay = document.getElementById('multiplier-cost');
    const currentMultiplierDisplay = document.getElementById('current-multiplier-display');
    const horseUpgradeCostDisplay = document.getElementById('horse-upgrade-cost'); // For horse upgrade cost

    // Slots UI
    const slotReels = document.querySelectorAll('.slot-reel');
    const slotsResultDisplay = document.getElementById('slots-result');
    const slotBetInput = document.getElementById('slot-bet');


    // --- Game State ---
    const MINIMUM_POINTS = 10;
    let playerPoints = 50;
    let pointMultiplier = 1;
    let currentMultiplierCost = 100;
    let hasHorseUpgrade = false; // For the new shop item
    let currentHorseUpgradeCost = 500; // Initial cost for the horse upgrade

    // --- LocalStorage Keys ---
    const POINTS_KEY = 'aiCasinoPoints';
    const MULTIPLIER_KEY = 'aiCasinoMultiplier';
    const MULTIPLIER_COST_KEY = 'aiCasinoMultiplierCost';
    const HORSE_UPGRADE_KEY = 'aiCasinoHorseUpgrade';
    const HORSE_UPGRADE_COST_KEY = 'aiCasinoHorseUpgradeCost';


    // --- Initialization ---
    function init() {
        loadGameState(); // Load saved state first
        updatePointsDisplay();
        updateShopDisplay();
        showScreen('start-screen');

        // Initial call to update point displays on all game screens correctly
        updateAllGamePointDisplays();
    }

    function updateAllGamePointDisplays() {
        pointsDisplays.forEach(display => {
            if (display) display.textContent = playerPoints;
        });
    }


    // --- Screen Navigation ---
    function showScreen(screenId) {
        screens.forEach(screen => screen.classList.remove('active'));
        const screenToShow = document.getElementById(screenId);
        if (screenToShow) {
            screenToShow.classList.add('active');
            updateAllGamePointDisplays(); // Ensure points are fresh on new screen
        } else {
            console.error("Screen not found:", screenId);
        }
    }

    playButton.addEventListener('click', () => {
        showScreen('main-menu-screen');
    });

    menuButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetScreenId = button.getAttribute('data-screen');
            showScreen(targetScreenId);
            // Placeholder: Initialize game state if needed
            if (targetScreenId === 'slots-screen') initSlotsGame();
            if (targetScreenId === 'plinko-screen') initPlinkoGame();
            if (targetScreenId === 'blackjack-screen') initBlackjackGame();
            if (targetScreenId === 'poker-screen') initPokerGame();
            if (targetScreenId === 'scratch-cards-screen') initScratchCardsGame();
            if (targetScreenId === 'horse-races-screen') initHorseRacesGame();
            if (targetScreenId === 'stock-market-screen') initStockMarketGame();
            if (targetScreenId === 'dice-game-screen') initDiceGame();
            if (targetScreenId === 'roulette-screen') initRouletteGame();
        });
    });

    backToMenuButtons.forEach(button => {
        button.addEventListener('click', () => {
            showScreen('main-menu-screen');
        });
    });

    // --- Points System ---
    function updatePointsDisplay() {
        updateAllGamePointDisplays();
        saveGameState(); // Save points whenever they change
    }

    function addPoints(amount) {
        playerPoints += Math.floor(amount * pointMultiplier);
        updatePointsDisplay();
        console.log(`Gained ${Math.floor(amount * pointMultiplier)} points. Total: ${playerPoints}`);
    }

    function canSpend(amount) {
        return playerPoints - amount >= MINIMUM_POINTS;
    }

    function spendPoints(amount) {
        if (playerPoints - amount >= MINIMUM_POINTS) {
            playerPoints -= amount;
            updatePointsDisplay();
            return true;
        } else if (playerPoints >= amount) { // Can spend, but would go below minimum
             alert(`You can't go below ${MINIMUM_POINTS} points. This bet is too high or you're too close to the minimum.`);
             return false;
        }
        alert("Not enough points for this action!");
        return false;
    }
    
    // Specific function for game costs to prevent going below MINIMUM_POINTS
    function deductGameCost(cost) {
        if (playerPoints - cost < 0 && playerPoints >=cost) { // Can afford but would go into negative
            alert("This bet would take you below 0 points!");
            return false;
        }
        if (playerPoints - cost < MINIMUM_POINTS && playerPoints >= cost) {
            alert(`You cannot place this bet as it would take you below the minimum of ${MINIMUM_POINTS} points.`);
            return false;
        }
        if (playerPoints >= cost) {
            playerPoints -= cost;
            updatePointsDisplay();
            return true;
        }
        alert("Not enough points to play!");
        return false;
    }


    // --- Shop System ---
    function updateShopDisplay() {
        if(multiplierCostDisplay) multiplierCostDisplay.textContent = currentMultiplierCost;
        if(currentMultiplierDisplay) currentMultiplierDisplay.textContent = pointMultiplier;
        if(horseUpgradeCostDisplay) horseUpgradeCostDisplay.textContent = currentHorseUpgradeCost;

        const horseUpgradeButton = document.getElementById('buy-horse-upgrade');
        const horseUpgradeItemDiv = document.getElementById('horse-upgrade-item');
        if (hasHorseUpgrade && horseUpgradeButton) {
            horseUpgradeButton.textContent = "Owned";
            horseUpgradeButton.disabled = true;
            if (horseUpgradeItemDiv.querySelector('p:nth-child(2)')) { // a bit fragile selector for cost
                 horseUpgradeItemDiv.querySelector('p:nth-child(2)').style.display = 'none';
            }
        } else if (horseUpgradeButton) {
            horseUpgradeButton.textContent = "Buy Upgrade";
            horseUpgradeButton.disabled = false;
             if (horseUpgradeItemDiv.querySelector('p:nth-child(2)')) {
                 horseUpgradeItemDiv.querySelector('p:nth-child(2)').style.display = 'block';
            }
        }
        saveGameState();
    }

    if(buyMultiplierButton) {
        buyMultiplierButton.addEventListener('click', () => {
            if (spendPoints(currentMultiplierCost)) { // spendPoints now handles MINIMUM_POINTS check implicitly
                pointMultiplier = parseFloat((pointMultiplier + 0.5).toFixed(1)); // Incremental multiplier
                currentMultiplierCost = Math.floor(currentMultiplierCost * 1.8); // Increase cost
                updateShopDisplay();
                alert(`Point Multiplier upgraded! It's now x${pointMultiplier}.`);
            }
        });
    }

    if(buyHorseUpgradeButton) {
        buyHorseUpgradeButton.addEventListener('click', () => {
            if (!hasHorseUpgrade && spendPoints(currentHorseUpgradeCost)) {
                hasHorseUpgrade = true;
                updateShopDisplay();
                alert("Horse Race Insight purchased! You'll have an edge in picking horses.");
            }
        });
    }

    // --- Persistence (LocalStorage) ---
    function saveGameState() {
        localStorage.setItem(POINTS_KEY, playerPoints);
        localStorage.setItem(MULTIPLIER_KEY, pointMultiplier);
        localStorage.setItem(MULTIPLIER_COST_KEY, currentMultiplierCost);
        localStorage.setItem(HORSE_UPGRADE_KEY, hasHorseUpgrade);
        localStorage.setItem(HORSE_UPGRADE_COST_KEY, currentHorseUpgradeCost); // if cost changes
    }

    function loadGameState() {
        const savedPoints = localStorage.getItem(POINTS_KEY);
        const savedMultiplier = localStorage.getItem(MULTIPLIER_KEY);
        const savedMultiplierCost = localStorage.getItem(MULTIPLIER_COST_KEY);
        const savedHorseUpgrade = localStorage.getItem(HORSE_UPGRADE_KEY);
        const savedHorseUpgradeCost = localStorage.getItem(HORSE_UPGRADE_COST_KEY);

        if (savedPoints !== null) playerPoints = parseInt(savedPoints, 10);
        else playerPoints = 50; // Default starting points if nothing saved

        if (playerPoints < MINIMUM_POINTS && playerPoints !==0) playerPoints = MINIMUM_POINTS; // Ensure min on load (except if exactly 0 from a reset maybe)
        if (playerPoints === 0 && MINIMUM_POINTS > 0) playerPoints = MINIMUM_POINTS; // If loaded as 0, and min points > 0, set to min

        if (savedMultiplier !== null) pointMultiplier = parseFloat(savedMultiplier);
        if (savedMultiplierCost !== null) currentMultiplierCost = parseInt(savedMultiplierCost, 10);
        if (savedHorseUpgrade !== null) hasHorseUpgrade = savedHorseUpgrade === 'true';
        if (savedHorseUpgradeCost !== null) currentHorseUpgradeCost = parseInt(savedHorseUpgradeCost, 10);
    }


    // --- GAME LOGIC PLACEHOLDERS (MASSIVE WORK AHEAD!) ---

    // Slots Game (3x3 Example Structure)
    const slotSymbols = ['🍒', '🍋', '🍊', '🍉', '⭐', '🔔', 'BAR']; // Example symbols
    function initSlotsGame() {
        console.log("Slots game initialized (3x3)");
        slotsResultDisplay.textContent = "Press Spin!";
        slotReels.forEach(reel => reel.textContent = '?');
    }

    if (spinSlotsButton) {
        spinSlotsButton.addEventListener('click', ()_SETUP);
    }


    // --- Game Logic Placeholders (to be developed) ---

    // Slots Game (3x3 Example Structure)
    // ... (initSlotsGame already defined above) ...
    if (spinSlotsButton) {
        spinSlotsButton.addEventListener('click', () => {
            const betAmount = parseInt(slotBetInput.value);
            if (isNaN(betAmount) || betAmount <= 0) {
                alert("Please enter a valid bet amount.");
                return;
            }
            if (!deductGameCost(betAmount)) { // deductGameCost handles points checks
                return;
            }

            slotsResultDisplay.textContent = "Spinning...";
            // Simulate spinning animation (simple timeout for now)
            let spinCount = 0;
            const maxSpins = 9; // Number of symbols to flash on each reel
            const spinInterval = 100; // Milliseconds between symbol changes

            slotReels.forEach((reel, index) => {
                let currentReelSpinCount = 0;
                const reelAnimation = setInterval(() => {
                    reel.textContent = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
                    currentReelSpinCount++;
                    if (currentReelSpinCount >= maxSpins + (index * 3)) { // Stagger stop
                        clearInterval(reelAnimation);
                        // Final symbol determination (replace with actual win logic)
                        reel.textContent = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
                        
                        // Check if all reels stopped
                        spinCount++;
                        if (spinCount === slotReels.length) {
                            evaluateSlotsWin();
                        }
                    }
                }, spinInterval);
            });
        });
    }

    function evaluateSlotsWin() {
        // THIS IS VERY BASIC - NEEDS PROPER WIN LINE CHECKING FOR 3x3
        const reelValues = Array.from(slotReels).map(reel => reel.textContent);
        slotsResultDisplay.textContent = `Reels: ${reelValues.join(' - ')}`;

        // Example: Check for three Cherries in the middle row (index 3, 4, 5 for a 3x3 grid visually)
        // For a 1D array representing the 3x3 grid, these are indices 3,4,5
        // (Conceptual indices based on visual rows/cols: [0,1,2], [3,4,5], [6,7,8])
        let winAmount = 0;
        // Check middle row: reels[3], reels[4], reels[5]
        if (reelValues[3] === reelValues[4] && reelValues[4] === reelValues[5] && reelValues[3] === '🍒') {
            winAmount = parseInt(slotBetInput.value) * 10; // 10x payout for 3 cherries
            slotsResultDisplay.textContent = "Winner! 3 Cherries in middle row!";
        } else if (reelValues[0] === reelValues[1] && reelValues[1] === reelValues[2] && reelValues[0] === 'BAR') { // Top row BARs
             winAmount = parseInt(slotBetInput.value) * 20;
             slotsResultDisplay.textContent = "Winner! 3 BARs in top row!";
        }
        // Add many more winning combinations for a 3x3 grid (lines, diagonals etc.)

        if (winAmount > 0) {
            addPoints(winAmount);
            slotsResultDisplay.textContent += ` You won ${winAmount * pointMultiplier} points!`;
             playSound('winSound'); // Placeholder
        } else {
            slotsResultDisplay.textContent = `Reels: ${reelValues.join(' - ')} - No win this time.`;
             playSound('loseSound'); // Placeholder
        }
    }


    // Plinko Game
    function initPlinkoGame() { console.log("Plinko game initialized"); }
    // Blackjack Game
    function initBlackjackGame() { console.log("Blackjack game initialized"); /* TODO: Deck, player/dealer hands */ }
    // Poker Game
    function initPokerGame() { console.log("Poker game initialized"); /* TODO: Deck, hand evaluation */ }
    // Scratch Cards Game
    function initScratchCardsGame() { console.log("Scratch Cards game initialized"); }
    // Horse Races Game
    function initHorseRacesGame() {
        console.log("Horse Races game initialized");
        const horseSelectionArea = document.getElementById('horse-selection-area');
        if(horseSelectionArea) {
            horseSelectionArea.innerHTML = ''; // Clear previous horses
            const horses = ["Speedy Gonzales", "Lucky Runner", "Gallop King", "Night Rider"]; // Example
            horses.forEach((horseName, index) => {
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.id = `horse-${index}`;
                radio.name = 'horse-selection';
                radio.value = horseName;
                if(index === 0) radio.checked = true;

                const label = document.createElement('label');
                label.htmlFor = `horse-${index}`;
                label.textContent = horseName;

                horseSelectionArea.appendChild(radio);
                horseSelectionArea.appendChild(label);
                horseSelectionArea.appendChild(document.createElement('br'));
            });
        }
        // TODO: Actual race logic if #start-horse-race is clicked
    }
    // Stock Market Game
    function initStockMarketGame() { console.log("Stock Market game initialized"); }
    // Dice Game
    function initDiceGame() { console.log("Dice Game initialized"); }
    // Roulette Game
    function initRouletteGame() { console.log("Roulette game initialized"); }


    // --- Utility for sounds/visuals (Placeholders) ---
    function playSound(soundName) { console.log(`Playing sound: ${soundName}`); }


    // --- Start the game ---
    init();
});
