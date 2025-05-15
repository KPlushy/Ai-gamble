document.addEventListener('DOMContentLoaded', () => {
    // --- GLOBAL DOM ELEMENTS & SHARED STATE ---
    const screens = document.querySelectorAll('.screen');
    const playButton = document.getElementById('play-button');
    const menuButtons = document.querySelectorAll('.menu-button');
    const backToMenuButtons = document.querySelectorAll('.back-to-menu');

    const pointsDisplays = Array.from(document.querySelectorAll('[id^="points-display"]'));
    const multiplierCostDisplay = document.getElementById('multiplier-cost');
    const currentMultiplierDisplay = document.getElementById('current-multiplier-display');
    const horseUpgradeCostDisplay = document.getElementById('horse-upgrade-cost');
    const buyMultiplierButton = document.getElementById('buy-multiplier');
    const buyHorseUpgradeButton = document.getElementById('buy-horse-upgrade');

    const MINIMUM_POINTS = 10;
    let playerPoints = 50;
    let pointMultiplier = 1;
    let currentMultiplierCost = 100;
    let hasHorseUpgrade = false;
    let currentHorseUpgradeCost = 500;

    const POINTS_KEY = 'aiCasinoPoints';
    const MULTIPLIER_KEY = 'aiCasinoMultiplier';
    const MULTIPLIER_COST_KEY = 'aiCasinoMultiplierCost';
    const HORSE_UPGRADE_KEY = 'aiCasinoHorseUpgrade';
    const HORSE_UPGRADE_COST_KEY = 'aiCasinoHorseUpgradeCost';
    const PORTFOLIO_LS_KEY = 'aiCasinoStockPortfolio'; // Stock market portfolio

    // --- SHARED UTILITY FUNCTIONS ---
    function playSound(soundName) {
        console.log(`Playing sound: ${soundName} (Placeholder)`);
        // const audio = new Audio(`sounds/${soundName}.mp3`);
        // audio.play().catch(e => console.error("Error playing sound:", e));
    }

    function updateAllGamePointDisplays() {
        pointsDisplays.forEach(display => {
            if (display) display.textContent = playerPoints;
        });
    }

    function saveGameState() {
        localStorage.setItem(POINTS_KEY, playerPoints);
        localStorage.setItem(MULTIPLIER_KEY, pointMultiplier);
        localStorage.setItem(MULTIPLIER_COST_KEY, currentMultiplierCost);
        localStorage.setItem(HORSE_UPGRADE_KEY, hasHorseUpgrade);
        localStorage.setItem(HORSE_UPGRADE_COST_KEY, currentHorseUpgradeCost);
    }

    function loadGameState() {
        const savedPoints = localStorage.getItem(POINTS_KEY);
        playerPoints = savedPoints !== null ? parseInt(savedPoints, 10) : 50;
        if (playerPoints < MINIMUM_POINTS && playerPoints !== 0) playerPoints = MINIMUM_POINTS;
        else if (playerPoints === 0 && MINIMUM_POINTS > 0) playerPoints = MINIMUM_POINTS;


        pointMultiplier = parseFloat(localStorage.getItem(MULTIPLIER_KEY) || 1);
        currentMultiplierCost = parseInt(localStorage.getItem(MULTIPLIER_COST_KEY) || 100, 10);
        hasHorseUpgrade = localStorage.getItem(HORSE_UPGRADE_KEY) === 'true';
        currentHorseUpgradeCost = parseInt(localStorage.getItem(HORSE_UPGRADE_COST_KEY) || 500, 10);
    }
    
    function updatePointsDisplay() { // Singular function to update all relevant displays and save
        updateAllGamePointDisplays();
        saveGameState();
    }

    function addPoints(amount) {
        const actualGain = Math.floor(amount * pointMultiplier); // This used to be direct addition for purchases etc.
                                                                 // Let's assume for wins from games, it's base * multiplier
                                                                 // For direct point purchases (if any) or returns, don't multiply.
                                                                 // Re-evaluating this: addPoints usually from GAME WINS, so multiplier applies.
        playerPoints += actualGain;
        updatePointsDisplay();
        console.log(`Gained ${actualGain} points. Total: ${playerPoints}`);
    }
    function addDirectPoints(amount) { // For things like bet returns, shop packs NOT subject to game multiplier
        playerPoints += amount;
        updatePointsDisplay();
         console.log(`Added ${amount} direct points. Total: ${playerPoints}`);
    }


    function spendPoints(amount) { // For shop purchases mostly
        if (playerPoints - amount < 0) { // Cannot go below 0 for shop items
             alert("Not enough points for this purchase!");
             return false;
        }
        if (playerPoints - amount < MINIMUM_POINTS && playerPoints >= amount) {
             alert(`This purchase would take you below the minimum of ${MINIMUM_POINTS} points.`);
             return false;
        }
        if (playerPoints >= amount) {
            playerPoints -= amount;
            updatePointsDisplay();
            return true;
        }
        alert("Not enough points for this purchase!");
        return false;
    }

    function deductGameCost(cost) { // For game bets
        if (cost <= 0) return true; // No cost, always allow

        if (playerPoints < cost) {
            alert("Not enough points to play!");
            return false;
        }
        if (playerPoints - cost < MINIMUM_POINTS && playerPoints >= MINIMUM_POINTS ) { // Check if going below minimum from a valid state
            // Allow bet if it ONLY uses up points down to the minimum OR if they only have points exactly matching cost above min
            // Example: Player has 15, min 10, bet 5 -> OK (Player has 10)
            // Player has 12, min 10, bet 5 -> NOT OK (12-5=7, below 10)
             if ((playerPoints - cost) >= 0 && (playerPoints - cost) < MINIMUM_POINTS ) { // If spending would take strictly below MINIMUM_POINTS
                alert(`This bet would take you below the minimum of ${MINIMUM_POINTS} points.`);
                return false;
            }
        }
        playerPoints -= cost;
        updatePointsDisplay();
        return true;
    }
    
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

    // --- CARD GAME UTILITIES (Blackjack & Poker) ---
    const SUITS = ['♥', '♦', '♣', '♠'];
    const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    function createDeck() {
        const deck = [];
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                let value = parseInt(rank);
                if (['J', 'Q', 'K'].includes(rank)) value = 10;
                else if (rank === 'A') value = 11;
                deck.push({ suit, rank, value, isHidden: false, held: false }); // 'held' for poker
            }
        }
        return deck;
    }

    function shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }
    
    function renderCard(cardData) { // Generic card renderer
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        if (cardData.suit === '♥' || cardData.suit === '♦') cardDiv.classList.add('red');
        else cardDiv.classList.add('black');

        if (cardData.isHidden) { // Blackjack specific logic for hidden card
            cardDiv.classList.add('hidden-card');
        } else {
            const rankTop = document.createElement('span');
            rankTop.className = 'rank-top';
            rankTop.textContent = cardData.rank;

            const suit = document.createElement('span');
            suit.className = 'suit';
            suit.textContent = cardData.suit;

            const rankBottom = document.createElement('span');
            rankBottom.className = 'rank-bottom';
            rankBottom.textContent = cardData.rank;

            cardDiv.appendChild(rankTop);
            cardDiv.appendChild(suit);
            cardDiv.appendChild(rankBottom);
        }
        return cardDiv;
    }


    // --- SHOP SYSTEM ---
    function updateShopDisplay() {
        if (multiplierCostDisplay) multiplierCostDisplay.textContent = currentMultiplierCost;
        if (currentMultiplierDisplay) currentMultiplierDisplay.textContent = pointMultiplier;
        if (horseUpgradeCostDisplay) horseUpgradeCostDisplay.textContent = currentHorseUpgradeCost;

        const horseUpgradeButtonElem = document.getElementById('buy-horse-upgrade'); // get element directly
        const horseUpgradeItemDiv = document.getElementById('horse-upgrade-item');
        if (hasHorseUpgrade && horseUpgradeButtonElem) {
            horseUpgradeButtonElem.textContent = "Owned";
            horseUpgradeButtonElem.disabled = true;
            const costPara = horseUpgradeItemDiv ? horseUpgradeItemDiv.querySelector('p:nth-of-type(2)') : null;
            if (costPara) costPara.style.display = 'none';
        } else if (horseUpgradeButtonElem) {
            horseUpgradeButtonElem.textContent = "Buy Upgrade";
            horseUpgradeButtonElem.disabled = false;
            const costPara = horseUpgradeItemDiv ? horseUpgradeItemDiv.querySelector('p:nth-of-type(2)') : null;
            if(costPara) costPara.style.display = 'block';
        }
        saveGameState();
    }

    if (buyMultiplierButton) {
        buyMultiplierButton.addEventListener('click', () => {
            if (spendPoints(currentMultiplierCost)) {
                pointMultiplier = parseFloat((pointMultiplier + 0.5).toFixed(1));
                currentMultiplierCost = Math.floor(currentMultiplierCost * 1.8) + 50; // Make cost increase more significantly
                updateShopDisplay();
                alert(`Point Multiplier upgraded! It's now x${pointMultiplier}.`);
            }
        });
    }
    if (buyHorseUpgradeButton) {
        buyHorseUpgradeButton.addEventListener('click', () => {
            if (!hasHorseUpgrade && spendPoints(currentHorseUpgradeCost)) {
                hasHorseUpgrade = true;
                updateShopDisplay();
                alert("Horse Race Insight purchased!");
            }
        });
    }

    // --- SLOTS GAME ---
    const slotReelsElements = document.querySelectorAll('.slot-reel');
    const slotsResultDisplay = document.getElementById('slots-result');
    const slotBetInput = document.getElementById('slot-bet');
    const spinSlotsButton = document.getElementById('spin-button');
    const slotSymbols = ['🍒', '🍋', '🍊', '🍉', '⭐', '🔔', 'BAR']; // Example symbols

    function initSlotsGame() {
        console.log("Slots game initialized (3x3)");
        if (slotsResultDisplay) slotsResultDisplay.textContent = "Press Spin!";
        slotReelsElements.forEach(reel => reel.textContent = '?');
    }
    if (spinSlotsButton) {
        spinSlotsButton.addEventListener('click', () => {
            const betAmount = parseInt(slotBetInput.value);
            if (isNaN(betAmount) || betAmount <= 0) {
                alert("Please enter a valid bet amount."); return;
            }
            if (!deductGameCost(betAmount)) return;

            if (slotsResultDisplay) slotsResultDisplay.textContent = "Spinning...";
            playSound('slotSpin');
            let spinCount = 0;
            const maxSpins = 9; 
            const spinInterval = 100;

            slotReelsElements.forEach((reel, index) => {
                let currentReelSpinCount = 0;
                const reelAnimation = setInterval(() => {
                    reel.textContent = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
                    currentReelSpinCount++;
                    if (currentReelSpinCount >= maxSpins + (index * 3)) {
                        clearInterval(reelAnimation);
                        reel.textContent = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
                        spinCount++;
                        if (spinCount === slotReelsElements.length) evaluateSlotsWin(betAmount);
                    }
                }, spinInterval);
            });
        });
    }
    function evaluateSlotsWin(betAmount) {
        const reelValues = Array.from(slotReelsElements).map(reel => reel.textContent);
        let winAmount = 0;
        // Very basic win: 3 in a row (middle horizontal)
        if (reelValues[3] === reelValues[4] && reelValues[4] === reelValues[5]) {
            if (reelValues[3] === 'BAR') winAmount = betAmount * 20;
            else if (reelValues[3] === '7️⃣') winAmount = betAmount * 15; // Assuming 7 is a symbol
            else if (reelValues[3] === '⭐') winAmount = betAmount * 10;
            else if (reelValues[3] === '🍒') winAmount = betAmount * 5;
            // Add more win lines and symbol combinations here for 3x3
        }
        // Example top row
        else if (reelValues[0] === reelValues[1] && reelValues[1] === reelValues[2] && reelValues[0] === 'BAR') {
             winAmount = betAmount * 20;
        }


        if (winAmount > 0) {
            addPoints(winAmount); // Already multiplied by player's overall multiplier
            if (slotsResultDisplay) slotsResultDisplay.textContent = `Winner! ${reelValues.join(' - ')} You won ${Math.floor(winAmount * pointMultiplier)} points!`;
            playSound('slotWin');
        } else {
            if (slotsResultDisplay) slotsResultDisplay.textContent = `Reels: ${reelValues.join(' - ')} - No win.`;
            playSound('slotLose');
        }
    }

    // --- PLINKO GAME ---
    const plinkoCanvas = document.getElementById('plinko-canvas');
    const plinkoCtx = plinkoCanvas ? plinkoCanvas.getContext('2d') : null;
    const plinkoBetInputElement = document.getElementById('plinko-bet-input'); // Unique ID from HTML
    const dropPlinkoBallButton = document.getElementById('drop-plinko-ball-button'); // Unique ID
    const plinkoMessage = document.getElementById('plinko-message');
    let plinkoPegs = []; const pegRows = 8; const pegRadius = 5; const ballRadius = 8;
    let currentPlinkoBall = null; let isPlinkoDropping = false;
    const plinkoPrizeSlots = [
        { value: 10, color: '#FF4136' },{ value: 2, color: '#FF851B' },{ value: 0.5, color: '#FFDC00'},
        { value: 5, color: '#2ECC40' },{ value: 0.2, color: '#0074D9'},{ value: 5, color: '#2ECC40' },
        { value: 0.5, color: '#FFDC00'},{ value: 2, color: '#FF851B' },{ value: 10, color: '#FF4136' }
    ];
    const plinkoSlotWidth = plinkoCanvas ? plinkoCanvas.width / plinkoPrizeSlots.length : 50;

    function initPlinkoGame() {
        if (!plinkoCtx) { console.error("Plinko canvas context not found!"); return; }
        console.log("Plinko game initialized");
        isPlinkoDropping = false;
        if (plinkoMessage) plinkoMessage.textContent = "Drop a ball!";
        setupPlinkoBoard(); drawPlinkoBoard();
    }
    function setupPlinkoBoard() {
        plinkoPegs = [];
        if (!plinkoCanvas) return;
        const canvasWidth = plinkoCanvas.width;
        const horizontalPadding = canvasWidth * 0.15;
        const effectiveWidth = canvasWidth - 2 * horizontalPadding;
        const topOffset = 50;
        for (let row = 0; row < pegRows; row++) {
            const numPegsInRow = row + 4;
            const y = topOffset + row * 35;
            const rowSpacing = effectiveWidth / (numPegsInRow - (row % 2 === 0 ? 1 : 0));
            for (let col = 0; col < numPegsInRow; col++) {
                let x = horizontalPadding + col * rowSpacing;
                if (row % 2 !== 0) x += rowSpacing / 2;
                plinkoPegs.push({ x, y, radius: pegRadius });
            }
        }
    }
    function drawPlinkoBoard() {
        if (!plinkoCtx || !plinkoCanvas) return;
        plinkoCtx.clearRect(0, 0, plinkoCanvas.width, plinkoCanvas.height);
        plinkoCtx.fillStyle = '#FFFFFF';
        plinkoPegs.forEach(peg => { plinkoCtx.beginPath(); plinkoCtx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2); plinkoCtx.fill(); });
        const slotHeight = 40; const slotY = plinkoCanvas.height - slotHeight;
        plinkoPrizeSlots.forEach((slot, index) => {
            const slotX = index * plinkoSlotWidth;
            plinkoCtx.fillStyle = slot.color; plinkoCtx.fillRect(slotX, slotY, plinkoSlotWidth, slotHeight);
            plinkoCtx.fillStyle = '#FFFFFF'; plinkoCtx.font = 'bold 14px Segoe UI'; plinkoCtx.textAlign = 'center';
            plinkoCtx.fillText(`x${slot.value}`, slotX + plinkoSlotWidth / 2, slotY + slotHeight / 2 + 5);
        });
        if (currentPlinkoBall) {
            plinkoCtx.fillStyle = '#FFD700'; plinkoCtx.beginPath();
            plinkoCtx.arc(currentPlinkoBall.x, currentPlinkoBall.y, ballRadius, 0, Math.PI * 2); plinkoCtx.fill();
        }
    }
    function dropPlinkoBallHandler() { // Renamed from dropPlinkoBall
        if (isPlinkoDropping || !plinkoBetInputElement) return;
        const betAmount = parseInt(plinkoBetInputElement.value);
        if (isNaN(betAmount) || betAmount <= 0) { if(plinkoMessage) plinkoMessage.textContent = "Valid bet please."; return; }
        if (!deductGameCost(betAmount)) { if(plinkoMessage) plinkoMessage.textContent = "Not enough points."; return; }
        isPlinkoDropping = true; if(plinkoMessage) plinkoMessage.textContent = "Dropping..."; playSound('plinkoDrop');
        currentPlinkoBall = { x: plinkoCanvas.width / 2 + (Math.random() * 40 - 20), y: 20, vx: 0, vy: 2 };
        animatePlinkoBall(betAmount);
    }
    function animatePlinkoBall(betAmount) {
        if (!currentPlinkoBall) { isPlinkoDropping = false; return; }
        currentPlinkoBall.y += currentPlinkoBall.vy; currentPlinkoBall.x += currentPlinkoBall.vx; currentPlinkoBall.vx *= 0.98;
        for (const peg of plinkoPegs) {
            const dx = currentPlinkoBall.x - peg.x; const dy = currentPlinkoBall.y - peg.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < ballRadius + peg.radius) {
                playSound('plinkoPegHit');
                const hitAngle = Math.atan2(dy, dx);
                currentPlinkoBall.vx = Math.cos(hitAngle) * 2 * (Math.random() > 0.5 ? 1 : -1);
                currentPlinkoBall.vy = Math.sin(hitAngle) * 1;
                currentPlinkoBall.x += currentPlinkoBall.vx; currentPlinkoBall.y += currentPlinkoBall.vy;
                break;
            }
        }
        const slotY = plinkoCanvas.height - 40;
        if (currentPlinkoBall.y + ballRadius > slotY) {
            const slotIndex = Math.floor(currentPlinkoBall.x / plinkoSlotWidth);
            if (slotIndex >= 0 && slotIndex < plinkoPrizeSlots.length) {
                const prizeMultiplier = plinkoPrizeSlots[slotIndex].value;
                const winnings = betAmount * prizeMultiplier; // This is base win
                addPoints(winnings); // addPoints handles player's general multiplier
                if(plinkoMessage) plinkoMessage.textContent = `Hit x${prizeMultiplier}! Won ${Math.floor(winnings * pointMultiplier)} pts!`;
                playSound('plinkoWin');
            } else { if(plinkoMessage) plinkoMessage.textContent = "Out of bounds!"; playSound('plinkoLose'); }
            currentPlinkoBall = null; isPlinkoDropping = false; drawPlinkoBoard(); return;
        }
        if (currentPlinkoBall.x - ballRadius < 0 || currentPlinkoBall.x + ballRadius > plinkoCanvas.width) {
            currentPlinkoBall.vx *= -0.8;
            currentPlinkoBall.x = Math.max(ballRadius, Math.min(currentPlinkoBall.x, plinkoCanvas.width - ballRadius));
        }
        if (currentPlinkoBall.y > plinkoCanvas.height + ballRadius * 2) {
             if(plinkoMessage) plinkoMessage.textContent = "Ball lost!"; currentPlinkoBall = null; isPlinkoDropping = false;
        }
        drawPlinkoBoard();
        if (isPlinkoDropping) requestAnimationFrame(() => animatePlinkoBall(betAmount));
    }
    if (dropPlinkoBallButton) dropPlinkoBallButton.addEventListener('click', dropPlinkoBallHandler);

    // --- BLACKJACK GAME ---
    const blackjackDealerCardsDiv = document.getElementById('blackjack-dealer-cards');
    const blackjackPlayerCardsDiv = document.getElementById('blackjack-player-cards');
    const blackjackDealerScoreDisplay = document.getElementById('blackjack-dealer-score');
    const blackjackPlayerScoreDisplay = document.getElementById('blackjack-player-score');
    const blackjackBetInputElementField = document.getElementById('blackjack-bet-input-field'); // Unique ID
    const blackjackDealButton = document.getElementById('blackjack-deal-button');
    const blackjackHitButton = document.getElementById('blackjack-hit-button');
    const blackjackStandButton = document.getElementById('blackjack-stand-button');
    const blackjackMessage = document.getElementById('blackjack-message');
    let blackjackDeck = []; let blackjackPlayerCards = []; let blackjackDealerCards = [];
    let blackjackPlayerScore = 0; let blackjackDealerScore = 0; let blackjackBet = 0;
    let isBlackjackRoundActive = false; let blackjackDealerHiddenCard = null;

    function calculateHandValue(hand) {
        let value = 0; let aceCount = 0;
        for (const card of hand) {
            if (card.isHidden) continue;
            value += card.value; if (card.rank === 'A') aceCount++;
        }
        while (value > 21 && aceCount > 0) { value -= 10; aceCount--; }
        return value;
    }
    function updateBlackjackHandsUI() {
        if(blackjackDealerCardsDiv) blackjackDealerCardsDiv.innerHTML = '';
        blackjackDealerCards.forEach(card => blackjackDealerCardsDiv.appendChild(renderCard(card)));
        let visibleDealerCards = blackjackDealerCards.filter(c => !c.isHidden);
        if(blackjackDealerScoreDisplay) blackjackDealerScoreDisplay.textContent = calculateHandValue(visibleDealerCards);

        if(blackjackPlayerCardsDiv) blackjackPlayerCardsDiv.innerHTML = '';
        blackjackPlayerCards.forEach(card => blackjackPlayerCardsDiv.appendChild(renderCard(card)));
        if(blackjackPlayerScoreDisplay) blackjackPlayerScoreDisplay.textContent = calculateHandValue(blackjackPlayerCards);
    }
    function initBlackjackGame() {
        console.log("Blackjack game initialized"); isBlackjackRoundActive = false;
        blackjackDeck = createDeck(); shuffleDeck(blackjackDeck);
        blackjackPlayerCards = []; blackjackDealerCards = []; blackjackDealerHiddenCard = null;
        if(blackjackMessage) blackjackMessage.textContent = "Place bet & Deal!";
        if(blackjackDealButton) blackjackDealButton.disabled = false;
        if(blackjackHitButton) blackjackHitButton.disabled = true;
        if(blackjackStandButton) blackjackStandButton.disabled = true;
        if(blackjackBetInputElementField) blackjackBetInputElementField.disabled = false;
        if(blackjackPlayerCardsDiv) blackjackPlayerCardsDiv.innerHTML = ''; if(blackjackDealerCardsDiv) blackjackDealerCardsDiv.innerHTML = '';
        if(blackjackPlayerScoreDisplay) blackjackPlayerScoreDisplay.textContent = '0'; if(blackjackDealerScoreDisplay) blackjackDealerScoreDisplay.textContent = '0';
    }
    function dealBlackjack() {
        if(!blackjackBetInputElementField) return;
        const bet = parseInt(blackjackBetInputElementField.value);
        if (isNaN(bet) || bet <= 0) { if(blackjackMessage) blackjackMessage.textContent = "Valid bet please."; return; }
        if (!deductGameCost(bet)) { if(blackjackMessage) blackjackMessage.textContent = "Not enough points."; return; }
        blackjackBet = bet; isBlackjackRoundActive = true;
        if(blackjackDealButton) blackjackDealButton.disabled = true; if(blackjackHitButton) blackjackHitButton.disabled = false;
        if(blackjackStandButton) blackjackStandButton.disabled = false; if(blackjackBetInputElementField) blackjackBetInputElementField.disabled = true;
        if(blackjackMessage) blackjackMessage.textContent = "Hit or Stand?";
        
        blackjackPlayerCards.push(blackjackDeck.pop()); blackjackDealerCards.push(blackjackDeck.pop());
        blackjackPlayerCards.push(blackjackDeck.pop()); blackjackDealerHiddenCard = blackjackDeck.pop();
        blackjackDealerHiddenCard.isHidden = true; blackjackDealerCards.push(blackjackDealerHiddenCard);
        
        blackjackPlayerScore = calculateHandValue(blackjackPlayerCards);
        blackjackDealerScore = calculateHandValue(blackjackDealerCards.filter(c => !c.isHidden));
        updateBlackjackHandsUI(); playSound('cardDeal');

        if (blackjackPlayerScore === 21 && blackjackPlayerCards.length === 2) {
            blackjackDealerHiddenCard.isHidden = false; blackjackDealerScore = calculateHandValue(blackjackDealerCards); updateBlackjackHandsUI();
            if(blackjackDealerScore === 21 && blackjackDealerCards.length === 2) {
                if(blackjackMessage) blackjackMessage.textContent = "Push! Both Blackjack!"; addDirectPoints(blackjackBet); playSound('blackjackPush');
            } else {
                if(blackjackMessage) blackjackMessage.textContent = "Blackjack! You win!"; addPoints(Math.floor(blackjackBet * 1.5)); playSound('blackjackWin');
            }
            endBlackjackRound();
        }
    }
    function playerHitBlackjack() { // Renamed to avoid clash
        if (!isBlackjackRoundActive) return;
        blackjackPlayerCards.push(blackjackDeck.pop()); blackjackPlayerScore = calculateHandValue(blackjackPlayerCards);
        updateBlackjackHandsUI(); playSound('cardDeal');
        if (blackjackPlayerScore > 21) {
            if(blackjackMessage) blackjackMessage.textContent = `Bust! Lose ${blackjackBet} pts.`; playSound('blackjackLose'); endBlackjackRound(false);
        } else if (blackjackPlayerScore === 21) playerStandBlackjack();
    }
    function playerStandBlackjack() { // Renamed
        if (!isBlackjackRoundActive) return; isBlackjackRoundActive = false;
        if(blackjackHitButton) blackjackHitButton.disabled = true; if(blackjackStandButton) blackjackStandButton.disabled = true;
        playSound('playerStand');
        if(blackjackDealerHiddenCard) blackjackDealerHiddenCard.isHidden = false;
        blackjackDealerScore = calculateHandValue(blackjackDealerCards); updateBlackjackHandsUI();
        setTimeout(dealerPlayBlackjack, 800); // Renamed
    }
    function dealerPlayBlackjack() { // Renamed
        if (blackjackDealerScore > 21) {
            if(blackjackMessage) blackjackMessage.textContent = `Dealer busts! Win ${blackjackBet} pts!`; addPoints(blackjackBet); playSound('blackjackWin');
            endBlackjackRound(); return;
        }
        while (blackjackDealerScore < 17) {
            if(blackjackMessage) blackjackMessage.textContent = "Dealer drawing...";
            blackjackDealerCards.push(blackjackDeck.pop()); blackjackDealerScore = calculateHandValue(blackjackDealerCards);
            updateBlackjackHandsUI(); playSound('cardDeal');
            if (blackjackDealerScore > 21) {
                if(blackjackMessage) blackjackMessage.textContent = `Dealer busts at ${blackjackDealerScore}! Win ${blackjackBet} pts!`; addPoints(blackjackBet);
                playSound('blackjackWin'); endBlackjackRound(); return;
            }
        }
        determineBlackjackWinner();
    }
    function determineBlackjackWinner() {
        if(blackjackMessage) blackjackMessage.textContent = `Dealer: ${blackjackDealerScore}. You: ${blackjackPlayerScore}.`;
        updateBlackjackHandsUI();
        if (blackjackPlayerScore > 21) { if(blackjackMessage) blackjackMessage.textContent += ` You busted. Lose ${blackjackBet}.`; playSound('blackjackLose'); }
        else if (blackjackDealerScore > 21) { if(blackjackMessage) blackjackMessage.textContent += ` Dealer busts! Win ${blackjackBet}.`; addPoints(blackjackBet); playSound('blackjackWin'); }
        else if (blackjackPlayerScore > blackjackDealerScore) { if(blackjackMessage) blackjackMessage.textContent += ` You win ${blackjackBet}!`; addPoints(blackjackBet); playSound('blackjackWin'); }
        else if (blackjackDealerScore > blackjackPlayerScore) { if(blackjackMessage) blackjackMessage.textContent += ` Dealer wins. Lose ${blackjackBet}.`; playSound('blackjackLose'); }
        else { if(blackjackMessage) blackjackMessage.textContent += " Push! Bet returned."; addDirectPoints(blackjackBet); playSound('blackjackPush'); }
        endBlackjackRound();
    }
    function endBlackjackRound(playerLostEarly = null) {
        isBlackjackRoundActive = false;
        if(blackjackDealButton) blackjackDealButton.disabled = false; if(blackjackHitButton) blackjackHitButton.disabled = true;
        if(blackjackStandButton) blackjackStandButton.disabled = true; if(blackjackBetInputElementField) blackjackBetInputElementField.disabled = false;
    }
    if(blackjackDealButton) blackjackDealButton.addEventListener('click', dealBlackjack);
    if(blackjackHitButton) blackjackHitButton.addEventListener('click', playerHitBlackjack);
    if(blackjackStandButton) blackjackStandButton.addEventListener('click', playerStandBlackjack);

    // --- POKER GAME ---
    const pokerPlayerHandDiv = document.getElementById('poker-player-hand');
    const pokerHandRankDisplay = document.getElementById('poker-hand-rank-display');
    const pokerBetInputElementField = document.getElementById('poker-bet-input-field'); // Unique ID
    const pokerDealDrawButton = document.getElementById('poker-deal-draw-button');
    const pokerMessage = document.getElementById('poker-message');
    let pokerDeck = []; let pokerPlayerHand = []; let pokerBetValue = 0; // Renamed from pokerBet
    let pokerGameState = 'betting';
    const POKER_HAND_RANKS = {
        ROYAL_FLUSH: { name: "Royal Flush", payout: 250 }, STRAIGHT_FLUSH: { name: "Straight Flush", payout: 50 },
        FOUR_OF_A_KIND: { name: "Four of a Kind", payout: 25 }, FULL_HOUSE: { name: "Full House", payout: 9 },
        FLUSH: { name: "Flush", payout: 6 }, STRAIGHT: { name: "Straight", payout: 4 },
        THREE_OF_A_KIND: { name: "Three of a Kind", payout: 3 }, TWO_PAIR: { name: "Two Pair", payout: 2 },
        JACKS_OR_BETTER: { name: "Jacks or Better", payout: 1 }, HIGH_CARD: { name: "High Card", payout: 0 }
    };
    function renderPokerCard(card, index) {
        const cardWrapper = document.createElement('div'); cardWrapper.className = 'poker-card-wrapper';
        const cardDiv = renderCard(card); cardDiv.dataset.cardIndex = index; // renderCard is generic
        const holdButton = document.createElement('button'); holdButton.className = 'hold-button';
        holdButton.textContent = 'Hold'; holdButton.disabled = true;
        holdButton.addEventListener('click', () => toggleHoldPokerCard(index, holdButton));
        cardWrapper.appendChild(cardDiv); cardWrapper.appendChild(holdButton); return cardWrapper;
    }
    function updatePokerHandUI() {
        if(pokerPlayerHandDiv) pokerPlayerHandDiv.innerHTML = '';
        pokerPlayerHand.forEach((card, index) => {
            const cardElement = renderPokerCard(card, index);
            pokerPlayerHandDiv.appendChild(cardElement);
            const holdButton = cardElement.querySelector('.hold-button');
            if (card.held) { holdButton.classList.add('held'); holdButton.textContent = 'Held';}
            else { holdButton.classList.remove('held'); holdButton.textContent = 'Hold'; }
            holdButton.disabled = pokerGameState !== 'dealt';
        });
    }
    function toggleHoldPokerCard(index, button) {
        if (pokerGameState !== 'dealt') return; pokerPlayerHand[index].held = !pokerPlayerHand[index].held;
        if (pokerPlayerHand[index].held) { button.classList.add('held'); button.textContent = 'Held';}
        else { button.classList.remove('held'); button.textContent = 'Hold';} playSound('buttonClick');
    }
    function initPokerGame() {
        console.log("Poker game initialized"); pokerGameState = 'betting'; pokerPlayerHand = [];
        updatePokerHandUI(); pokerDeck = createDeck(); shuffleDeck(pokerDeck);
        if(pokerMessage) pokerMessage.textContent = "Place bet & Deal!";
        if(pokerHandRankDisplay) pokerHandRankDisplay.textContent = "Hand: ---";
        if(pokerDealDrawButton) { pokerDealDrawButton.textContent = 'Deal'; pokerDealDrawButton.disabled = false; }
        if(pokerBetInputElementField) pokerBetInputElementField.disabled = false;
        const existingHoldButtons = pokerPlayerHandDiv ? pokerPlayerHandDiv.querySelectorAll('.hold-button') : [];
        existingHoldButtons.forEach(btn => btn.disabled = true);
    }
    function handlePokerDealDraw() {
        if (pokerGameState === 'betting') {
            if(!pokerBetInputElementField) return;
            pokerBetValue = parseInt(pokerBetInputElementField.value);
            if (isNaN(pokerBetValue) || pokerBetValue <= 0) { if(pokerMessage) pokerMessage.textContent = "Valid bet."; return; }
            if (!deductGameCost(pokerBetValue)) { if(pokerMessage) pokerMessage.textContent = "Not enough pts."; return; }
            pokerPlayerHand = [];
            for (let i = 0; i < 5; i++) {
                if (pokerDeck.length > 0) { const card = pokerDeck.pop(); card.held = false; pokerPlayerHand.push(card); }
            }
            pokerGameState = 'dealt'; if(pokerMessage) pokerMessage.textContent = "Hold cards, then Draw.";
            if(pokerDealDrawButton) pokerDealDrawButton.textContent = 'Draw'; if(pokerBetInputElementField) pokerBetInputElementField.disabled = true;
            updatePokerHandUI(); playSound('cardDeal');
        } else if (pokerGameState === 'dealt') {
            let cardsToDraw = pokerPlayerHand.filter(card => !card.held).length;
            pokerPlayerHand = pokerPlayerHand.filter(card => card.held);
            for (let i = 0; i < cardsToDraw; i++) {
                if (pokerDeck.length > 0) { const newCard = pokerDeck.pop(); newCard.held = false; pokerPlayerHand.push(newCard); }
            }
            pokerGameState = 'evaluated'; evaluatePokerHandAndPay(); updatePokerHandUI();
            if(pokerDealDrawButton) { pokerDealDrawButton.textContent = 'Deal'; pokerDealDrawButton.disabled = false; }
            if(pokerBetInputElementField) pokerBetInputElementField.disabled = false; playSound('cardDeal');
        }
    }
    function evaluatePokerHandAndPay() {
        const getRankValue = (rank) => {
            if (rank === 'A') return 14; if (rank === 'K') return 13; if (rank === 'Q') return 12;
            if (rank === 'J') return 11; return parseInt(rank);
        };
        pokerPlayerHand.sort((a, b) => getRankValue(a.rank) - getRankValue(b.rank));
        const handDetails = getPokerHandDetails(pokerPlayerHand); // Defined below
        let finalRank = POKER_HAND_RANKS.HIGH_CARD;
        if (handDetails.isRoyalFlush) finalRank = POKER_HAND_RANKS.ROYAL_FLUSH;
        else if (handDetails.isStraightFlush) finalRank = POKER_HAND_RANKS.STRAIGHT_FLUSH;
        else if (handDetails.isFourOfAKind) finalRank = POKER_HAND_RANKS.FOUR_OF_A_KIND;
        else if (handDetails.isFullHouse) finalRank = POKER_HAND_RANKS.FULL_HOUSE;
        else if (handDetails.isFlush) finalRank = POKER_HAND_RANKS.FLUSH;
        else if (handDetails.isStraight) finalRank = POKER_HAND_RANKS.STRAIGHT;
        else if (handDetails.isThreeOfAKind) finalRank = POKER_HAND_RANKS.THREE_OF_A_KIND;
        else if (handDetails.isTwoPair) finalRank = POKER_HAND_RANKS.TWO_PAIR;
        else if (handDetails.isJacksOrBetter) finalRank = POKER_HAND_RANKS.JACKS_OR_BETTER;
        if(pokerHandRankDisplay) pokerHandRankDisplay.textContent = `Hand: ${finalRank.name}`;
        if (finalRank.payout > 0) {
            const winnings = pokerBetValue * finalRank.payout; addPoints(winnings); // addPoints handles player point multiplier
            if(pokerMessage) pokerMessage.textContent = `${finalRank.name}! Win ${Math.floor(winnings * pointMultiplier)} pts!`; playSound('winBigSound');
        } else { if(pokerMessage) pokerMessage.textContent = `${finalRank.name}. No payout.`; playSound('loseSound'); }
        pokerGameState = 'betting';
    }
    function getPokerHandDetails(hand) {
        const ranks = hand.map(card => card.rank); const suits = hand.map(card => card.suit);
        const rankValues = hand.map(card => {
            if (card.rank === 'A') return 14; if (card.rank === 'K') return 13;
            if (card.rank === 'Q') return 12; if (card.rank === 'J') return 11; return parseInt(card.rank);
        }).sort((a,b) => a - b);
        const rankCounts = {}; ranks.forEach(rank => rankCounts[rank] = (rankCounts[rank] || 0) + 1);
        const counts = Object.values(rankCounts).sort((a, b) => b - a);
        const isFlushVal = suits.every(suit => suit === suits[0]); let isStraightVal = true;
        for (let i = 0; i < rankValues.length - 1; i++) { if (rankValues[i+1] - rankValues[i] !== 1) { isStraightVal = false; break; }}
        if (!isStraightVal && rankValues[0]===2 && rankValues[1]===3 && rankValues[2]===4 && rankValues[3]===5 && rankValues[4]===14) isStraightVal = true;
        const isRoyalFlushVal = isStraightVal && isFlushVal && rankValues[0] === 10 && rankValues[4] === 14;
        const isStraightFlushVal = isStraightVal && isFlushVal && !isRoyalFlushVal;
        const isFourOfAKindVal = counts[0] === 4; const isFullHouseVal = counts[0] === 3 && counts[1] === 2;
        const isThreeOfAKindVal = counts[0] === 3 && counts.length > 1 && counts[1] !== 2;
        let numPairs = 0; let isJacksOrBetterPair = false;
        for (const rank in rankCounts) {
            if (rankCounts[rank] === 2) {
                numPairs++;
                const numericRankVal = (rank === 'A' ? 14 : rank === 'K' ? 13 : rank === 'Q' ? 12 : rank === 'J' ? 11 : parseInt(rank));
                if (numericRankVal >= 11) isJacksOrBetterPair = true;
            }
        }
        const isTwoPairVal = numPairs === 2; const isOnePairVal = numPairs === 1;
        return { isRoyalFlush: isRoyalFlushVal, isStraightFlush: isStraightFlushVal, isFourOfAKind: isFourOfAKindVal,
            isFullHouse: isFullHouseVal, isFlush: isFlushVal && !isStraightVal, isStraight: isStraightVal && !isFlushVal,
            isThreeOfAKind: isThreeOfAKindVal, isTwoPair: isTwoPairVal, isJacksOrBetter: isOnePairVal && isJacksOrBetterPair,
        };
    }
    if(pokerDealDrawButton) pokerDealDrawButton.addEventListener('click', handlePokerDealDraw);

    // --- SCRATCH CARDS GAME ---
    const scratchCardCanvas = document.getElementById('scratch-card-canvas');
    const scratchCardSymbolsDiv = document.getElementById('scratch-card-symbols');
    const buyScratchCardButton = document.getElementById('buy-scratch-card-button');
    const revealAllScratchButton = document.getElementById('reveal-all-scratch-button');
    const scratchCardMessage = document.getElementById('scratch-card-message');
    const scratchCardCostDisplay = document.getElementById('scratch-card-cost');
    let scratchCtx = null; let isScratching = false; let currentScratchCard = null;
    const SCRATCH_CARD_COST = 10;
    const SCRATCH_SYMBOLS_OPTIONS = ['💎', '⭐', '🍒', '🔔', '💰', '7️⃣'];
    const SCRATCH_GRID_SIZE = 9; 

    function initScratchCardsGame() {
        console.log("Scratch Cards game initialized");
        if (scratchCardCanvas) {
            scratchCtx = scratchCardCanvas.getContext('2d');
            const holder = document.getElementById('scratch-card-holder'); // Need holder for dimensions
            if (holder) {
                scratchCardCanvas.width = holder.clientWidth; scratchCardCanvas.height = holder.clientHeight;
            } else { console.error("Scratch card holder not found for sizing canvas");}
        } else { console.error("Scratch card canvas not found!"); return; }
        if (scratchCardCostDisplay) scratchCardCostDisplay.textContent = SCRATCH_CARD_COST;
        resetScratchCardVisuals(); if(scratchCardMessage) scratchCardMessage.textContent = "Buy a card!";
        if(buyScratchCardButton) buyScratchCardButton.disabled = false; if(revealAllScratchButton) revealAllScratchButton.disabled = true;
        currentScratchCard = null;
    }
    function resetScratchCardVisuals() {
        if (!scratchCtx || !scratchCardCanvas) return;
        if(scratchCardSymbolsDiv) scratchCardSymbolsDiv.innerHTML = '';
        scratchCtx.globalCompositeOperation = 'source-over';
        const gradient = scratchCtx.createLinearGradient(0, 0, scratchCardCanvas.width, scratchCardCanvas.height);
        gradient.addColorStop(0, '#d4d4d4'); gradient.addColorStop(0.5, '#a0a0a0'); gradient.addColorStop(1, '#d4d4d4');
        scratchCtx.fillStyle = gradient; scratchCtx.fillRect(0, 0, scratchCardCanvas.width, scratchCardCanvas.height);
        if(revealAllScratchButton) revealAllScratchButton.disabled = true; if(scratchCardCanvas) scratchCardCanvas.style.cursor = 'default';
    }
    function generateNewScratchCard() {
        const symbols = []; const isWinner = Math.random() < 0.25;
        let prizeMultiplier = 0; let winningSymbol = null;
        if (isWinner) {
            const prizeTiers = [{ mult: 50, prob: 0.02 }, { mult: 10, prob: 0.1 }, { mult: 5, prob: 0.3 }, { mult: 2, prob: 0.58 }];
            const randTier = Math.random(); let cumulativeProb = 0;
            for (const tier of prizeTiers) { cumulativeProb += tier.prob; if (randTier <= cumulativeProb) { prizeMultiplier = tier.mult; break; }}
            if(prizeMultiplier === 0) prizeMultiplier = 2; winningSymbol = SCRATCH_SYMBOLS_OPTIONS[Math.floor(Math.random() * SCRATCH_SYMBOLS_OPTIONS.length)];
            let countWinningSymbol = 0;
            while (symbols.length < SCRATCH_GRID_SIZE) {
                if (countWinningSymbol < 3 && (SCRATCH_GRID_SIZE - symbols.length === 3 - countWinningSymbol || Math.random() < 0.4 )) {
                    symbols.push(winningSymbol); countWinningSymbol++;
                } else {
                    let randomSymbol;
                    do { randomSymbol = SCRATCH_SYMBOLS_OPTIONS[Math.floor(Math.random() * SCRATCH_SYMBOLS_OPTIONS.length)];
                    } while (countWinningSymbol >=3 && randomSymbol === winningSymbol && symbols.filter(s => s === winningSymbol).length >= 3)
                    symbols.push(randomSymbol);
                }
            }
            for (let i = symbols.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [symbols[i], symbols[j]] = [symbols[j], symbols[i]]; }
        } else {
            let symbolCounts = {};
            while(symbols.length < SCRATCH_GRID_SIZE) {
                let s;
                do { s = SCRATCH_SYMBOLS_OPTIONS[Math.floor(Math.random() * SCRATCH_SYMBOLS_OPTIONS.length)];
                } while ((symbolCounts[s] || 0) >= 2 && Math.random() < 0.8);
                symbols.push(s); symbolCounts[s] = (symbolCounts[s] || 0) + 1;
            }
        }
        currentScratchCard = { symbols: symbols, winData: { isWinner, prizeMultiplier, winningSymbol }, scratchedPercentage: 0 };
        if(scratchCardSymbolsDiv) scratchCardSymbolsDiv.innerHTML = '';
        symbols.forEach(symbol => {
            const symbolDiv = document.createElement('div'); symbolDiv.className = 'scratch-symbol';
            symbolDiv.textContent = symbol; scratchCardSymbolsDiv.appendChild(symbolDiv);
        });
    }
    function buyNewScratchCard() {
        if (!deductGameCost(SCRATCH_CARD_COST)) { if(scratchCardMessage) scratchCardMessage.textContent = "Not enough pts."; return; }
        playSound('buyItem'); resetScratchCardVisuals(); generateNewScratchCard();
        if(scratchCardMessage) scratchCardMessage.textContent = "Scratch away!";
        if(buyScratchCardButton) buyScratchCardButton.disabled = true; if(revealAllScratchButton) revealAllScratchButton.disabled = false;
        if(scratchCardCanvas) scratchCardCanvas.style.cursor = 'grabbing'; currentScratchCard.scratchedPercentage = 0;
    }
    function getScratchPosition(event) {
        if(!scratchCardCanvas) return {x:0, y:0};
        const rect = scratchCardCanvas.getBoundingClientRect(); let x, y;
        if (event.touches) { x = event.touches[0].clientX - rect.left; y = event.touches[0].clientY - rect.top;}
        else { x = event.clientX - rect.left; y = event.clientY - rect.top; }
        return { x, y };
    }
    function scratch(e) {
        if (!isScratching || !currentScratchCard || currentScratchCard.scratchedPercentage >= 100 || !scratchCtx) return;
        e.preventDefault(); const { x, y } = getScratchPosition(e); const scratchRadius = 20;
        scratchCtx.globalCompositeOperation = 'destination-out'; scratchCtx.beginPath();
        scratchCtx.arc(x, y, scratchRadius, 0, Math.PI * 2, false); scratchCtx.fill(); playSound('scratchingSound');
    }
    function startScratch(e) {
        if (!currentScratchCard || (currentScratchCard && currentScratchCard.scratchedPercentage >= 100)) return;
        isScratching = true; scratch(e);
    }
    function stopScratch() { if (isScratching) isScratching = false; }
    function revealAllSymbols() {
        if (!currentScratchCard || !scratchCtx || !scratchCardCanvas) return; playSound('revealClick');
        scratchCtx.globalCompositeOperation = 'destination-out';
        scratchCtx.fillRect(0, 0, scratchCardCanvas.width, scratchCardCanvas.height);
        currentScratchCard.scratchedPercentage = 100;
        const { isWinner, prizeMultiplier, winningSymbol } = currentScratchCard.winData;
        if (isWinner) {
            const winnings = SCRATCH_CARD_COST * prizeMultiplier; addPoints(winnings);
            if(scratchCardMessage) scratchCardMessage.textContent = `Winner! Matched ${winningSymbol}, won ${Math.floor(winnings*pointMultiplier)} pts!`; playSound('winBigSound');
        } else { if(scratchCardMessage) scratchCardMessage.textContent = "Sorry, not a winner."; playSound('loseSound'); }
        if(buyScratchCardButton) buyScratchCardButton.disabled = false; if(revealAllScratchButton) revealAllScratchButton.disabled = true;
        if(scratchCardCanvas) scratchCardCanvas.style.cursor = 'default'; currentScratchCard = null;
    }
    if (scratchCardCanvas) {
        scratchCardCanvas.addEventListener('mousedown', startScratch); scratchCardCanvas.addEventListener('mousemove', scratch);
        scratchCardCanvas.addEventListener('mouseup', stopScratch); scratchCardCanvas.addEventListener('mouseleave', stopScratch);
        scratchCardCanvas.addEventListener('touchstart', startScratch, { passive: false });
        scratchCardCanvas.addEventListener('touchmove', scratch, { passive: false });
        scratchCardCanvas.addEventListener('touchend', stopScratch); scratchCardCanvas.addEventListener('touchcancel', stopScratch);
    }
    if (buyScratchCardButton) buyScratchCardButton.addEventListener('click', buyNewScratchCard);
    if (revealAllScratchButton) revealAllScratchButton.addEventListener('click', revealAllSymbols);

    // --- HORSE RACE GAME ---
    const raceTrack = document.getElementById('race-track');
    const horseSelectionArea = document.getElementById('horse-selection-area');
    const insightChoiceArea = document.getElementById('insight-choice-area');
    const insightHorsesSelection = document.getElementById('insight-horses-selection');
    const horseBetAmountInputElement = document.getElementById('horse-bet-amount-input'); // Unique ID
    const startHorseRaceButton = document.getElementById('start-horse-race-button');
    const horseRaceResultDisplay = document.getElementById('horse-race-result');
    let horses = []; const HORSE_EMOJIS = ['🐎', '🐴', '🏇', '🦄'];
    const HORSE_NAMES = ["Lightning Bolt", "Gallant Steed", "Sure Shot", "Midnight Rider", "Comet", "Pegasus Prancer"];
    let FINISH_LINE_POSITION = raceTrack ? raceTrack.clientWidth * 0.92 : 600; 
    let raceInterval = null; let raceInProgress = false; const numHorsesInRace = 4;

    function initHorseRacesGame() {
        console.log("Horse Races game initialized");
        if (!raceTrack) { console.error("Race track element not found!"); return; }
        FINISH_LINE_POSITION = raceTrack.clientWidth * 0.92; // Recalculate in case of resize then game init
        raceInProgress = false; clearInterval(raceInterval);
        raceTrack.innerHTML = '<div class="finish-line"></div>';
        if(horseSelectionArea) horseSelectionArea.innerHTML = ''; if(insightHorsesSelection) insightHorsesSelection.innerHTML = '';
        if(insightChoiceArea) insightChoiceArea.style.display = 'none';
        horses = []; let availableEmojis = [...HORSE_EMOJIS]; let availableNames = [...HORSE_NAMES];
        for (let i = 0; i < numHorsesInRace; i++) {
            const horseName = availableNames.length > i ? availableNames[i] : `Runner ${i+1}`;
            const horseEmoji = availableEmojis.length > i ? availableEmojis[i] : '🐎';
            const laneDiv = document.createElement('div'); laneDiv.className = 'horse-lane';
            laneDiv.style.height = `${100 / numHorsesInRace}%`;
            const horseElement = document.createElement('div'); horseElement.className = 'horse';
            horseElement.id = `horse-${i}`; horseElement.textContent = horseEmoji; horseElement.style.left = '0px';
            laneDiv.appendChild(horseElement); raceTrack.appendChild(laneDiv);
            horses.push({ id: i, name: horseName, emoji: horseEmoji, element: horseElement, position: 0, laneDiv: laneDiv, speedFactor: Math.random() * 0.3 + 0.8 });
        }
        if (hasHorseUpgrade) {
            if(insightChoiceArea) insightChoiceArea.style.display = 'block'; if(horseSelectionArea) horseSelectionArea.style.display = 'none';
            let favoredHorses = [...horses].sort(() => 0.5 - Math.random()).slice(0, 2);
            if(horses.length < 2) favoredHorses = horses;
            favoredHorses.forEach(horse => {
                const radio = document.createElement('input'); radio.type = 'radio'; radio.id = `insight-horse-select-${horse.id}`;
                radio.name = 'selected-horse-insight'; radio.value = horse.id;
                const label = document.createElement('label'); label.htmlFor = `insight-horse-select-${horse.id}`; label.textContent = `${horse.emoji} ${horse.name}`;
                if(insightHorsesSelection) {insightHorsesSelection.appendChild(radio); insightHorsesSelection.appendChild(label); insightHorsesSelection.appendChild(document.createElement('br'));}
            });
            const firstInsightRadio = insightHorsesSelection ? insightHorsesSelection.querySelector('input[type="radio"]') : null;
            if(firstInsightRadio) firstInsightRadio.checked = true;
        } else {
            if(insightChoiceArea) insightChoiceArea.style.display = 'none'; if(horseSelectionArea) horseSelectionArea.style.display = 'block';
            horses.forEach((horse, index) => {
                const radio = document.createElement('input'); radio.type = 'radio'; radio.id = `horse-select-${horse.id}`;
                radio.name = 'selected-horse'; radio.value = horse.id; if (index === 0) radio.checked = true;
                const label = document.createElement('label'); label.htmlFor = `horse-select-${horse.id}`; label.textContent = `${horse.emoji} ${horse.name}`;
                if(horseSelectionArea) { horseSelectionArea.appendChild(radio); horseSelectionArea.appendChild(label); horseSelectionArea.appendChild(document.createElement('br')); }
            });
        }
        if(horseRaceResultDisplay) horseRaceResultDisplay.textContent = "Select a horse and place your bet!";
        if(startHorseRaceButton) startHorseRaceButton.disabled = false;
    }
    function startHorseRace() {
        if (raceInProgress || !horseBetAmountInputElement) return;
        const betAmount = parseInt(horseBetAmountInputElement.value);
        if (isNaN(betAmount) || betAmount <= 0) { if(horseRaceResultDisplay) horseRaceResultDisplay.textContent = "Valid bet."; return; }
        let selectedHorseId = null;
        let selectedHorseRadioName = (hasHorseUpgrade && insightChoiceArea && insightChoiceArea.style.display === 'block') ? 'selected-horse-insight' : 'selected-horse';
        const selectedRadio = document.querySelector(`input[name="${selectedHorseRadioName}"]:checked`);
        if (!selectedRadio) { if(horseRaceResultDisplay) horseRaceResultDisplay.textContent = "Select a horse."; return; }
        selectedHorseId = parseInt(selectedRadio.value);
        if (!deductGameCost(betAmount)) { if(horseRaceResultDisplay) horseRaceResultDisplay.textContent = "Not enough pts."; return; }
        raceInProgress = true; if(startHorseRaceButton) startHorseRaceButton.disabled = true;
        if(horseRaceResultDisplay) horseRaceResultDisplay.textContent = "And they're off! 🏇💨"; playSound('raceStartHorn');
        horses.forEach(horse => { horse.position = 0; horse.element.style.left = '0px'; horse.element.classList.remove('winner-animation'); horse.currentRaceSpeed = (Math.random() * 0.5 + 0.8) * horse.speedFactor; });
        raceInterval = setInterval(() => {
            if (!raceInProgress) { clearInterval(raceInterval); return; }
            let winner = null;
            horses.forEach(horse => {
                if (raceInProgress) {
                    const moveAmount = (Math.random() * 10 + 5) * horse.currentRaceSpeed;
                    horse.position += moveAmount; horse.element.style.left = `${Math.min(horse.position, FINISH_LINE_POSITION)}px`;
                    if (horse.position >= FINISH_LINE_POSITION) { winner = horse; raceInProgress = false; }
                }
            });
            if (winner) {
                clearInterval(raceInterval); if(startHorseRaceButton) startHorseRaceButton.disabled = false;
                if(horseRaceResultDisplay) horseRaceResultDisplay.textContent = `${winner.emoji} ${winner.name} wins!`; playSound('raceFinish');
                winner.element.classList.add('winner-animation');
                if (winner.id === selectedHorseId) {
                    const winnings = betAmount * (numHorsesInRace -1); addPoints(winnings); // addPoints handles overall mult.
                    if(horseRaceResultDisplay) horseRaceResultDisplay.textContent += ` You won ${Math.floor(winnings*pointMultiplier)} pts!`; playSound('winSound');
                } else { if(horseRaceResultDisplay) horseRaceResultDisplay.textContent += ` Better luck next time!`; playSound('loseSound');}
            }
        }, 100);
    }
    if (startHorseRaceButton) startHorseRaceButton.addEventListener('click', startHorseRace);

    // --- STOCK MARKET GAME ---
    const stocksTableBody = document.getElementById('stocks-table-body');
    const stockSymbolSelect = document.getElementById('stock-symbol-select');
    const stockQuantityInput = document.getElementById('stock-quantity-input');
    const buyStockButton = document.getElementById('buy-stock-button');
    const sellStockButton = document.getElementById('sell-stock-button');
    const portfolioTableBody = document.getElementById('portfolio-table-body');
    const totalPortfolioValueDisplay = document.getElementById('total-portfolio-value');
    const nextStockDayButton = document.getElementById('next-stock-day-button');
    const stockMarketMessage = document.getElementById('stock-market-message');
    const stockMarketDayDisplay = document.getElementById('stock-market-day');
    const stockNewsFlashDisplay = document.getElementById('stock-news-flash');
    let stockMarketDay = 0; let availableStocks = []; let playerPortfolio = {};
    const MIN_STOCK_PRICE = 1.00;
    const INITIAL_STOCKS_DATA = [
        { symbol: "AITE", name: "AI Tech", basePrice: 100, volatility: 0.05 }, { symbol: "GAMR", name: "Gamerz Inc", basePrice: 50, volatility: 0.12 },
        { symbol: "FOOD", name: "Foodie Co", basePrice: 75, volatility: 0.03 }, { symbol: "SOLR", name: "SolarFuture", basePrice: 120, volatility: 0.08 }
    ];
    function initStockMarketGame() {
        console.log("Stock Market initialized"); stockMarketDay = 0; availableStocks = []; playerPortfolio = loadPortfolio();
        INITIAL_STOCKS_DATA.forEach(s => availableStocks.push({ symbol: s.symbol, name: s.name, price: s.basePrice, prevPrice: s.basePrice, volatility: s.volatility, trend: 0, trendDuration: 0, trendStrength: 0.02 }));
        populateStockSymbolSelect(); updateStocksTable(); updatePortfolioTable();
        if(stockMarketMessage) stockMarketMessage.textContent = "Buy/sell stocks!";
        if(stockNewsFlashDisplay) stockNewsFlashDisplay.style.display = 'none'; if(stockMarketDayDisplay) stockMarketDayDisplay.textContent = stockMarketDay;
    }
    function populateStockSymbolSelect() {
        if (!stockSymbolSelect) return; stockSymbolSelect.innerHTML = '';
        availableStocks.forEach(stock => {
            const option = document.createElement('option'); option.value = stock.symbol;
            option.textContent = `${stock.symbol} (${stock.name})`; stockSymbolSelect.appendChild(option);
        });
    }
    function updateStocksTable() {
        if (!stocksTableBody) return; stocksTableBody.innerHTML = '';
        availableStocks.forEach(stock => {
            const row = stocksTableBody.insertRow(); row.insertCell().textContent = stock.symbol;
            row.insertCell().textContent = stock.name; const priceCell = row.insertCell();
            priceCell.textContent = stock.price.toFixed(2); const changeCell = row.insertCell();
            const change = stock.price - stock.prevPrice; const changePercent = (stock.prevPrice > 0) ? (change / stock.prevPrice) * 100 : 0;
            changeCell.textContent = `${change.toFixed(2)} (${changePercent.toFixed(2)}%)`;
            if (change > 0) { priceCell.className = 'price-up'; changeCell.className = 'price-up'; }
            else if (change < 0) { priceCell.className = 'price-down'; changeCell.className = 'price-down'; }
            row.insertCell().textContent = ""; // Action placeholder
        });
    }
    function updatePortfolioTable() {
        if (!portfolioTableBody || !totalPortfolioValueDisplay) return; portfolioTableBody.innerHTML = '';
        let currentTotalPortfolioValue = 0;
        for (const symbol in playerPortfolio) {
            if (playerPortfolio.hasOwnProperty(symbol)) {
                const holding = playerPortfolio[symbol]; const stock = availableStocks.find(s => s.symbol === symbol);
                if (!stock || holding.quantity <= 0) { delete playerPortfolio[symbol]; continue; }
                const row = portfolioTableBody.insertRow(); row.insertCell().textContent = symbol;
                row.insertCell().textContent = holding.quantity; row.insertCell().textContent = holding.avgBuyPrice.toFixed(2);
                row.insertCell().textContent = stock.price.toFixed(2); const currentInvestmentValue = holding.quantity * stock.price;
                row.insertCell().textContent = currentInvestmentValue.toFixed(2);
                const profitLoss = currentInvestmentValue - (holding.quantity * holding.avgBuyPrice);
                const profitLossCell = row.insertCell(); profitLossCell.textContent = profitLoss.toFixed(2);
                if (profitLoss > 0) profitLossCell.className = 'profit'; else if (profitLoss < 0) profitLossCell.className = 'loss';
                currentTotalPortfolioValue += currentInvestmentValue;
            }
        }
        totalPortfolioValueDisplay.textContent = currentTotalPortfolioValue.toFixed(2); savePortfolio();
    }
    function buyStock() {
        if(!stockSymbolSelect || !stockQuantityInput) return;
        const symbol = stockSymbolSelect.value; const quantity = parseInt(stockQuantityInput.value);
        const stock = availableStocks.find(s => s.symbol === symbol);
        if (!stock || isNaN(quantity) || quantity <= 0) { if(stockMarketMessage) stockMarketMessage.textContent = "Invalid selection."; return; }
        const cost = stock.price * quantity; if (!spendPoints(cost)) { if(stockMarketMessage) stockMarketMessage.textContent = "Not enough pts."; return; }
        if (!playerPortfolio[symbol]) playerPortfolio[symbol] = { quantity: 0, totalCost: 0, avgBuyPrice: 0 };
        const existingQuantity = playerPortfolio[symbol].quantity; const existingTotalCost = playerPortfolio[symbol].avgBuyPrice * existingQuantity;
        playerPortfolio[symbol].quantity += quantity; playerPortfolio[symbol].totalCost = existingTotalCost + cost;
        playerPortfolio[symbol].avgBuyPrice = playerPortfolio[symbol].totalCost / playerPortfolio[symbol].quantity;
        if(stockMarketMessage) stockMarketMessage.textContent = `Bought ${quantity} of ${symbol} for ${cost.toFixed(2)}.`; playSound('buyStockSound'); updatePortfolioTable();
    }
    function sellStock() {
         if(!stockSymbolSelect || !stockQuantityInput) return;
        const symbol = stockSymbolSelect.value; const quantityToSell = parseInt(stockQuantityInput.value);
        const stock = availableStocks.find(s => s.symbol === symbol);
        if (!stock || isNaN(quantityToSell) || quantityToSell <= 0) { if(stockMarketMessage) stockMarketMessage.textContent = "Invalid selection."; return; }
        if (!playerPortfolio[symbol] || playerPortfolio[symbol].quantity < quantityToSell) { if(stockMarketMessage) stockMarketMessage.textContent = "Not enough shares."; return; }
        const saleValue = stock.price * quantityToSell; addDirectPoints(saleValue); // Direct points, not game win
        playerPortfolio[symbol].quantity -= quantityToSell;
        if (playerPortfolio[symbol].quantity === 0) delete playerPortfolio[symbol];
        if(stockMarketMessage) stockMarketMessage.textContent = `Sold ${quantityToSell} of ${symbol} for ${saleValue.toFixed(2)}.`; playSound('sellStockSound'); updatePortfolioTable();
    }
    function advanceStockMarketDay() {
        stockMarketDay++; if(stockMarketDayDisplay) stockMarketDayDisplay.textContent = stockMarketDay;
        if(stockNewsFlashDisplay) stockNewsFlashDisplay.style.display = 'none';
        availableStocks.forEach(stock => {
            stock.prevPrice = stock.price;
            if (stock.trendDuration <= 0) {
                const trendChance = Math.random();
                if (trendChance < 0.3) stock.trend = -1; else if (trendChance < 0.6) stock.trend = 1; else stock.trend = 0;
                stock.trendDuration = Math.floor(Math.random() * 5) + 3;
            } else stock.trendDuration--;
            let priceChangePercent = (Math.random() * 2 - 1) * stock.volatility;
            priceChangePercent += stock.trend * stock.trendStrength;
            if (Math.random() < 0.03) { // Slightly increased news chance
                const newsImpact = (Math.random() * 0.20) - 0.10; priceChangePercent += newsImpact;
                if(stockNewsFlashDisplay) { stockNewsFlashDisplay.textContent = `NEWS: ${stock.name} ${newsImpact > 0 ? 'surges!' : 'tumbles!'}`; stockNewsFlashDisplay.style.display = 'block';}
                playSound('newsAlertSound');
            }
            stock.price += stock.price * priceChangePercent;
            stock.price = Math.max(stock.price, MIN_STOCK_PRICE); stock.price = parseFloat(stock.price.toFixed(2));
        });
        updateStocksTable(); updatePortfolioTable(); if(stockMarketMessage) stockMarketMessage.textContent = `Day ${stockMarketDay}. Prices updated.`;
    }
    function savePortfolio() { localStorage.setItem(PORTFOLIO_LS_KEY, JSON.stringify(playerPortfolio)); }
    function loadPortfolio() { const saved = localStorage.getItem(PORTFOLIO_LS_KEY); return saved ? JSON.parse(saved) : {}; }
    if(buyStockButton) buyStockButton.addEventListener('click', buyStock);
    if(sellStockButton) sellStockButton.addEventListener('click', sellStock);
    if(nextStockDayButton) nextStockDayButton.addEventListener('click', advanceStockMarketDay);

    // --- DICE GAME ---
    const dice1Display = document.getElementById('dice1');
    const dice2Display = document.getElementById('dice2');
    const diceSumDisplay = document.getElementById('dice-sum-display');
    const diceTargetSumSelectElement = document.getElementById('dice-target-sum-select'); // Unique ID
    const diceBetAmountInputElement = document.getElementById('dice-bet-amount-input'); // Unique ID
    const rollDiceButton = document.getElementById('roll-dice-button');
    const diceGameMessage = document.getElementById('dice-game-message');
    const selectedSumPayoutDisplay = document.getElementById('selected-sum-payout-display');
    const payoutRateDisplay = document.getElementById('payout-rate-display');
    let isDiceRolling = false;
    const DICE_SUM_PAYOUTS = { 2: 30, 3: 15, 4: 9, 5: 6, 6: 5, 7: 4, 8: 5, 9: 6, 10: 9, 11: 15, 12: 30 };
    function populateDiceTargetSumSelect() {
        if (!diceTargetSumSelectElement) return; diceTargetSumSelectElement.innerHTML = '';
        for (let i = 2; i <= 12; i++) {
            const option = document.createElement('option'); option.value = i; option.textContent = i;
            if (i === 7) option.selected = true; diceTargetSumSelectElement.appendChild(option);
        } updateDicePayoutInfo();
    }
    function updateDicePayoutInfo() {
        if (!diceTargetSumSelectElement || !selectedSumPayoutDisplay || !payoutRateDisplay) return;
        const selectedSum = parseInt(diceTargetSumSelectElement.value);
        const payoutMultiplier = DICE_SUM_PAYOUTS[selectedSum] || 0;
        selectedSumPayoutDisplay.textContent = selectedSum; payoutRateDisplay.textContent = payoutMultiplier;
    }
    function initDiceGame() {
        console.log("Dice Game initialized"); populateDiceTargetSumSelect(); isDiceRolling = false;
        if(dice1Display) dice1Display.textContent = '?'; if(dice2Display) dice2Display.textContent = '?';
        if(diceSumDisplay) diceSumDisplay.textContent = 'Total: ?';
        if(diceGameMessage) diceGameMessage.textContent = "Select target & bet!"; if(rollDiceButton) rollDiceButton.disabled = false;
    }
    function rollTheDice() {
        if (isDiceRolling || !diceTargetSumSelectElement || !diceBetAmountInputElement) return;
        const targetSum = parseInt(diceTargetSumSelectElement.value); const betAmount = parseInt(diceBetAmountInputElement.value);
        if (isNaN(targetSum)) { if(diceGameMessage) diceGameMessage.textContent = "Valid sum."; return; }
        if (isNaN(betAmount) || betAmount <= 0) { if(diceGameMessage) diceGameMessage.textContent = "Valid bet."; return; }
        if (!deductGameCost(betAmount)) { if(diceGameMessage) diceGameMessage.textContent = "Not enough pts."; return; }
        isDiceRolling = true; if(rollDiceButton) rollDiceButton.disabled = true; if(diceGameMessage) diceGameMessage.textContent = "Rolling..."; playSound('diceRollSound');
        let rollCount = 0; const maxRolls = 10;
        const rollInterval = setInterval(() => {
            const d1 = Math.floor(Math.random() * 6) + 1; const d2 = Math.floor(Math.random() * 6) + 1;
            if(dice1Display) dice1Display.textContent = d1; if(dice2Display) dice2Display.textContent = d2;
            if(diceSumDisplay) diceSumDisplay.textContent = `Total: ${d1 + d2}`; rollCount++;
            if (rollCount >= maxRolls) { clearInterval(rollInterval); finalizeDiceRoll(targetSum, betAmount); }
        }, 100);
    }
    function finalizeDiceRoll(targetSum, betAmount) {
        const die1Result = Math.floor(Math.random() * 6) + 1; const die2Result = Math.floor(Math.random() * 6) + 1;
        const actualSum = die1Result + die2Result;
        if(dice1Display) dice1Display.textContent = die1Result; if(dice2Display) dice2Display.textContent = die2Result; if(diceSumDisplay) diceSumDisplay.textContent = `Total: ${actualSum}`;
        const payoutMultiplier = DICE_SUM_PAYOUTS[targetSum] || 0;
        if (actualSum === targetSum) {
            const winningsProfit = betAmount * payoutMultiplier; const totalReturn = winningsProfit + betAmount;
            addDirectPoints(totalReturn); // Payout is directly added, no player multiplier
            if(diceGameMessage) diceGameMessage.textContent = `Rolled ${actualSum}! Win ${winningsProfit} (Total ${totalReturn} back)!`; playSound('winSound');
        } else { if(diceGameMessage) diceGameMessage.textContent = `Rolled ${actualSum}. Target ${targetSum}. No win.`; playSound('loseSound'); }
        isDiceRolling = false; if(rollDiceButton) rollDiceButton.disabled = false;
    }
    if (diceTargetSumSelectElement) diceTargetSumSelectElement.addEventListener('change', updateDicePayoutInfo);
    if (rollDiceButton) rollDiceButton.addEventListener('click', rollTheDice);

    // --- ROULETTE GAME ---
    const rouletteNumbersGrid = document.querySelector('#roulette-betting-table .numbers-grid');
    const rouletteSpinButton = document.getElementById('roulette-spin-button');
    const rouletteClearBetsButton = document.getElementById('roulette-clear-bets-button');
    const rouletteMessage = document.getElementById('roulette-message');
    const rouletteBetChipInputElement = document.getElementById('roulette-bet-amount-chip-input'); // Unique ID
    const rouletteTotalBetDisplay = document.getElementById('roulette-total-bet-display');
    const rouletteWinningNumberDisplay = document.getElementById('roulette-winning-number');
    const rouletteWheelDisplayAnim = document.getElementById('roulette-wheel-display');
    let currentRouletteBets = []; let isRouletteSpinning = false;
    const ROULETTE_NUMBERS_PROPERTIES = {0: { color: 'green' },1: { color: 'red', dozen: '1st12', column: 1, range: '1-18', evenOdd: 'odd' },2: { color: 'black', dozen: '1st12', column: 2, range: '1-18', evenOdd: 'even' },3: { color: 'red', dozen: '1st12', column: 3, range: '1-18', evenOdd: 'odd' },4: { color: 'black', dozen: '1st12', column: 1, range: '1-18', evenOdd: 'even' },5: { color: 'red', dozen: '1st12', column: 2, range: '1-18', evenOdd: 'odd' },6: { color: 'black', dozen: '1st12', column: 3, range: '1-18', evenOdd: 'even' },7: { color: 'red', dozen: '1st12', column: 1, range: '1-18', evenOdd: 'odd' },8: { color: 'black', dozen: '1st12', column: 2, range: '1-18', evenOdd: 'even' },9: { color: 'red', dozen: '1st12', column: 3, range: '1-18', evenOdd: 'odd' },10: { color: 'black', dozen: '1st12', column: 1, range: '1-18', evenOdd: 'even' },11: { color: 'black', dozen: '1st12', column: 2, range: '1-18', evenOdd: 'odd' },12: { color: 'red', dozen: '1st12', column: 3, range: '1-18', evenOdd: 'even' },13: { color: 'black', dozen: '2nd12', column: 1, range: '1-18', evenOdd: 'odd' },14: { color: 'red', dozen: '2nd12', column: 2, range: '1-18', evenOdd: 'even' },15: { color: 'black', dozen: '2nd12', column: 3, range: '1-18', evenOdd: 'odd' },16: { color: 'red', dozen: '2nd12', column: 1, range: '1-18', evenOdd: 'even' },17: { color: 'black', dozen: '2nd12', column: 2, range: '1-18', evenOdd: 'odd' },18: { color: 'red', dozen: '2nd12', column: 3, range: '1-18', evenOdd: 'even' },19: { color: 'red', dozen: '2nd12', column: 1, range: '19-36', evenOdd: 'odd' },20: { color: 'black', dozen: '2nd12', column: 2, range: '19-36', evenOdd: 'even' },21: { color: 'red', dozen: '2nd12', column: 3, range: '19-36', evenOdd: 'odd' },22: { color: 'black', dozen: '2nd12', column: 1, range: '19-36', evenOdd: 'even' },23: { color: 'red', dozen: '2nd12', column: 2, range: '19-36', evenOdd: 'odd' },24: { color: 'black', dozen: '2nd12', column: 3, range: '19-36', evenOdd: 'even' },25: { color: 'red', dozen: '3rd12', column: 1, range: '19-36', evenOdd: 'odd' },26: { color: 'black', dozen: '3rd12', column: 2, range: '19-36', evenOdd: 'even' },27: { color: 'red', dozen: '3rd12', column: 3, range: '19-36', evenOdd: 'odd' },28: { color: 'black', dozen: '3rd12', column: 1, range: '19-36', evenOdd: 'even' },29: { color: 'black', dozen: '3rd12', column: 2, range: '19-36', evenOdd: 'odd' },30: { color: 'red', dozen: '3rd12', column: 3, range: '19-36', evenOdd: 'even' },31: { color: 'black', dozen: '3rd12', column: 1, range: '19-36', evenOdd: 'odd' },32: { color: 'red', dozen: '3rd12', column: 2, range: '19-36', evenOdd: 'even' },33: { color: 'black', dozen: '3rd12', column: 3, range: '19-36', evenOdd: 'odd' },34: { color: 'red', dozen: '3rd12', column: 1, range: '19-36', evenOdd: 'even' },35: { color: 'black', dozen: '3rd12', column: 2, range: '19-36', evenOdd: 'odd' },36: { color: 'red', dozen: '3rd12', column: 3, range: '19-36', evenOdd: 'even' }};
    function populateRouletteTable() {
        if (!rouletteNumbersGrid) return; rouletteNumbersGrid.innerHTML = '';
        for (let i = 1; i <= 36; i++) {
            const cell = document.createElement('div'); cell.classList.add('bet-cell', 'number');
            cell.textContent = i; cell.dataset.betType = 'number'; cell.dataset.betValue = i;
            const props = ROULETTE_NUMBERS_PROPERTIES[i];
            if (props.color === 'red') cell.classList.add('red'); else if (props.color === 'black') cell.classList.add('black');
            rouletteNumbersGrid.appendChild(cell);
        }
        const colBetContainer = rouletteNumbersGrid.parentElement.querySelector('.outside-bets-row1'); // Reference for column bets
        if(colBetContainer){ //Add Column bets if container exists
            for(let i=1; i<=3; i++) {
                const colCell = document.createElement('div'); colCell.classList.add('bet-cell', 'outside', 'column-bet');
                colCell.textContent = '2to1'; colCell.dataset.betType = 'column'; colCell.dataset.betValue = i; 
                // CSS will try to place these; they append after dozen bets currently
                colBetContainer.appendChild(colCell);
            }
        }
        document.querySelectorAll('#roulette-betting-table .bet-cell').forEach(cell => cell.addEventListener('click', handleRouletteBetPlacement));
    }
    function handleRouletteBetPlacement(event) {
        if (isRouletteSpinning || !rouletteBetChipInputElement) return;
        const cell = event.currentTarget; const betType = cell.dataset.betType; const betValue = cell.dataset.betValue;
        const betChipAmount = parseInt(rouletteBetChipInputElement.value);
        if (isNaN(betChipAmount) || betChipAmount <= 0) { if(rouletteMessage) rouletteMessage.textContent = "Valid chip amt."; return; }
        let existingBet = currentRouletteBets.find(b => b.type === betType && String(b.value) === String(betValue));
        if (existingBet) existingBet.amount += betChipAmount;
        else currentRouletteBets.push({ type: betType, value: betValue, amount: betChipAmount, cellElement: cell });
        updateTotalRouletteBet(); displayPlacedBetOnCell(cell, betType, betValue);
        if(rouletteMessage) rouletteMessage.textContent = `${betChipAmount} on ${betType} ${betValue}`;
    }
    function displayPlacedBetOnCell(cell, type, value) {
        let totalAmountOnCell = currentRouletteBets.filter(b => b.type === type && String(b.value) === String(value)).reduce((sum, b) => sum + b.amount, 0);
        let amountDisplay = cell.querySelector('.placed-bet-amount');
        if (!amountDisplay) { amountDisplay = document.createElement('span'); amountDisplay.className = 'placed-bet-amount'; cell.appendChild(amountDisplay); }
        if(totalAmountOnCell > 0) { amountDisplay.textContent = totalAmountOnCell; amountDisplay.style.display = 'block'; }
        else amountDisplay.style.display = 'none';
    }
    function updateTotalRouletteBet() {
        let total = currentRouletteBets.reduce((sum, bet) => sum + bet.amount, 0);
        if(rouletteTotalBetDisplay) rouletteTotalBetDisplay.textContent = total;
    }
    function clearRouletteBets() {
        if (isRouletteSpinning) return;
        currentRouletteBets.forEach(bet => { const display = bet.cellElement.querySelector('.placed-bet-amount'); if (display) display.style.display = 'none'; });
        currentRouletteBets = []; updateTotalRouletteBet(); if(rouletteMessage) rouletteMessage.textContent = "Bets cleared.";
    }
    function spinRouletteWheel() {
        if (isRouletteSpinning) return;
        if (currentRouletteBets.length === 0) { if(rouletteMessage) rouletteMessage.textContent = "Place bets!"; return; }
        const totalBetValue = parseInt(rouletteTotalBetDisplay ? rouletteTotalBetDisplay.textContent : '0');
        if (!deductGameCost(totalBetValue)) { if(rouletteMessage) rouletteMessage.textContent = "Not enough pts."; return; }
        isRouletteSpinning = true; if(rouletteMessage) rouletteMessage.textContent = "Spinning...";
        if(rouletteWheelDisplayAnim) rouletteWheelDisplayAnim.style.display = 'block'; if(rouletteWinningNumberDisplay) rouletteWinningNumberDisplay.textContent = '?';
        if(rouletteWinningNumberDisplay) rouletteWinningNumberDisplay.className = ''; if(rouletteSpinButton) rouletteSpinButton.disabled = true; if(rouletteClearBetsButton) rouletteClearBetsButton.disabled = true;
        playSound('rouletteWheelSpin');
        setTimeout(() => {
            const winningNumber = Math.floor(Math.random() * 37);
            if(rouletteWheelDisplayAnim) rouletteWheelDisplayAnim.style.display = 'none'; if(rouletteWinningNumberDisplay) rouletteWinningNumberDisplay.textContent = winningNumber;
            const props = ROULETTE_NUMBERS_PROPERTIES[winningNumber];
            if (props && rouletteWinningNumberDisplay) {
                if (props.color === 'red') rouletteWinningNumberDisplay.classList.add('win-red');
                else if (props.color === 'black') rouletteWinningNumberDisplay.classList.add('win-black');
                else if (props.color === 'green') rouletteWinningNumberDisplay.classList.add('win-green');
            }
            playSound('rouletteBallDrop'); calculateRouletteWinnings(winningNumber);
            isRouletteSpinning = false; if(rouletteSpinButton) rouletteSpinButton.disabled = false; if(rouletteClearBetsButton) rouletteClearBetsButton.disabled = false;
        }, 3000);
    }
    function calculateRouletteWinnings(winningNumber) {
        let totalWinningsThisSpin = 0; const winningProps = ROULETTE_NUMBERS_PROPERTIES[winningNumber];
        currentRouletteBets.forEach(bet => {
            let payoutMultiplier = 0; let isWin = false;
            switch (bet.type) {
                case 'number': if (parseInt(bet.value) === winningNumber) { payoutMultiplier = 35; isWin = true; } break;
                case 'color': if (winningProps && bet.value === winningProps.color) { payoutMultiplier = 1; isWin = true; } break;
                case 'evenOdd': if (winningNumber !== 0 && winningProps) { if (bet.value === 'even' && winningNumber % 2 === 0) isWin = true; if (bet.value === 'odd' && winningNumber % 2 !== 0) isWin = true; if (isWin) payoutMultiplier = 1; } break;
                case 'range': if (winningNumber !== 0 && winningProps) { if (bet.value === '1-18' && winningNumber <= 18) isWin = true; if (bet.value === '19-36' && winningNumber >= 19) isWin = true; if (isWin) payoutMultiplier = 1; } break;
                case 'dozen': if (winningNumber !== 0 && winningProps) { if (bet.value === '1st12' && winningNumber <= 12) isWin = true; if (bet.value === '2nd12' && winningNumber >= 13 && winningNumber <= 24) isWin = true; if (bet.value === '3rd12' && winningNumber >= 25) isWin = true; if (isWin) payoutMultiplier = 2; } break;
                case 'column': if (winningNumber !== 0 && winningProps) { const actualColumn = winningNumber % 3 === 0 ? 3 : winningNumber % 3; if (parseInt(bet.value) === actualColumn) { isWin = true; payoutMultiplier = 2; }} break;
            }
            if (isWin) totalWinningsThisSpin += bet.amount + (bet.amount * payoutMultiplier); // Stake back + profit
        });
        if (totalWinningsThisSpin > 0) {
            addDirectPoints(totalWinningsThisSpin); // Total returned is direct, no multiplier. Player has already paid from their balance
            if(rouletteMessage) rouletteMessage.textContent = `Win Number: ${winningNumber}! Total ${totalWinningsThisSpin} returned!`; playSound('winSound');
        } else { if(rouletteMessage) rouletteMessage.textContent = `Win Number: ${winningNumber}. No wins.`; playSound('loseSound'); }
    }
    if (rouletteSpinButton) rouletteSpinButton.addEventListener('click', spinRouletteWheel);
    if (rouletteClearBetsButton) rouletteClearBetsButton.addEventListener('click', clearRouletteBets);
    
    // --- WHEEL OF FORTUNE GAME ---
    const wofWheel = document.getElementById('wof-wheel');
    const wofSpinButtonElement = document.getElementById('wof-spin-button'); // Unique button name
    const wofMessage = document.getElementById('wof-message');
    const wofCostDisplay = document.getElementById('wof-cost-display');
    const WOF_COST_TO_SPIN = 25; let isWofSpinning = false; let wofSegments = []; let currentWofRotation = 0;
    const WOF_SEGMENT_DEFINITIONS = [ { text: "50 Pts", value: 50, type: 'points', color: '#FFD700' },{ text: "100 Pts", value: 100, type: 'points', color: '#FF8C00' },{ text: "Try Again", value: 0, type: 'nothing', color: '#A9A9A9' },{ text: "JACKPOT!", value: 500, type: 'jackpot', color: '#FF4500' },{ text: "25 Pts", value: 25, type: 'points', color: '#ADFF2F' },{ text: "Lose 10", value: -10, type: 'lose_points', color: '#DC143C' },{ text: "200 Pts", value: 200, type: 'points', color: '#00BFFF' },{ text: "Free Spin", value: 1, type: 'free_spin', color: '#DA70D6' },{ text: "75 Pts", value: 75, type: 'points', color: '#32CD32' },{ text: "Lose Turn", value: 0, type: 'nothing', color: '#708090' }];
    function getContrastColor(hexcolor){ if (!hexcolor) return '#000000'; hexcolor = hexcolor.replace("#", ""); var r = parseInt(hexcolor.substr(0,2),16); var g = parseInt(hexcolor.substr(2,2),16); var b = parseInt(hexcolor.substr(4,2),16); var yiq = ((r*299)+(g*587)+(b*114))/1000; return (yiq >= 128) ? '#000000' : '#FFFFFF'; }
    function createWheelSegments() {
        if (!wofWheel) return; wofWheel.innerHTML = ''; wofSegments = [];
        const numSegments = WOF_SEGMENT_DEFINITIONS.length; const anglePerSegment = 360 / numSegments;
        WOF_SEGMENT_DEFINITIONS.forEach((segmentDef, i) => {
            const segmentDiv = document.createElement('div'); segmentDiv.className = 'wof-segment';
            segmentDiv.style.backgroundColor = segmentDef.color || (i % 2 === 0 ? '#E0E0E0' : '#F8F8F8');
            segmentDiv.style.color = getContrastColor(segmentDef.color || (i % 2 === 0 ? '#E0E0E0' : '#F8F8F8'));
            const rotation = (i * anglePerSegment) - (anglePerSegment / 2) + 90;
            segmentDiv.style.transform = `rotate(${rotation}deg)`;
            const textSpan = document.createElement('span'); textSpan.textContent = segmentDef.text; segmentDiv.appendChild(textSpan);
            wofWheel.appendChild(segmentDiv);
            wofSegments.push({ ...segmentDef, minAngle: (i * anglePerSegment), maxAngle: ((i + 1) * anglePerSegment) });
        });
    }
    function initWheelOfFortuneGame() {
        console.log("Wheel of Fortune initialized"); createWheelSegments();
        if (wofCostDisplay) wofCostDisplay.textContent = WOF_COST_TO_SPIN; isWofSpinning = false;
        if (wofMessage) wofMessage.textContent = "Spin to win!"; if (wofSpinButtonElement) wofSpinButtonElement.disabled = false;
        if (wofWheel) wofWheel.style.transform = `rotate(${currentWofRotation}deg)`;
    }
    function spinTheWofWheel() {
        if (isWofSpinning) return;
        if (!deductGameCost(WOF_COST_TO_SPIN)) { if(wofMessage) wofMessage.textContent = `Not enough! Cost ${WOF_COST_TO_SPIN}.`; return; }
        isWofSpinning = true; if (wofSpinButtonElement) wofSpinButtonElement.disabled = true;
        if (wofMessage) wofMessage.textContent = "Spinning..."; playSound('wheelSpinningSound');
        const spinDuration = 4000; const randomExtraRotations = Math.floor(Math.random() * 3) + 3;
        const randomStopAngle = Math.floor(Math.random() * 360);
        currentWofRotation += (randomExtraRotations * 360) + randomStopAngle;
        if (wofWheel) { wofWheel.style.transition = `transform ${spinDuration / 1000}s cubic-bezier(0.25, 0.1, 0.25, 1)`; wofWheel.style.transform = `rotate(${currentWofRotation}deg)`;}
        setTimeout(() => {
            determineWofPrize(currentWofRotation); isWofSpinning = false;
            if (wofSpinButtonElement) wofSpinButtonElement.disabled = false;
        }, spinDuration);
    }
    function determineWofPrize(finalRotation) {
        const numSegments = wofSegments.length; const anglePerSegment = 360 / numSegments;
        let effectiveAngle = (360 - (finalRotation % 360)) % 360; let winningSegment = null;
        for (const segment of wofSegments) { if (effectiveAngle >= segment.minAngle && effectiveAngle < segment.maxAngle) { winningSegment = segment; break; }}
        if (!winningSegment) winningSegment = wofSegments[0]; // Fallback
        if (winningSegment && wofMessage) {
            wofMessage.textContent = `Landed on: ${winningSegment.text}!`; playSound('wheelPrizeSound');
            switch (winningSegment.type) {
                case 'points': addPoints(winningSegment.value); wofMessage.textContent += ` You win ${Math.floor(winningSegment.value * pointMultiplier)} pts!`; break;
                case 'jackpot': const jackpotAmount = winningSegment.value; addPoints(jackpotAmount); wofMessage.textContent += ` JACKPOT! Win ${Math.floor(jackpotAmount * pointMultiplier)} pts!`; playSound('jackpotWinSound'); break;
                case 'lose_points':
                    let pointsToLose = Math.abs(winningSegment.value);
                    if(playerPoints - pointsToLose < MINIMUM_POINTS && playerPoints >= MINIMUM_POINTS){
                        let actualLoss = playerPoints - MINIMUM_POINTS;
                        playerPoints = MINIMUM_POINTS;
                         wofMessage.textContent += ` Oh no! Lost ${actualLoss} pts (Kept at ${MINIMUM_POINTS}).`;
                    } else if (playerPoints - pointsToLose >= 0) { // ensure not making points negative directly
                         playerPoints -= pointsToLose;
                         wofMessage.textContent += ` Oh no! Lost ${pointsToLose} pts.`;
                    } else { // Player has less than pointsToLose and will hit 0 or MINIMUM
                        let loss = playerPoints > MINIMUM_POINTS ? playerPoints - MINIMUM_POINTS : 0; // what they can actually lose above min
                        playerPoints = MINIMUM_POINTS;
                         wofMessage.textContent += ` Oh no! Lost ${loss} pts (Kept at ${MINIMUM_POINTS}).`;
                    }
                    updatePointsDisplay();
                    break;
                case 'free_spin': wofMessage.textContent += ` Free Spin! (Not fully implemented - spin again normally)`; break; // Placeholder behavior
                case 'nothing': wofMessage.textContent += ` Better luck next time!`; break;
            }
        } else if (wofMessage) wofMessage.textContent = "Spin again!";
    }
    if (wofSpinButtonElement) wofSpinButtonElement.addEventListener('click', spinTheWofWheel);


    // --- MAIN INITIALIZATION & NAVIGATION ---
    function init() {
        loadGameState();
        updatePointsDisplay();
        updateShopDisplay();
        showScreen('start-screen');
        updateAllGamePointDisplays();
    }

    playButton.addEventListener('click', () => showScreen('main-menu-screen'));

    menuButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetScreenId = button.getAttribute('data-screen');
            showScreen(targetScreenId);
            if (targetScreenId === 'slots-screen') initSlotsGame();
            else if (targetScreenId === 'plinko-screen') initPlinkoGame();
            else if (targetScreenId === 'blackjack-screen') initBlackjackGame();
            else if (targetScreenId === 'poker-screen') initPokerGame();
            else if (targetScreenId === 'scratch-cards-screen') initScratchCardsGame();
            else if (targetScreenId === 'horse-races-screen') initHorseRacesGame();
            else if (targetScreenId === 'stock-market-screen') initStockMarketGame();
            else if (targetScreenId === 'dice-game-screen') initDiceGame();
            else if (targetScreenId === 'roulette-screen') initRouletteGame();
            else if (targetScreenId === 'wheel-of-fortune-screen') initWheelOfFortuneGame();
            // Shop doesn't need an initGame usually, content is static or updates with global state
        });
    });

    backToMenuButtons.forEach(button => {
        button.addEventListener('click', () => showScreen('main-menu-screen'));
    });

    init(); // Start the application
});
