document.addEventListener('DOMContentLoaded', () => {
    // Screens
    const screens = document.querySelectorAll('.screen');
    const startScreen = document.getElementById('start-screen');
    const mainMenuScreen = document.getElementById('main-menu-screen');
    // Game and Shop Screens (can be specific if needed, or handled generically)
    // const slotsScreen = document.getElementById('slots-screen'); (example)

    // Buttons
    const playButton = document.getElementById('play-button');
    const menuButtons = document.querySelectorAll('.menu-button');
    const backToMenuButtons = document.querySelectorAll('.back-to-menu');
    const buyMultiplierButton = document.getElementById('buy-multiplier');
    const buyPointPackButton = document.getElementById('buy-point-pack');

    // Displays
    const pointsDisplays = [ // Keep all point display elements in sync
        document.getElementById('points-display'),
        document.getElementById('points-display-slots'),
        document.getElementById('points-display-plinko'),
        document.getElementById('points-display-blackjack'),
        document.getElementById('points-display-poker'),
        document.getElementById('points-display-shop'),
    ];
    const multiplierCostDisplay = document.getElementById('multiplier-cost');


    // Game State
    let playerPoints = 0; // Load from localStorage if implemented
    let pointMultiplier = 1;
    let currentMultiplierCost = 100;

    // --- Initialization ---
    function init() {
        updatePointsDisplay();
        updateShopDisplay();
        showScreen('start-screen');
    }

    // --- Screen Navigation ---
    function showScreen(screenId) {
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
        const screenToShow = document.getElementById(screenId);
        if (screenToShow) {
            screenToShow.classList.add('active');
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
            // Placeholder: Initialize game state if needed when entering a game screen
            // Example: if (targetScreenId === 'slots-screen') { initSlotsGame(); }
        });
    });

    backToMenuButtons.forEach(button => {
        button.addEventListener('click', () => {
            showScreen('main-menu-screen');
        });
    });

    // --- Points System ---
    function updatePointsDisplay() {
        pointsDisplays.forEach(display => {
            if(display) display.textContent = playerPoints;
        });
    }

    function addPoints(amount) {
        playerPoints += Math.floor(amount * pointMultiplier);
        updatePointsDisplay();
        // Consider adding visual/audio feedback for points gained
        console.log(`Gained ${Math.floor(amount * pointMultiplier)} points. Total: ${playerPoints}`);
    }

    function spendPoints(amount) {
        if (playerPoints >= amount) {
            playerPoints -= amount;
            updatePointsDisplay();
            return true;
        }
        alert("Not enough points!");
        return false;
    }

    // --- Shop System (Basic Examples) ---
    function updateShopDisplay() {
        if(multiplierCostDisplay) multiplierCostDisplay.textContent = currentMultiplierCost;
        // Update other shop item displays if they change dynamically
    }

    buyMultiplierButton.addEventListener('click', () => {
        if (spendPoints(currentMultiplierCost)) {
            pointMultiplier *= 2; // Or however you want it to scale, e.g., pointMultiplier += 1;
            currentMultiplierCost = Math.floor(currentMultiplierCost * 2.5); // Increase cost
            updateShopDisplay();
            alert(`Point Multiplier purchased! It's now x${pointMultiplier}.`);
            // Persist pointMultiplier and currentMultiplierCost if using localStorage
        }
    });

    buyPointPackButton.addEventListener('click', () => {
        const packCost = 250;
        const packValue = 500;
        if (spendPoints(packCost)) {
            // Note: Shop point packs typically shouldn't be affected by the multiplier
            playerPoints += packValue; // Directly add points
            updatePointsDisplay();
            alert(`${packValue} points added!`);
        }
    });

    // --- Game Logic Placeholders (to be developed) ---

    // Slots Game Example
    function initSlotsGame() {
        console.log("Slots game initialized");
        // Reset reels, bets, etc.
    }
    // document.getElementById('spin-slots-button').addEventListener('click', playSlots); (Example)

    // Plinko Game Example
    function initPlinkoGame() {
        console.log("Plinko game initialized");
    }

    // Blackjack Game Example
    function initBlackjackGame() {
        console.log("Blackjack game initialized");
        // Create deck, shuffle, prepare for dealing
    }

    // Poker Game Example
    function initPokerGame() {
        console.log("Poker game initialized");
    }


    // --- Start the game ---
    init();

    // --- Functions to make it Addicting (Conceptual - implement within game logic) ---
    function playSound(soundName) {
        // Basic sound playing logic (would require <audio> elements or Web Audio API)
        console.log(`Playing sound: ${soundName}`);
        // const audio = new Audio(`sounds/${soundName}.mp3`);
        // audio.play();
    }

    function showVisualEffect(effectType) {
        // e.g., flash screen, particle effects - more complex, often needs libraries or canvas
        console.log(`Showing visual effect: ${effectType}`);
    }

    // --- Example of how points might be awarded from a game ---
    // This would be called from your specific game logic, e.g., after a winning slot spin.
    // function awardPrize(basePoints) {
    //     addPoints(basePoints);
    //     playSound('winSound');
    //     showVisualEffect('coinsFalling');
    // }
    // awardPrize(50); // Example call: player wins 50 base points


    // --- TODO for further development: ---
    // 1.  Implement LocalStorage for saving points, multiplier, and shop state.
    // 2.  Detailed logic for each game: Slots, Plinko, Blackjack, Poker.
    // 3.  More dynamic shop items and more complex "booster" effects.
    // 4.  Actual sound effects and more advanced visual effects for "juiciness".
    // 5.  Balancing the game economy (earn rates, shop costs) for sustained engagement.
});
