// ============================================
// WOPR UI - Rendering and Display Functions
// ============================================

function renderWOPRGame() {
    const WOPR = window.WOPR;
    const output = document.getElementById('output');
    
    const tensionBar = generateTensionBar(WOPR.diplomacy.tension);
    
    output.innerHTML = `
        <div class="wopr-game-v2">
            <div class="wopr-header-bar">
                <div class="wopr-defcon defcon-${WOPR.defcon}">DEFCON ${WOPR.defcon}</div>
                <div class="wopr-date">WEEK ${WOPR.turn} ─ ${getGameDate()}</div>
                <div class="wopr-tension">TENSION: ${tensionBar}</div>
                <div class="wopr-actions">ACTIONS: ${WOPR.actionsRemaining}/${WOPR.maxActions}</div>
            </div>
            
            <div class="wopr-main-display">
                <div class="wopr-map-container">
                    <div class="map-header">W O P R   G L O B A L   S T R A T E G I C   D I S P L A Y</div>
                    <canvas id="world-map-canvas" width="800" height="400"></canvas>
                    <div class="map-legend">
                        <span class="legend-item"><span class="legend-city">◉</span> CITY</span>
                        <span class="legend-item"><span class="legend-silo">▲</span> SILO</span>
                        <span class="legend-item"><span class="legend-us-missile">◆→</span> US MISSILE</span>
                        <span class="legend-item"><span class="legend-ussr-missile">←◆</span> USSR MISSILE</span>
                    </div>
                    ${generateTrajectoryHTML()}
                </div>
                
                <div class="wopr-side-panel">
                    <div class="wopr-assets-panel">
                        <div class="panel-title">═══ STRATEGIC FORCES ═══</div>
                        <div class="assets-grid">
                            <div class="asset-column usa">
                                <div class="column-header">🇺🇸 USA</div>
                                <div class="asset-row"><span>ICBM:</span><span class="asset-value">${WOPR.assets.USA.icbms}</span></div>
                                <div class="asset-row"><span>SLBM:</span><span class="asset-value">${WOPR.assets.USA.slbms}</span></div>
                                <div class="asset-row"><span>B-52:</span><span class="asset-value">${WOPR.assets.USA.bombers}</span></div>
                                <div class="asset-row"><span>ABM:</span><span class="asset-value">${WOPR.assets.USA.interceptors}</span></div>
                                <div class="asset-row dim"><span>POP:</span><span class="asset-value">190M</span></div>
                            </div>
                            <div class="asset-column ussr">
                                <div class="column-header">☭ USSR</div>
                                <div class="asset-row"><span>ICBM:</span> ${WOPR.intel.ussrSilosRevealed ? WOPR.assets.USSR.icbms : '?'}</div>
                                <div class="asset-row"><span>SLBM:</span> ${WOPR.intel.ussrSubsRevealed ? WOPR.assets.USSR.slbms : '?'}</div>
                                <div class="asset-row"><span>BEAR:</span><span class="asset-value">${WOPR.assets.USSR.bombers}</span></div>
                                <div class="asset-row"><span>ABM:</span> ${WOPR.intel.ussrDefensesRevealed ? WOPR.assets.USSR.interceptors : '?'}</div>
                                <div class="asset-row dim"><span>POP:</span><span class="asset-value">130M</span></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="wopr-event-log">
                        <div class="panel-title">═══ INTELLIGENCE BRIEFING ═══</div>
                        <div class="event-log-content">
                            ${generateEventLogHTML()}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="wopr-command-panel">
                <div class="command-group">
                    <span class="command-label">OFFENSIVE:</span>
                    <button class="wopr-btn ${WOPR.defcon > 2 ? 'disabled' : ''}" onclick="showLaunchMenu()">[L] LAUNCH ${WOPR.launchesThisTurn}/${WOPR.siloCapacity.USA.launchesPerTurn}</button>
                </div>
                <div class="command-group">
                    <span class="command-label">PRODUCTION:</span>
                    <button class="wopr-btn" onclick="showBuildMenu()">[B] BUILD</button>
                </div>
                <div class="command-group">
                    <span class="command-label">INTEL:</span>
                    <button class="wopr-btn" onclick="conductReconnaissance()">[I] RECON</button>
                    <button class="wopr-btn" onclick="showStatusReport()">[S] STATUS</button>
                </div>
                <div class="command-group">
                    <span class="command-label">POSTURE:</span>
                    <button class="wopr-btn" onclick="raiseAlert()">[R] RAISE ALERT</button>
                    <button class="wopr-btn" onclick="openNegotiations()">[N] NEGOTIATE</button>
                </div>
                <button class="wopr-btn end-turn" onclick="endTurn()">[E] END WEEK</button>
            </div>
        </div>
    `;
    
    // Draw the canvas map
    setTimeout(() => {
        drawWorldMap();
    }, 50);
}

