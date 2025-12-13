// ============================================
// WOPR Input Handling
// ============================================

function handleWOPRInput(e) {
    const WOPR = window.WOPR;
    
    if (!WOPR.gameActive) return;
    
    // Handle different phases
    switch(WOPR.phase) {
        case 'command':
            handleCommandInput(e);
            break;
        case 'launch':
        case 'launch_select':
            handleLaunchInput(e);
            break;
        case 'recon':
            handleReconInput(e);
            break;
        case 'diplomacy':
            handleDiplomacyInput(e);
            break;
        case 'build':
            handleBuildInput(e);
            break;
        case 'status':
            handleStatusInput(e);
            break;
    }
}

function handleCommandInput(e) {
    const WOPR = window.WOPR;
    
    switch(e.key.toLowerCase()) {
        case 'escape':
            e.preventDefault();
            WOPR.gameActive = false;
            window.state.currentModule = 'games';
            window.initGamesModule();
            break;
        case 'l':
            e.preventDefault();
            showLaunchMenu();
            break;
        case 'i':
            e.preventDefault();
            conductReconnaissance();
            break;
        case 's':
            e.preventDefault();
            showStatusReport();
            break;
        case 'r':
            e.preventDefault();
            raiseAlert();
            break;
        case 'n':
            e.preventDefault();
            openNegotiations();
            break;
        case 'b':
            e.preventDefault();
            showBuildMenu();
            break;
        case 'e':
            e.preventDefault();
            endTurn();
            break;
    }
}

function handleLaunchInput(e) {
    const WOPR = window.WOPR;
    const key = e.key.toLowerCase();
    const ussrCities = window.WOPR_USSR_CITIES;
    
    if (key === 'x' || key === 'escape') {
        e.preventDefault();
        WOPR.selectedWeapon = null;
        WOPR.selectedTarget = null;
        WOPR.phase = 'command';
        renderWOPRGame();
        return;
    }
    
    // Weapon selection (1, 2, 3)
    if (key === '1' && WOPR.assets.USA.icbms > 0) {
        e.preventDefault();
        WOPR.selectedWeapon = 'icbm';
        showLaunchMenu(); // Re-render to show selection
    } else if (key === '2' && WOPR.assets.USA.slbms > 0) {
        e.preventDefault();
        WOPR.selectedWeapon = 'slbm';
        showLaunchMenu();
    } else if (key === '3' && WOPR.assets.USA.bombers > 0) {
        e.preventDefault();
        WOPR.selectedWeapon = 'bomber';
        showLaunchMenu();
    }
    
    // Target selection (A-G for 7 cities)
    const targetKeys = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4, 'f': 5, 'g': 6 };
    if (targetKeys[key] !== undefined && targetKeys[key] < ussrCities.length) {
        e.preventDefault();
        WOPR.selectedTarget = targetKeys[key];
        showLaunchMenu(); // Re-render to show selection
    }
    
    // Enter key to confirm launch when both weapon and target selected
    if (key === 'enter' && WOPR.selectedWeapon && WOPR.selectedTarget !== null) {
        e.preventDefault();
        const targetCity = ussrCities[WOPR.selectedTarget];
        executeLaunch(WOPR.selectedWeapon, WOPR.selectedTarget, targetCity.name);
        WOPR.selectedWeapon = null;
        WOPR.selectedTarget = null;
    }
}

function handleReconInput(e) {
    const WOPR = window.WOPR;
    const key = e.key.toLowerCase();
    
    if (key === 'x' || key === 'escape') {
        e.preventDefault();
        e.stopPropagation();
        WOPR.phase = 'command';
        renderWOPRGame();
        return;
    }
    
    if (key === '1') {
        e.preventDefault();
        executeRecon('silos');
    } else if (key === '2') {
        e.preventDefault();
        executeRecon('subs');
    } else if (key === '3') {
        e.preventDefault();
        executeRecon('defenses');
    } else if (key === '4') {
        e.preventDefault();
        executeRecon('firstStrike');
    }
}

function handleDiplomacyInput(e) {
    const WOPR = window.WOPR;
    const key = e.key.toLowerCase();
    
    if (key === 'x' || key === 'escape') {
        e.preventDefault();
        e.stopPropagation();
        WOPR.phase = 'command';
        renderWOPRGame();
        return;
    }
    
    if (key === '1') {
        e.preventDefault();
        executeDiplomacy('deescalate');
    } else if (key === '2') {
        e.preventDefault();
        executeDiplomacy('warning');
    } else if (key === '3') {
        e.preventDefault();
        executeDiplomacy('intelligence');
    }
}

function handleStatusInput(e) {
    const WOPR = window.WOPR;
    
    // Any key returns to command view
    e.preventDefault();
    WOPR.phase = 'command';
    renderWOPRGame();
}

function handleBuildInput(e) {
    const WOPR = window.WOPR;
    const key = e.key.toLowerCase();
    
    if (key === 'x' || key === 'escape') {
        e.preventDefault();
        e.stopPropagation();
        WOPR.phase = 'command';
        renderWOPRGame();
        return;
    }
    
    if (key === '1') {
        e.preventDefault();
        executeBuild('icbm');
    } else if (key === '2') {
        e.preventDefault();
        executeBuild('interceptor');
    } else if (key === '3') {
        e.preventDefault();
        executeBuild('bomber');
    }
}

// Export
window.handleWOPRInput = handleWOPRInput;

