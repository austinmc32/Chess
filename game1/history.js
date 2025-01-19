// Load and display game history
document.addEventListener('DOMContentLoaded', () => {
    displayGameHistory();
    populateGameSelection(); // Populate the game selection dropdown

    document.getElementById('clear-history').addEventListener('click', clearHistory);
    document.getElementById('select-game').addEventListener('change', loadSelectedGame);
    document.getElementById('start-simulation').addEventListener('click', startSimulation);
    document.getElementById('reset-simulation').addEventListener('click', resetSimulation);
});

function displayGameHistory() {
    const historyList = document.getElementById('game-history-list');
    const savedGames = JSON.parse(localStorage.getItem('chessGameHistory') || '[]');
    
    if (savedGames.length === 0) {
        historyList.innerHTML = '<li>No games found.</li>';
        return;
    }
    
    savedGames.forEach(game => {
        const listItem = document.createElement('li');
        listItem.textContent = `${game.date} - ${game.result}`;
        historyList.appendChild(listItem);
    });
}

function clearHistory() {
    if (confirm('Are you sure you want to clear the game history?')) {
        localStorage.removeItem('chessGameHistory');
        displayGameHistory();
    }
}

function populateGameSelection() {
    const selectGame = document.getElementById('select-game');
    const savedGames = JSON.parse(localStorage.getItem('chessGameHistory') || '[]');
    
    savedGames.forEach((game, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${game.date} - ${game.result}`;
        selectGame.appendChild(option);
    });
}

function loadSelectedGame(event) {
    const gameIndex = event.target.value;
    if (gameIndex === "") {
        clearGameDetails();
        return;
    }

    const savedGames = JSON.parse(localStorage.getItem('chessGameHistory') || '[]');
    const selectedGame = savedGames[gameIndex];
    
    displayMoveList(selectedGame.moves);
    initializeSimulatedBoard();
}

function displayMoveList(moves) {
    const moveList = document.getElementById('move-list');
    moveList.innerHTML = ''; // Clear existing moves

    moves.forEach((move, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${index + 1}. ${move.notation}`;
        moveList.appendChild(listItem);
    });
}

let simulatedBoardInitialized = false;

function initializeSimulatedBoard() {
    if (simulatedBoardInitialized) {
        resetSimulatedBoard();
    } else {
        initializeSimulatedChessboard();
        simulatedBoardInitialized = true;
    }
}

function initializeSimulatedChessboard() {
    const simulatedBoard = document.getElementById('simulated-chessboard');
    simulatedBoard.innerHTML = ''; // Clear any existing board

    for (let i = 0; i < 64; i++) {
        const tile = document.createElement('div');
        tile.className = (Math.floor(i / 8) + i) % 2 === 0 ? 'white-tile' : 'black-tile';
        tile.id = `sim-tile-${i}`;
        simulatedBoard.appendChild(tile);
    }

    placePiecesOnSimulatedBoard();
}

function placePiecesOnSimulatedBoard() {
    const initialPieces = [
        '\u265C', '\u265E', '\u265D', '\u265B', '\u265A', '\u265D', '\u265E', '\u265C', // Black pieces
        '\u265F', '\u265F', '\u265F', '\u265F', '\u265F', '\u265F', '\u265F', '\u265F', // Black pawns
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '',
        '\u2659', '\u2659', '\u2659', '\u2659', '\u2659', '\u2659', '\u2659', '\u2659', // White pawns
        '\u2656', '\u2658', '\u2657', '\u2655', '\u2654', '\u2657', '\u2658', '\u2656'  // White pieces
    ];

    initialPieces.forEach((piece, i) => {
        if (piece) {
            const tile = document.getElementById(`sim-tile-${i}`);
            const pieceElement = document.createElement('div');
            pieceElement.className = i < 16 ? 'black-piece' : 'white-piece';
            pieceElement.textContent = piece;
            tile.appendChild(pieceElement);
        }
    });
}

let simulationIndex = 0;
let simulationInterval = null;

function startSimulation() {
    const selectGame = document.getElementById('select-game');
    const gameIndex = selectGame.value;
    if (gameIndex === "") {
        alert('Please select a game to simulate.');
        return;
    }

    const savedGames = JSON.parse(localStorage.getItem('chessGameHistory') || '[]');
    const selectedGame = savedGames[gameIndex];
    const moves = selectedGame.moves;

    if (!moves || moves.length === 0) {
        alert('No moves to simulate.');
        return;
    }

    simulationIndex = 0;
    simulationInterval = setInterval(() => {
        if (simulationIndex >= moves.length) {
            clearInterval(simulationInterval);
            return;
        }
        applyMoveToSimulatedBoard(moves[simulationIndex]);
        simulationIndex++;
    }, 1000); // Adjust the speed as needed
}

function applyMoveToSimulatedBoard(move) {
    if (!move.from || !move.to) {
        console.error('Move data is incomplete:', move);
        return;
    }

    const fromTile = convertChessNotationToIndex(move.from);
    const toTile = convertChessNotationToIndex(move.to);

    const fromSimTile = document.getElementById(`sim-tile-${fromTile}`);
    const toSimTile = document.getElementById(`sim-tile-${toTile}`);

    const piece = fromSimTile.querySelector('.white-piece, .black-piece');
    if (piece) {
        toSimTile.appendChild(piece);
    } else {
        console.warn(`No piece found on tile-${fromTile} to move.`);
    }
}

// Update convertChessNotationToIndex to handle invalid notation gracefully
function convertChessNotationToIndex(notation) {
    if (typeof notation !== 'string' || notation.length !== 2) {
        console.error('Invalid notation:', notation);
        return -1;
    }

    const fileChar = notation.charAt(0).toLowerCase();
    const rankChar = notation.charAt(1);

    const file = fileChar.charCodeAt(0) - 97; // 'a' = 97
    const rank = 8 - parseInt(rankChar, 10);

    if (isNaN(file) || isNaN(rank) || file < 0 || file > 7 || rank < 0 || rank > 7) {
        console.error('Invalid notation values:', notation);
        return -1;
    }

    return rank * 8 + file;
}

function resetSimulation() {
    clearInterval(simulationInterval);
    simulationIndex = 0;
    initializeSimulatedBoard();
}

function clearGameDetails() {
    document.getElementById('move-list').innerHTML = '';
    if (simulatedBoardInitialized) {
        resetSimulation();
    }
}

function displayMoveHistory() {
    // Only show moves if we're not in replay mode
    if (isReplaying) return;

    const historyElement = document.getElementById('move-history');
    const movesToShow = showFullHistory ? moveHistory : moveHistory.slice(-5);

    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();

    movesToShow.forEach((move, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${index + 1}. ${move.notation}`;
        fragment.appendChild(listItem);
    });

    // Replace the existing list with the new fragment
    historyElement.innerHTML = ''; // Clear existing moves
    historyElement.appendChild(fragment);

    const toggleButton = document.getElementById('toggle-move-history');
    toggleButton.textContent = showFullHistory ? 'Show Last 5 Moves' : 'Show Full History';
}