function generateTensionBar(tension) {
    const filled = Math.floor(tension / 10);
    const empty = 10 - filled;
    let colorClass = 'tension-low';
    if (tension > 70) colorClass = 'tension-critical';
    else if (tension > 50) colorClass = 'tension-high';
    else if (tension > 30) colorClass = 'tension-medium';
    
    return `<span class="${colorClass}">[${('█'.repeat(filled))}${('░'.repeat(empty))}] ${tension}%</span>`;
}

function generateEventLogHTML() {
    const WOPR = window.WOPR;
    const recentEvents = WOPR.eventLog.slice(-12);
    
    if (recentEvents.length === 0) {
        return '<div class="event info">AWAITING ORDERS, COMMANDER...</div>';
    }
    
    return recentEvents.map(e => 
        `<div class="event ${e.type}">${e.message}</div>`
    ).join('');
}

function generateTrajectoryHTML() {
    const WOPR = window.WOPR;
    
    if (WOPR.inFlight.length === 0) {
        return '<div class="trajectory-status">─── NO ACTIVE MISSILES ───</div>';
    }
    
    const usaMissiles = WOPR.inFlight.filter(m => m.side === 'USA');
    const ussrMissiles = WOPR.inFlight.filter(m => m.side === 'USSR');
    
    let html = '<div class="trajectory-display">';
    
    if (usaMissiles.length > 0) {
        html += '<div class="traj-section usa-missiles">';
        usaMissiles.forEach(m => {
            html += `<div class="traj-item">◆→ ${m.type} → ${m.target} (ETA: ${m.turnsToImpact}w)</div>`;
        });
        html += '</div>';
    }
    
    if (ussrMissiles.length > 0) {
        html += '<div class="traj-section ussr-missiles">';
        ussrMissiles.forEach(m => {
            html += `<div class="traj-item">←◆ ${m.type} → ${m.target} (ETA: ${m.turnsToImpact}w)</div>`;
        });
        html += '</div>';
    }
    
    html += '</div>';
    return html;
}

