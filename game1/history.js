// Load and display game history
document.addEventListener('DOMContentLoaded', () => {
    displayGameHistory();
    populateGameSelection(); // Populate the game selection dropdown

    document.getElementById('clear-history').addEventListener('click', clearHistory);
    document.getElementById('select-game').addEventListener('change', loadSelectedGame);
    document.getElementById('start-simulation').addEventListener('click', startSimulation);
    document.getElementById('reset-simulation').addEventListener('click', resetSimulation);
    document.getElementById('next-move').addEventListener('click', nextMove);
    document.getElementById('prev-move').addEventListener('click', previousMove);
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
    moveList.innerHTML = '';

    moves.forEach((move, index) => {
        const listItem = document.createElement('li');
        const moveNumber = Math.floor(index / 2) + 1;
        const isWhiteMove = index % 2 === 0;
        
        // Format: "1. ♙e2→e4" or "1... ♟e7→e5"
        const notation = move.notation;
        const from = move.from || '';
        const to = move.to || '';
        const isCapture = notation.includes('x');
        
        let formattedMove = `${moveNumber}${isWhiteMove ? '.' : '...'} `;
        formattedMove += `${notation.charAt(0)} ${from}→${to}`;
        if (isCapture) formattedMove += ' (capture)';
        if (move.isCheck) formattedMove += ' +';
        if (move.isCheckmate) formattedMove += ' #';
        
        listItem.textContent = formattedMove;
        listItem.style.color = isWhiteMove ? '#000' : '#666';
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
    clearInterval(simulationInterval);
    simulationInterval = setInterval(() => {
        if (simulationIndex >= moves.length) {
            clearInterval(simulationInterval);
            return;
        }
        applyMoveToSimulatedBoard(moves[simulationIndex]);
        simulationIndex++;
        updateNavigationButtons(moves.length);
    }, 1000); // Adjust the speed as needed
}

function applyMoveToSimulatedBoard(move) {
    // Handle checkmate moves
    if (move.isCheckmate) {
        const from = move.from;
        const to = move.to;
        
        if (!from || !to) {
            // Try to extract from notation (e.g., "♛h4")
            const notation = move.notation;
            const dest = notation.match(/[a-h][1-8]/)?.[0];
            if (!dest) {
                console.error('Cannot parse checkmate move:', move);
                return;
            }
            
            // Find the piece that made the checkmate
            const pieces = document.querySelectorAll('#simulated-chessboard .white-piece, #simulated-chessboard .black-piece');
            const checkmatePiece = Array.from(pieces).find(p => p.textContent === notation.charAt(0));
            if (!checkmatePiece) {
                console.error('Checkmate piece not found:', notation.charAt(0));
                return;
            }

            const fromTile = checkmatePiece.parentElement;
            const toTile = document.getElementById(`sim-tile-${convertChessNotationToIndex(dest)}`);
            
            if (fromTile && toTile) {
                // Handle capture if present
                const capturedPiece = toTile.querySelector('.white-piece, .black-piece');
                if (capturedPiece) toTile.removeChild(capturedPiece);
                
                // Move the piece
                toTile.appendChild(checkmatePiece);
                
                // Add special checkmate highlighting
                document.querySelectorAll('.move-from, .move-to, .checkmate-move').forEach(el => {
                    el.classList.remove('move-from', 'move-to', 'checkmate-move');
                });
                fromTile.classList.add('move-from');
                toTile.classList.add('move-to', 'checkmate-move');
                
                // Update move list highlighting
                updateMoveHighlight(true);
            }
            return;
        }
    }

    // Handle regular moves
    const notation = move.notation;
    const from = move.from;
    const to = move.to;

    if (!from || !to) {
        console.error('Move lacks from/to information:', move);
        return;
    }

    // Highlight the source and destination squares
    const fromTile = document.getElementById(`sim-tile-${convertChessNotationToIndex(from)}`);
    const toTile = document.getElementById(`sim-tile-${convertChessNotationToIndex(to)}`);

    // Remove previous highlights
    document.querySelectorAll('.move-from, .move-to').forEach(el => {
        el.classList.remove('move-from', 'move-to');
    });

    // Add new highlights
    fromTile?.classList.add('move-from');
    toTile?.classList.add('move-to');

    // Handle capture
    if (notation.includes('x')) {
        const existingPiece = toTile?.querySelector('.white-piece, .black-piece');
        if (existingPiece) {
            toTile.removeChild(existingPiece);
        }
    }

    // Move the piece
    const movingPiece = fromTile?.querySelector('.white-piece, .black-piece');
    if (movingPiece && toTile) {
        toTile.appendChild(movingPiece);
    }

    // Update move list highlighting
    updateMoveHighlight();
}

// Helper function to update move highlighting
function updateMoveHighlight(isCheckmate = false) {
    const moveList = document.getElementById('move-list');
    const moves = moveList.getElementsByTagName('li');
    Array.from(moves).forEach((move, index) => {
        move.classList.remove('current-move');
        if (index === simulationIndex) {
            move.classList.add('current-move');
            if (isCheckmate) move.classList.add('checkmate');
            move.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
}

// Add CSS for checkmate highlight
const style = document.createElement('style');
style.innerHTML = `
    .checkmate-move {
        background-color: rgba(255, 0, 0, 0.3) !important;
        border: 3px solid red !important;
        animation: checkmate-pulse 2s infinite;
    }
    
    @keyframes checkmate-pulse {
        0% { border-color: red; }
        50% { border-color: #ff8080; }
        100% { border-color: red; }
    }
`;
document.head.appendChild(style);

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
    updateNavigationButtons(
        document.getElementById('select-game').value ? 
        JSON.parse(localStorage.getItem('chessGameHistory') || '[]')[document.getElementById('select-game').value].moves.length : 
        0
    );
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

function nextMove() {
    const selectGame = document.getElementById('select-game');
    const gameIndex = selectGame.value;
    if (gameIndex === "") return;

    const savedGames = JSON.parse(localStorage.getItem('chessGameHistory') || '[]');
    const moves = savedGames[gameIndex].moves;

    if (simulationIndex < moves.length) {
        applyMoveToSimulatedBoard(moves[simulationIndex]);
        simulationIndex++;
        updateNavigationButtons(moves.length);
    }
}

function previousMove() {
    if (simulationIndex > 0) {
        simulationIndex--;
        // Reset board and replay up to current index
        initializeSimulatedBoard();
        const selectGame = document.getElementById('select-game');
        const gameIndex = selectGame.value;
        const savedGames = JSON.parse(localStorage.getItem('chessGameHistory') || '[]');
        const moves = savedGames[gameIndex].moves;
        
        for (let i = 0; i < simulationIndex; i++) {
            applyMoveToSimulatedBoard(moves[i]);
        }
        updateNavigationButtons(moves.length);
    }
}

function updateNavigationButtons(totalMoves) {
    const prevButton = document.getElementById('prev-move');
    const nextButton = document.getElementById('next-move');
    
    prevButton.disabled = simulationIndex === 0;
    nextButton.disabled = simulationIndex >= totalMoves;
}