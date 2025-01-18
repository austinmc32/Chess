// Initialize the chessboard
function initializeBoard() {
    const board = document.getElementById('chessboard');
    board.innerHTML = ''; // Clear any existing content

    for (let i = 0; i < 64; i++) {
        const tile = document.createElement('div');
        tile.className = (Math.floor(i / 8) + i) % 2 === 0 ? 'white-tile' : 'black-tile';
        tile.id = `tile-${i}`;
        board.appendChild(tile);
    }
}

// Place the pieces on the board
function placePieces() {
    const pieces = [
        '\u265C', '\u265E', '\u265D', '\u265B', '\u265A', '\u265D', '\u265E', '\u265C', // Black pieces
        '\u265F', '\u265F', '\u265F', '\u265F', '\u265F', '\u265F', '\u265F', '\u265F', // Black pawns
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '',
        '\u2659', '\u2659', '\u2659', '\u2659', '\u2659', '\u2659', '\u2659', '\u2659', // White pawns
        '\u2656', '\u2658', '\u2657', '\u2655', '\u2654', '\u2657', '\u2658', '\u2656'  // White pieces
    ];

    for (let i = 0; i < 64; i++) {
        const tile = document.getElementById(`tile-${i}`);
        const piece = pieces[i];
        if (piece) {
            const pieceElement = document.createElement('div');
            pieceElement.className = i < 16 ? 'black-piece' : 'white-piece'; // Black pieces on top
            pieceElement.textContent = piece;
            tile.appendChild(pieceElement);
        }
    }
}

let selectedPiece = null;
let selectedTile = null;
let isWhiteTurn = true; // White goes first
let moveHistory = [];
let lastMoves = []; // Track the last few moves to avoid repetition
let isCheckingForCheckmate = false;
let hintManager;
let showFullHistory = false;