function showLaunchMenu() {
    const WOPR = window.WOPR;
    const output = document.getElementById('output');
    
    if (WOPR.defcon > 2) {
        addWOPREvent('error', 'NUCLEAR LAUNCH REQUIRES DEFCON 2 OR LOWER');
        renderWOPRGame();
        return;
    }
    
    if (WOPR.actionsRemaining <= 0) {
        addWOPREvent('error', 'NO ORDERS REMAINING THIS WEEK');
        renderWOPRGame();
        return;
    }
    
    // Use actual USSR cities as targets
    const ussrCities = window.WOPR_USSR_CITIES;
    
    // Get current selection status (use ?? to handle index 0 for Moscow)
    const selectedWeapon = WOPR.selectedWeapon ?? null;
    const selectedTarget = WOPR.selectedTarget ?? null;
    
    // Weapon display with selection indicator
    const weaponSelected = (type) => selectedWeapon === type ? 'selected' : '';
    const targetSelected = (idx) => selectedTarget === idx ? 'selected' : '';
    
    output.innerHTML = `
        <div class="wopr-game-v2">
            <div class="wopr-header-bar">
                <div class="wopr-defcon defcon-${WOPR.defcon}">DEFCON ${WOPR.defcon}</div>
                <div class="wopr-date">WEEK ${WOPR.turn} ─ ${getGameDate()}</div>
                <div class="wopr-actions">ACTIONS: ${WOPR.actionsRemaining}/${WOPR.maxActions}</div>
            </div>
            
            <div class="launch-menu">
                <div class="launch-header">
                    ╔═══════════════════════════════════════════════════════════════╗
                    ║             ★ STRATEGIC WEAPONS TARGETING SYSTEM ★            ║
                    ╚═══════════════════════════════════════════════════════════════╝
                </div>
                
                <div class="launch-selection-status">
                    WEAPON: ${selectedWeapon ? '<span class="status-active">' + selectedWeapon.toUpperCase() + '</span>' : '<span class="status-pending">NONE</span>'} │ 
                    TARGET: ${selectedTarget !== null ? '<span class="status-active">' + ussrCities[selectedTarget].name.toUpperCase() + '</span>' : '<span class="status-pending">NONE</span>'}
                    ${selectedWeapon && selectedTarget !== null ? ' │ <span class="status-ready">★ PRESS [ENTER] TO LAUNCH ★</span>' : ''}
                </div>
                
                <div class="launch-columns">
                    <div class="weapon-select">
                        <div class="section-title">SELECT DELIVERY SYSTEM:</div>
                        <div class="weapon-option ${WOPR.assets.USA.icbms > 0 ? '' : 'depleted'} ${weaponSelected('icbm')}" data-weapon="icbm">
                            <span class="weapon-key">[1]</span>
                            <span class="weapon-name">ICBM - MINUTEMAN III</span>
                            <span class="weapon-count">${WOPR.assets.USA.icbms} AVAILABLE</span>
                            <span class="weapon-eta">⏱ 2 WKS │ 25% DMG</span>
                        </div>
                        <div class="weapon-option ${WOPR.assets.USA.slbms > 0 ? '' : 'depleted'} ${weaponSelected('slbm')}" data-weapon="slbm">
                            <span class="weapon-key">[2]</span>
                            <span class="weapon-name">SLBM - TRIDENT</span>
                            <span class="weapon-count">${WOPR.assets.USA.slbms} AVAILABLE</span>
                            <span class="weapon-eta">⏱ 2 WKS │ 20% DMG</span>
                        </div>
                        <div class="weapon-option ${WOPR.assets.USA.bombers > 0 ? '' : 'depleted'} ${weaponSelected('bomber')}" data-weapon="bomber">
                            <span class="weapon-key">[3]</span>
                            <span class="weapon-name">B-52 STRATOFORTRESS ✦</span>
                            <span class="weapon-count">${WOPR.assets.USA.bombers} AVAILABLE</span>
                            <span class="weapon-eta">⏱ 3 WKS │ 30% DMG │ STEALTH</span>
                        </div>
                    </div>
                    
                    <div class="target-select">
                        <div class="section-title">SELECT TARGET CITY:</div>
                        ${ussrCities.map((city, i) => {
                            const keyLetter = String.fromCharCode(65 + i); // A, B, C, D, E, F, G
                            return `
                            <div class="target-option ${targetSelected(i)}" data-target="${i}">
                                <span class="target-key">[${keyLetter}]</span>
                                <span class="target-name">${city.name} (${city.short})</span>
                                <span class="target-silos">${city.silos} ICBM${city.silos > 1 ? 's' : ''}</span>
                            </div>
                        `}).join('')}
                    </div>
                </div>
                
                <div class="launch-footer">
                    [1-3] WEAPON │ [A-G] CITY │ [ENTER] LAUNCH │ [X] CANCEL
                </div>
            </div>
        </div>
    `;
    
    WOPR.phase = 'launch';
}

