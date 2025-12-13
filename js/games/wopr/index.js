// ============================================
// WOPR Game - Main Entry Point
// ============================================
// 
// This file serves as documentation for the WOPR module structure.
// All modules are loaded via script tags in index.html and export
// their functions to the window object.
//
// Module Structure:
// -----------------
// data.js      - Game state (WOPR object), constants, map coordinates
// map.js       - Canvas drawing functions for the world map
// mechanics.js - Game logic, AI behavior, turn processing
// ui.js        - UI rendering, menus, displays
// input.js     - Keyboard input handling
//
// Key Exports:
// ------------
// From data.js:
//   - window.WOPR (game state)
//   - window.WOPR_CONTINENTS
//   - window.WOPR_USSR_TERRITORY
//   - window.WOPR_US_CITIES
//   - window.WOPR_USSR_CITIES
//   - window.WOPR_MISSILE_ROUTES
//
// From map.js:
//   - window.drawWorldMap()
//
// From mechanics.js:
//   - window.initWOPRGame()
//   - window.getGameDate()
//   - window.raiseAlert()
//   - window.executeRecon()
//   - window.executeDiplomacy()
//   - window.executeLaunch()
//   - window.endTurn()
//   - window.addWOPREvent()
//   - etc.
//
// From ui.js:
//   - window.renderWOPRGame()
//   - window.showLaunchMenu()
//   - window.conductReconnaissance()
//   - window.openNegotiations()
//   - window.showStatusReport()
//   - window.showGameOver()
//
// From input.js:
//   - window.handleWOPRInput()
//
// Usage:
// ------
// Load all scripts in order in index.html:
//   <script src="js/games/wopr/data.js"></script>
//   <script src="js/games/wopr/map.js"></script>
//   <script src="js/games/wopr/mechanics.js"></script>
//   <script src="js/games/wopr/ui.js"></script>
//   <script src="js/games/wopr/input.js"></script>
//
// Then start the game with:
//   initWOPRGame();
//   renderWOPRGame();

console.log('WOPR Game Module Loaded');
console.log('Available: initWOPRGame(), renderWOPRGame(), handleWOPRInput()');