// Handle piece click events
function onPieceClick(event) {
    const piece = event.target;
    const tile = piece.parentElement;

    if (selectedPiece) {
        // Try to move the piece
        if (isValidMove(selectedTile, tile)) {
            movePiece(selectedTile, tile);
            clearAllSelectedTiles(); // remove all tile highlights
            clearPotentialMoves(); // Clear potential moves
            selectedPiece = null;
            selectedTile = null;
            displayMessage(''); // Clear message on valid move
            isWhiteTurn = !isWhiteTurn; // Switch turn
            displayTurn(); // Display whose turn it is
        } else {
            clearAllSelectedTiles(); // remove all tile highlights
            clearPotentialMoves(); // Clear potential moves
            selectedPiece = null;
            selectedTile = null;
            displayMessage('Invalid move!'); // Display invalid move message
        }
    } else {
        // Select a piece
        if ((isWhiteTurn && piece.classList.contains('white-piece')) || (!isWhiteTurn && piece.classList.contains('black-piece'))) {
            selectedPiece = piece;
            selectedTile = tile;
            tile.classList.add('selected'); // highlight the tile
            showPotentialMoves(tile); // Show potential moves
        } else {
            displayMessage('Not your turn!'); // Display turn message
        }
    }
}
function getPositionFromTile(tile) {
    if (!tile || !tile.id) return null;
    const index = parseInt(tile.id.split('-')[1]);
    if (isNaN(index)) return null;
    
    return {
        row: Math.floor(index / 8),
        col: index % 8
    };
}
function isValidMove(fromTile, toTile) {
    const pieceElement = fromTile.querySelector('.white-piece, .black-piece');
    if (!pieceElement) return false;
    
    const piece = pieceElement.textContent;
    const isWhite = pieceElement.classList.contains('white-piece');
    
    const fromIndex = parseInt(fromTile.id.split('-')[1]);
    const toIndex = parseInt(toTile.id.split('-')[1]);
    
    const fromRow = Math.floor(fromIndex / 8);
    const fromCol = fromIndex % 8;
    const toRow = Math.floor(toIndex / 8);
    const toCol = toIndex % 8;
    
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    
    // Basic boundary checks
    if (fromRow < 0 || fromRow > 7 || fromCol < 0 || fromCol > 7 ||
        toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) {
        return false;
    }
    
    // Prevent capturing own pieces
    const targetPiece = toTile.querySelector('.white-piece, .black-piece');
    if (targetPiece && targetPiece.classList.contains(isWhite ? 'white-piece' : 'black-piece')) {
        return false;
    }
    
    // Check for pieces in the path for non-knight moves
    if (piece !== '\u2658' && piece !== '\u265E') {
        const fromPos = getPositionFromTile(fromTile);
        const toPos = getPositionFromTile(toTile);
        
        if (!fromPos || !toPos || !isPathClear(fromPos.row, fromPos.col, toPos.row, toPos.col)) {
            return false;
        }
    }
    
    let isValidPieceMove = false;
    
    switch (piece) {
        case '\u2659': // White pawn
            if (isWhite) {
                // Forward moves
                if (colDiff === 0 && !targetPiece) {
                    if (toRow === fromRow - 1) isValidPieceMove = true; // Single move
                    if (fromRow === 6 && toRow === 4) isValidPieceMove = true; // Initial double move
                }
                // Diagonal captures
                if (toRow === fromRow - 1 && Math.abs(colDiff) === 1 && targetPiece && targetPiece.classList.contains('black-piece')) {
                    isValidPieceMove = true;
                }
            }
            break;
            
        case '\u265F': // Black pawn
            if (!isWhite) {
                // Forward moves
                if (colDiff === 0 && !targetPiece) {
                    if (toRow === fromRow + 1) isValidPieceMove = true; // Single move
                    if (fromRow === 1 && toRow === 3) isValidPieceMove = true; // Initial double move
                }
                // Diagonal captures
                if (toRow === fromRow + 1 && Math.abs(colDiff) === 1 && targetPiece && targetPiece.classList.contains('white-piece')) {
                    isValidPieceMove = true;
                }
            }
            break;
            
        case '\u2656': // Rook
        case '\u265C':
            isValidPieceMove = (rowDiff === 0 || colDiff === 0);
            break;
            
        case '\u2658': // Knight
        case '\u265E':
            isValidPieceMove = (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
            break;
            
        case '\u2657': // Bishop
        case '\u265D':
            isValidPieceMove = (rowDiff === colDiff);
            break;
            
        case '\u2655': // Queen
        case '\u265B':
            isValidPieceMove = (rowDiff === colDiff || rowDiff === 0 || colDiff === 0);
            break;
            
        case '\u2654': // King
        case '\u265A':
            // Normal king moves
            if (rowDiff <= 1 && colDiff <= 1) {
                isValidPieceMove = true;
            }
            // Castling
            else if (rowDiff === 0 && colDiff === 2) {
                // Additional castling logic can be added here
                isValidPieceMove = true;
            }
            break;
    }
    
    if (!isValidPieceMove) return false;
    
    // If this is a king move, verify it doesn't put the king in check
    if (piece === '\u2654' || piece === '\u265A') {
        // Temporarily make the move
        const originalPieceInTarget = toTile.querySelector('.white-piece, .black-piece');
        if (originalPieceInTarget) {
            toTile.removeChild(originalPieceInTarget);
        }
        toTile.appendChild(pieceElement);
        
        // Check if the move puts the king in check
        const inCheck = isKingInCheck(isWhite);
        
        // Undo the temporary move
        fromTile.appendChild(pieceElement);
        if (originalPieceInTarget) {
            toTile.appendChild(originalPieceInTarget);
        }
        
        if (inCheck) return false;
    }
    
    return true;
}

// Check if the path between two tiles is clear
function isPathClear(fromRow, fromCol, toRow, toCol) {
    const rowStep = Math.sign(toRow - fromRow);
    const colStep = Math.sign(toCol - fromCol);

    let currentRow = fromRow + rowStep;
    let currentCol = fromCol + colStep;

    while (currentRow !== toRow || currentCol !== toCol) {
        // Boundary checks
        if (currentRow < 0 || currentRow >= 8 || currentCol < 0 || currentCol >= 8) {
            console.error(`Row or column index out of bounds: row-${currentRow}, col-${currentCol}`);
            return false; // Path is not clear if the row or column index is out of bounds
        }

        const tileIndex = currentRow * 8 + currentCol;
        console.log(`Checking tile: tile-${tileIndex}`); // Debugging information
        const tile = document.getElementById(`tile-${tileIndex}`);
        if (!tile) {
            console.error(`Tile not found: tile-${tileIndex}`); // Debugging information
            return false; // Path is not clear if the tile does not exist
        }
        if (tile.querySelector('.white-piece, .black-piece')) {
            return false; // Path is not clear
        }
        currentRow += rowStep;
        currentCol += colStep;
    }

    return true; // Path is clear
}

function movePiece(fromTile, toTile) {
    const piece = fromTile.querySelector('.white-piece, .black-piece');
    if (!piece) return;

    const fromIndex = parseInt(fromTile.id.split('-')[1]);
    const toIndex = parseInt(toTile.id.split('-')[1]);
    const fromRow = Math.floor(fromIndex / 8);
    const fromCol = fromIndex % 8;
    const toCol = toIndex % 8;

    // Handle castling
    if ((piece.textContent === '\u2654' || piece.textContent === '\u265A') && Math.abs(toCol - fromCol) === 2) {
        // Determine rook's position and new position
        const isKingSide = toCol > fromCol;
        const rookFromCol = isKingSide ? 7 : 0;
        const rookToCol = isKingSide ? toCol - 1 : toCol + 1;
        const rookFromTile = document.getElementById(`tile-${fromRow * 8 + rookFromCol}`);
        const rookToTile = document.getElementById(`tile-${fromRow * 8 + rookToCol}`);
        const rook = rookFromTile.querySelector('.white-piece, .black-piece');

        if (rook) {
            rookToTile.appendChild(rook);
        }
    }

    // Handle regular piece movement and capture
    const capturedPiece = toTile.querySelector('.white-piece, .black-piece');
    let moveNotation = '';

    if (capturedPiece) {
        if (capturedPiece.textContent === '\u2654' || capturedPiece.textContent === '\u265A') {
            displayGameOver(`${capturedPiece.classList.contains('white-piece') ? 'Black' : 'White'} wins!`);
            return;
        }
        toTile.removeChild(capturedPiece);
        moveNotation = `${piece.textContent}x${indexToChessNotation(toIndex)}`;
    } else {
        moveNotation = `${piece.textContent}${indexToChessNotation(toIndex)}`;
    }

    toTile.appendChild(piece);
    clearKingInCheck();

    // Check for check/checkmate conditions
    if (isKingInCheck(!isWhiteTurn)) {
        highlightKingInCheck(!isWhiteTurn);
        if (isKingInCheckmate(!isWhiteTurn)) {
            displayGameOver(`${!isWhiteTurn ? 'White' : 'Black'} wins by checkmate!`);
            moveHistory.push({ notation: `${moveNotation}#`, isCheck: true, isCheckmate: true });
        } else {
            moveHistory.push({ notation: `${moveNotation}+`, isCheck: true });
        }
    } else {
        moveHistory.push({ notation: moveNotation });
    }

    // Track the move to avoid repetition
    lastMoves.push({ from: fromTile.id, to: toTile.id });
    if (lastMoves.length > 4) {
        lastMoves.shift();
    }

    displayMoveHistory(); // Update the move history display
    isWhiteTurn = !isWhiteTurn; // Switch turn
    displayTurn(); // Display whose turn it is
}

// Clear hint highlight
function clearHintHighlight() {
    const hintFrom = document.querySelector('.hint-from');
    const hintTo = document.querySelector('.hint-to');
    if (hintFrom) {
        hintFrom.classList.remove('hint-from');
    }
    if (hintTo) {
        hintTo.classList.remove('hint-to');
    }
}

// Handle tile click events
function onTileClick(event) {
    const tile = event.target.closest('.white-tile, .black-tile');
    if (!tile) return;

    if (selectedPiece) {
        // Try to move the piece
        if (isValidMove(selectedTile, tile)) {
            movePiece(selectedTile, tile);
            clearAllSelectedTiles(); // remove all tile highlights
            clearPotentialMoves(); // Clear potential moves
            selectedPiece = null;
            selectedTile = null;
            displayMessage(''); // Clear message on valid move
        } else {
            clearAllSelectedTiles(); // remove all tile highlights
            clearPotentialMoves(); // Clear potential moves
            selectedPiece = null;
            selectedTile = null;
            displayMessage('Invalid move!'); // Display invalid move message
        }
    } else {
        // Select a piece
        const piece = tile.querySelector('.white-piece, .black-piece');
        if (piece) {
            if ((isWhiteTurn && piece.classList.contains('white-piece')) || (!isWhiteTurn && piece.classList.contains('black-piece'))) {
                selectedPiece = piece;
                selectedTile = tile;
                tile.classList.add('selected'); // highlight the tile
                showPotentialMoves(tile); // Show potential moves
            } else {
                displayMessage('Not your turn!'); // Display turn message
            }
        }
    }
}

// Show potential move locations
function showPotentialMoves(tile) {
    const fromIndex = parseInt(tile.id.split('-')[1]);
    const piece = tile.querySelector('.white-piece, .black-piece').textContent;
    const isWhite = tile.querySelector('.white-piece') !== null;

    for (let i = 0; i < 64; i++) {
        const toTile = document.getElementById(`tile-${i}`);
        if (isValidMove(tile, toTile)) {
            toTile.classList.add('potential-move');
        }
    }
}

// Clear potential move locations
function clearPotentialMoves() {
    const potentialMoves = document.querySelectorAll('.potential-move');
    potentialMoves.forEach(tile => {
        tile.classList.remove('potential-move');
    });
}

// Add event listeners to the tiles
function addTileEventListeners() {
    const tiles = document.querySelectorAll('.white-tile, .black-tile');
    tiles.forEach(tile => {
        tile.addEventListener('click', onTileClick);
    });
}

// Add event listeners to the pieces
function addPieceEventListeners() {
    const pieces = document.querySelectorAll('.white-piece, .black-piece');
    pieces.forEach(piece => {
        piece.addEventListener('click', onPieceClick);
    });
}

// Handle drag start event
function onDragStart(event) {
    // Only allow dragging if it's the player's turn
    const piece = event.target;
    const tile = piece.parentElement;
    
    if ((isWhiteTurn && piece.classList.contains('white-piece')) || 
        (!isWhiteTurn && piece.classList.contains('black-piece'))) {
        
        // Store the piece's original position
        event.dataTransfer.setData('text/plain', tile.id);
        
        // Add dragging class to show visual feedback
        piece.classList.add('dragging');
        
        // Create and set up the drag image
        const dragImage = piece.cloneNode(true);
        dragImage.classList.add('drag-image'); // Add a specific class for the clone
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-9999px';
        document.body.appendChild(dragImage);
        event.dataTransfer.setDragImage(dragImage, 25, 25);

        selectedPiece = piece;
        selectedTile = tile;
        tile.classList.add('selected');
        showPotentialMoves(tile);
    } else {
        event.preventDefault();
    }
}

// Handle drag end event
function onDragEnd(event) {
    // Remove the dragging class from any elements that might have it
    const draggingPieces = document.querySelectorAll('.dragging');
    draggingPieces.forEach(piece => {
        piece.classList.remove('dragging');
    });
    
    // Clean up any drag images that were created
    const dragImages = document.querySelectorAll('.drag-image');
    dragImages.forEach(image => {
        if (image.parentNode) {
            image.parentNode.removeChild(image);
        }
    });
}

// Handle drag over event
function onDragOver(event) {
    event.preventDefault(); // This is needed to allow dropping
}

// Handle drop event
function onDrop(event) {
    event.preventDefault();
    
    // Get the source tile ID and find the corresponding elements
    const fromTileId = event.dataTransfer.getData('text/plain');
    const fromTile = document.getElementById(fromTileId);
    const toTile = event.target.closest('.white-tile, .black-tile');
    
    // Only proceed if we have valid tiles
    if (fromTile && toTile) {
        const piece = fromTile.querySelector('.white-piece, .black-piece');
        
        if (piece && isValidMove(fromTile, toTile)) {
            movePiece(fromTile, toTile);
            clearAllSelectedTiles();
            clearPotentialMoves();
            displayMessage('');
        } else {
            displayMessage('Invalid move!');
        }
    }
    
    // Clean up any remaining drag-related elements
    onDragEnd(event);
}

// Add drag and drop event listeners to the pieces
function addDragAndDropEventListeners() {
    // First, remove any existing listeners to prevent duplicates
    const pieces = document.querySelectorAll('.white-piece, .black-piece');
    pieces.forEach(piece => {
        piece.setAttribute('draggable', true);
        // Use the capture phase to ensure these run before other handlers
        piece.addEventListener('dragstart', onDragStart, true);
        piece.addEventListener('dragend', onDragEnd, true);
    });
    
    const tiles = document.querySelectorAll('.white-tile, .black-tile');
    tiles.forEach(tile => {
        tile.addEventListener('dragover', onDragOver);
        tile.addEventListener('drop', onDrop);
    });
}

// Convert tile index to chess notation
function indexToChessNotation(index) {
    const file = String.fromCharCode(97 + (index % 8)); // 'a' + column index
    const rank = 8 - Math.floor(index / 8); // 8 - row index
    return `${file}${rank}`;
}

function displayMoveHistory() {
    const historyElement = document.getElementById('move-history');
    const movesToShow = showFullHistory ? moveHistory : moveHistory.slice(-5);
    historyElement.innerHTML = movesToShow.map((move, index) => {
        let notation = `${move.notation}`;
        if (move.isCheck) {
            notation += ' (check)';
        }
        if (move.isCheckmate) {
            notation += ' (checkmate)';
        }
        return `<li>${notation}</li>`;
    }).join('');

    const toggleButton = document.getElementById('toggle-move-history');
    toggleButton.textContent = showFullHistory ? 'Show Last 5 Moves' : 'Show Full History';
}

document.getElementById('toggle-move-history').addEventListener('click', () => {
    showFullHistory = !showFullHistory;
    displayMoveHistory();
});

// Function to display a message
function displayMessage(message) {
    const messageElement = document.getElementById('message');
    messageElement.textContent = message;
}

// Function to display whose turn it is
function displayTurn() {
    const turnElement = document.getElementById('turn');
    turnElement.textContent = isWhiteTurn ? 'White\'s turn (bottom)' : 'Black\'s turn (top)';
}

// Function to display the game over modal
function displayGameOver(message) {
    document.getElementById('game-over-message').textContent = message;
    document.getElementById('game-over-modal').style.display = 'flex'; // Show the modal
}

// Function to restart the game
function restartGame() {
    selectedPiece = null;
    selectedTile = null;
    isWhiteTurn = true;
    moveHistory = [];
    lastMoves = [];
    document.getElementById('game-over-modal').style.display = 'none'; // Hide the modal
    displayMessage('');
    initializeGame();
}

// Add event listener for the restart button
document.getElementById('restart-button').addEventListener('click', restartGame);

// Initialize the game
function initializeGame() {
    initializeBoard();
    placePieces();
    addTileEventListeners();
    addDragAndDropEventListeners();
    
    displayTurn();
    loadPreset(); // Load saved preset if available
}

document.getElementById('settings-toggle').addEventListener('click', function() {
    const settingsOverlay = document.getElementById('settings-overlay');
    if (settingsOverlay.classList.contains('hidden')) {
        settingsOverlay.classList.remove('hidden');
        settingsOverlay.style.display = 'flex'; // Ensure the overlay is displayed
    } else {
        settingsOverlay.classList.add('hidden');
        settingsOverlay.style.display = 'none'; // Ensure the overlay is hidden
    }
});

document.getElementById('close-settings').addEventListener('click', function() {
    const settingsOverlay = document.getElementById('settings-overlay');
    settingsOverlay.classList.add('hidden');
    settingsOverlay.style.display = 'none'; // Ensure the overlay is hidden
});

document.getElementById('apply-settings').addEventListener('click', applySettings);

document.getElementById('save-preset').addEventListener('click', savePreset);

function applySettings() {
    const whiteTileColor = document.getElementById('white-tile-color').value;
    const blackTileColor = document.getElementById('black-tile-color').value;
    const whitePieceColor = document.getElementById('white-piece-color').value;
    const blackPieceColor = document.getElementById('black-piece-color').value;

    document.documentElement.style.setProperty('--white-tile-color', whiteTileColor);
    document.documentElement.style.setProperty('--black-tile-color', blackTileColor);
    document.documentElement.style.setProperty('--white-piece-color', whitePieceColor);
    document.documentElement.style.setProperty('--black-piece-color', blackPieceColor);
}

function savePreset() {
    const whiteTileColor = document.getElementById('white-tile-color').value;
    const blackTileColor = document.getElementById('black-tile-color').value;
    const whitePieceColor = document.getElementById('white-piece-color').value;
    const blackPieceColor = document.getElementById('black-piece-color').value;

    const preset = {
        whiteTileColor,
        blackTileColor,
        whitePieceColor,
        blackPieceColor
    };

    localStorage.setItem('chessColorPreset', JSON.stringify(preset));
    alert('Color preset saved!');
}

function loadPreset() {
    const preset = JSON.parse(localStorage.getItem('chessColorPreset'));
    if (preset) {
        document.getElementById('white-tile-color').value = preset.whiteTileColor;
        document.getElementById('black-tile-color').value = preset.blackTileColor;
        document.getElementById('white-piece-color').value = preset.whitePieceColor;
        document.getElementById('black-piece-color').value = preset.blackPieceColor;
        applySettings();
    }
}

// Start the game
initializeGame();

// Add CSS for selected piece
const style = document.createElement('style');
style.innerHTML = `
    .selected {
        border: 2px solid red;
    }
    .potential-move {
        background-color: yellow;
    }
`;
document.head.appendChild(style);

function isKingInCheck(isWhite) {
    const kingPiece = isWhite ? '\u2654' : '\u265A';
    const king = Array.from(document.querySelectorAll(isWhite ? '.white-piece' : '.black-piece')).find(piece => piece.textContent === kingPiece);
    if (!king) {
        console.error('King piece not found!');
        return false;
    }

    const kingTile = king.parentElement;
    const opponentPieces = document.querySelectorAll(isWhite ? '.black-piece' : '.white-piece');
    for (const piece of opponentPieces) {
        const fromTile = piece.parentElement;
        if (isValidMove(fromTile, kingTile)) {
            kingTile.classList.add('king-in-check'); // Ensure the king's tile is highlighted
            document.getElementById('message').textContent = `${isWhite ? 'White' : 'Black'} is in check!`;
            return true;
        }
    }
    kingTile.classList.remove('king-in-check'); // Remove the highlight if not in check
    document.getElementById('message').textContent = '';
    return false;
}

function highlightKingInCheck(isWhite) {
    const kingPiece = isWhite ? '\u2654' : '\u265A';
    const king = Array.from(document.querySelectorAll(isWhite ? '.white-piece' : '.black-piece')).find(piece => piece.textContent === kingPiece);
    if (king) {
        king.parentElement.classList.add('king-in-check');
    }
}

function clearKingInCheck() {
    const kingInCheck = document.querySelector('.king-in-check');
    if (kingInCheck) {
        kingInCheck.classList.remove('king-in-check');
    }
}

function clearAllSelectedTiles() {
    const tiles = document.querySelectorAll('.white-tile.selected, .black-tile.selected');
    tiles.forEach(tile => tile.classList.remove('selected'));
}

function preventHintClicksFromSelectingPiece() {
    const hintButton = document.getElementById('toggle-hint');
    const hintReason = document.getElementById('hint-reason');
    if (hintButton) {
        hintButton.addEventListener('click', (e) => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            // removed e.preventDefault() so showHint can run
        }, true);
    }
    if (hintReason) {
        hintReason.addEventListener('click', (e) => {
            e.stopImmediatePropagation();
            e.preventDefault();
        }, true);
    }
}

function applySettings() {
    const whiteTileColor = document.getElementById('white-tile-color').value;
    const blackTileColor = document.getElementById('black-tile-color').value;
    const whitePieceColor = document.getElementById('white-piece-color').value;
    const blackPieceColor = document.getElementById('black-piece-color').value;

    document.documentElement.style.setProperty('--white-tile-color', whiteTileColor);
    document.documentElement.style.setProperty('--black-tile-color', blackTileColor);
    document.documentElement.style.setProperty('--white-piece-color', whitePieceColor);
    document.documentElement.style.setProperty('--black-piece-color', blackPieceColor);
}

document.getElementById('apply-settings').addEventListener('click', applySettings);