function conductReconnaissance() {
    const WOPR = window.WOPR;
    const output = document.getElementById('output');
    
    if (WOPR.actionsRemaining <= 0) {
        addWOPREvent('error', 'NO ORDERS REMAINING THIS WEEK');
        return;
    }
    
    output.innerHTML = `
        <div class="wopr-game-v2">
            <div class="wopr-header-bar">
                <div class="wopr-defcon defcon-${WOPR.defcon}">DEFCON ${WOPR.defcon}</div>
                <div class="wopr-date">WEEK ${WOPR.turn} ─ ${getGameDate()}</div>
                <div class="wopr-actions">ACTIONS: ${WOPR.actionsRemaining}/${WOPR.maxActions}</div>
            </div>
            
            <div class="recon-menu">
                <div class="recon-header">
                    ╔═══════════════════════════════════════════════════════════════╗
                    ║            RECONNAISSANCE & INTELLIGENCE CENTER               ║
                    ╚═══════════════════════════════════════════════════════════════╝
                </div>
                
                <div class="recon-options">
                    <div class="recon-option ${WOPR.intel.ussrSilosRevealed ? 'completed' : ''}" data-recon="silos">
                        <div class="recon-key">[1]</div>
                        <div class="recon-name">SATELLITE IMAGERY - SILO LOCATIONS</div>
                        <div class="recon-status">${WOPR.intel.ussrSilosRevealed ? '✓ MAPPED' : 'UNKNOWN'}</div>
                    </div>
                    
                    <div class="recon-option ${WOPR.intel.ussrSubsRevealed ? 'completed' : ''}" data-recon="subs">
                        <div class="recon-key">[2]</div>
                        <div class="recon-name">SONAR SWEEP - SUBMARINE POSITIONS</div>
                        <div class="recon-status">${WOPR.intel.ussrSubsRevealed ? '✓ TRACKED' : 'UNKNOWN'}</div>
                    </div>
                    
                    <div class="recon-option ${WOPR.intel.ussrDefensesRevealed ? 'completed' : ''}" data-recon="defenses">
                        <div class="recon-key">[3]</div>
                        <div class="recon-name">SIGINT ANALYSIS - DEFENSE NETWORK</div>
                        <div class="recon-status">${WOPR.intel.ussrDefensesRevealed ? '✓ ANALYZED' : 'UNKNOWN'}</div>
                    </div>
                    
                    <div class="recon-option ${WOPR.intel.firstStrikePrediction ? 'completed' : ''}" data-recon="firstStrike">
                        <div class="recon-key">[4]</div>
                        <div class="recon-name">THREAT ASSESSMENT - FIRST STRIKE PREDICTION</div>
                        <div class="recon-status">${WOPR.intel.firstStrikePrediction ? '⚡ ' + WOPR.intel.firstStrikePrediction.toUpperCase() : 'UNKNOWN'}</div>
                    </div>
                </div>
                
                <div class="recon-footer">
                    [1-4] SELECT RECON TYPE │ [X] CANCEL
                </div>
            </div>
        </div>
    `;
    
    WOPR.phase = 'recon';
}

function openNegotiations() {
    const WOPR = window.WOPR;
    const output = document.getElementById('output');
    
    if (WOPR.actionsRemaining <= 0) {
        addWOPREvent('error', 'NO ORDERS REMAINING THIS WEEK');
        renderWOPRGame(); // Re-render to show error message
        return;
    }
    
    if (!WOPR.diplomacy.hotlineActive) {
        addWOPREvent('error', 'HOTLINE DISCONNECTED - Cannot negotiate');
        renderWOPRGame(); // Re-render to show error message
        return;
    }
    
    output.innerHTML = `
        <div class="wopr-game-v2">
            <div class="wopr-header-bar">
                <div class="wopr-defcon defcon-${WOPR.defcon}">DEFCON ${WOPR.defcon}</div>
                <div class="wopr-date">WEEK ${WOPR.turn} ─ ${getGameDate()}</div>
                <div class="wopr-actions">ACTIONS: ${WOPR.actionsRemaining}/${WOPR.maxActions}</div>
            </div>
            
            <div class="diplomacy-menu">
                <div class="diplomacy-header">
                    ╔═══════════════════════════════════════════════════════════════╗
                    ║              WASHINGTON-MOSCOW HOTLINE                        ║
                    ╚═══════════════════════════════════════════════════════════════╝
                </div>
                
                <div class="diplomacy-status">
                    <div>Current Tension Level: ${generateTensionBar(WOPR.diplomacy.tension)}</div>
                </div>
                
                <div class="diplomacy-options">
                    <div class="diplo-option" data-diplo="deescalate">
                        <div class="diplo-key">[1]</div>
                        <div class="diplo-name">PROPOSE DE-ESCALATION</div>
                    </div>
                    
                    <div class="diplo-option" data-diplo="warning">
                        <div class="diplo-key">[2]</div>
                        <div class="diplo-name">ISSUE WARNING</div>
                    </div>
                    
                    <div class="diplo-option" data-diplo="intelligence">
                        <div class="diplo-key">[3]</div>
                        <div class="diplo-name">SHARE INTELLIGENCE</div>
                    </div>
                </div>
                
                <div class="diplomacy-footer">
                    [1-3] SELECT ACTION │ [X] CANCEL
                </div>
            </div>
        </div>
    `;
    
    WOPR.phase = 'diplomacy';
}

function showBuildMenu() {
    const WOPR = window.WOPR;
    const output = document.getElementById('output');
    
    if (WOPR.actionsRemaining <= 0) {
        addWOPREvent('error', 'NO ORDERS REMAINING THIS WEEK');
        renderWOPRGame();
        return;
    }
    
    output.innerHTML = `
        <div class="wopr-game-v2">
            <div class="wopr-header-bar">
                <div class="wopr-defcon defcon-${WOPR.defcon}">DEFCON ${WOPR.defcon}</div>
                <div class="wopr-date">WEEK ${WOPR.turn} ─ ${getGameDate()}</div>
                <div class="wopr-actions">ACTIONS: ${WOPR.actionsRemaining}/${WOPR.maxActions}</div>
            </div>
            
            <div class="build-menu">
                <div class="build-header">
                    ╔═══════════════════════════════════════════════════════════════╗
                    ║              MILITARY INDUSTRIAL COMPLEX                       ║
                    ╚═══════════════════════════════════════════════════════════════╝
                </div>
                
                <div class="build-status">
                    <div>CURRENT STOCKPILE:</div>
                    <div>ICBMs: ${WOPR.assets.USA.icbms} │ SLBMs: ${WOPR.assets.USA.slbms} │ Bombers: ${WOPR.assets.USA.bombers} │ Interceptors: ${WOPR.assets.USA.interceptors}</div>
                </div>
                
                <div class="build-options">
                    <div class="build-option" data-build="icbm">
                        <div class="build-key">[1]</div>
                        <div class="build-name">RUSH ICBM PRODUCTION</div>
                        <div class="build-result">+2 ICBMs</div>
                    </div>
                    
                    <div class="build-option" data-build="interceptor">
                        <div class="build-key">[2]</div>
                        <div class="build-name">BUILD INTERCEPTORS</div>
                        <div class="build-result">+3 ABM Interceptors</div>
                    </div>
                    
                    <div class="build-option" data-build="bomber">
                        <div class="build-key">[3]</div>
                        <div class="build-name">COMMISSION BOMBER</div>
                        <div class="build-result">+1 B-52 Stratofortress</div>
                    </div>
                </div>
                
                <div class="build-footer">
                    [1-3] SELECT PRODUCTION │ [X] CANCEL
                </div>
            </div>
        </div>
    `;
    
    WOPR.phase = 'build';
}

function showStatusReport() {
    const WOPR = window.WOPR;
    const output = document.getElementById('output');
    
    let usaPop = 0, ussrPop = 0;
    Object.values(WOPR.regions).forEach(r => {
        const remaining = Math.max(0, r.pop * (1 - r.damage));
        if (r.side === 'USA') usaPop += remaining;
        if (r.side === 'USSR') ussrPop += remaining;
    });
    
    output.innerHTML = `
        <div class="wopr-status-report">
            <div class="status-header">
                <pre>
╔══════════════════════════════════════════════════════════════╗
║                    STRATEGIC STATUS REPORT                   ║
╚══════════════════════════════════════════════════════════════╝
                </pre>
            </div>
            
            <div class="status-columns">
                <div class="status-column usa">
                    <p class="column-header">══ UNITED STATES ══</p>
                    <p>POPULATION: ${usaPop.toFixed(1)}M</p>
                    <p>ICBMS: ${WOPR.assets.USA.icbms}</p>
                    <p>SLBMS: ${WOPR.assets.USA.slbms}</p>
                    <p>BOMBERS: ${WOPR.assets.USA.bombers}</p>
                    <p>INTERCEPTORS: ${WOPR.assets.USA.interceptors}</p>
                </div>
                
                <div class="status-column ussr">
                    <p class="column-header">══ SOVIET UNION ══</p>
                    <p>POPULATION: ${ussrPop.toFixed(1)}M (EST.)</p>
                    <p>ICBMS: ${WOPR.assets.USSR.icbms} (EST.)</p>
                    <p>SLBMS: ${WOPR.assets.USSR.slbms} (EST.)</p>
                    <p>BOMBERS: ${WOPR.assets.USSR.bombers} (EST.)</p>
                    <p>INTERCEPTORS: ${WOPR.assets.USSR.interceptors} (EST.)</p>
                </div>
            </div>
            
            <div class="status-footer">
                <p class="dim">PRESS ANY KEY TO RETURN</p>
            </div>
        </div>
    `;
    
    WOPR.phase = 'status';
}

function showGameOver(result, outcome) {
    const WOPR = window.WOPR;
    const output = document.getElementById('output');
    
    WOPR.gameActive = false;
    
    let usaCasualties = 0, ussrCasualties = 0;
    Object.values(WOPR.regions).forEach(r => {
        const lost = r.pop * r.damage;
        if (r.side === 'USA') usaCasualties += lost;
        if (r.side === 'USSR') ussrCasualties += lost;
    });
    
    const outcomeClass = outcome === 'win' ? 'highlight' : (outcome === 'loss' ? 'enemy-highlight' : 'warning-text');
    
    output.innerHTML = `
        <div class="wopr-game-over">
            <pre class="game-over-art">
╔══════════════════════════════════════════════════════════════════╗
║                         GAME OVER                                ║
╚══════════════════════════════════════════════════════════════════╝
            </pre>
            
            <p class="result-text ${outcomeClass}">${result}</p>
            
            <div class="final-stats">
                <div class="stat-column">
                    <p class="column-header">UNITED STATES</p>
                    <p>CASUALTIES: ${usaCasualties.toFixed(1)}M</p>
                    <p>MISSILES LAUNCHED: ${WOPR.stats.USA.launched}</p>
                </div>
                <div class="stat-column">
                    <p class="column-header">SOVIET UNION</p>
                    <p>CASUALTIES: ${ussrCasualties.toFixed(1)}M</p>
                    <p>MISSILES LAUNCHED: ${WOPR.stats.USSR.launched}</p>
                </div>
            </div>
            
            <div class="wopr-wisdom">
                <p class="wopr-quote">"A STRANGE GAME.</p>
                <p class="wopr-quote">THE ONLY WINNING MOVE IS NOT TO PLAY."</p>
                <p class="dim">- WOPR</p>
            </div>
            
            <p class="dim" style="margin-top: 30px;">PRESS [SPACE] TO RETURN TO GAMES MENU</p>
        </div>
    `;
    
    const waitForKey = (e) => {
        if (e.key === ' ' || e.key === 'Escape') {
            document.removeEventListener('keydown', waitForKey);
            window.state.currentModule = 'games';
            window.initGamesModule();
        }
    };
    document.addEventListener('keydown', waitForKey);
}

// Export functions
window.renderWOPRGame = renderWOPRGame;
window.generateTensionBar = generateTensionBar;
window.showLaunchMenu = showLaunchMenu;
window.showBuildMenu = showBuildMenu;
window.conductReconnaissance = conductReconnaissance;
window.openNegotiations = openNegotiations;
window.showStatusReport = showStatusReport;
window.showGameOver = showGameOver;

