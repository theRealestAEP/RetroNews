// ============================================
// WOPR Game Mechanics - Logic, AI, Turns
// ============================================

function initWOPRGame() {
    const WOPR = window.WOPR;
    
    // Reset game state
    WOPR.gameActive = true;
    WOPR.turn = 0;
    WOPR.phase = 'command';
    WOPR.defcon = 5;
    WOPR.inFlight = [];
    WOPR.eventLog = [];
    WOPR.actionsRemaining = WOPR.maxActions;
    
    // Reset intel
    WOPR.intel = {
        ussrSilosRevealed: false,
        ussrSubsRevealed: false,
        ussrDefensesRevealed: false,
        firstStrikePrediction: null, // null = unknown, 'low', 'medium', 'high', 'imminent'
        lastScanTurn: 0,
        accuracy: 0.5
    };
    
    // Reset diplomacy
    WOPR.diplomacy = {
        tension: 50,
        negotiations: 0,
        warnings: 0,
        hotlineActive: true
    };
    
    // Reset AI
    WOPR.aiState = 'defensive';
    WOPR.aiAggression = 0;
    
    // Reset production and capacity
    WOPR.production = {
        USA: { rate: 1, lastBuild: 0 },
        USSR: { rate: 1, lastBuild: 0 }
    };
    WOPR.siloCapacity = {
        USA: { total: 15, active: 15, launchesPerTurn: 3 },
        USSR: { total: 19, active: 19, launchesPerTurn: 4 }
    };
    WOPR.launchesThisTurn = 0;
    WOPR.inactionTurns = 0;
    
    // Reset regions
    WOPR.regions = {
        usa_west: { name: 'WEST COAST', shortName: 'LA', side: 'USA', pop: 45, industry: 35, silos: 2, subs: 2, radar: true, command: false, damage: 0 },
        usa_central: { name: 'MIDWEST', shortName: 'CHI', side: 'USA', pop: 55, industry: 55, silos: 4, subs: 0, radar: true, command: true, damage: 0 },
        usa_east: { name: 'EAST COAST', shortName: 'NYC', side: 'USA', pop: 90, industry: 65, silos: 3, subs: 2, radar: true, command: true, damage: 0 },
        ussr_west: { name: 'MOSCOW REGION', shortName: 'MOW', side: 'USSR', pop: 70, industry: 60, silos: 3, subs: 1, radar: true, command: true, damage: 0 },
        ussr_central: { name: 'URAL MOUNTAINS', shortName: 'URAL', side: 'USSR', pop: 25, industry: 35, silos: 5, subs: 0, radar: true, command: false, damage: 0 },
        ussr_east: { name: 'FAR EAST', shortName: 'VLA', side: 'USSR', pop: 35, industry: 25, silos: 2, subs: 3, radar: true, command: true, damage: 0 }
    };
    
    // Reset assets
    WOPR.assets = {
        USA: { icbms: 24, slbms: 12, bombers: 16, interceptors: 20, satellites: 3, fuel: 100 },
        USSR: { icbms: 28, slbms: 10, bombers: 14, interceptors: 18, satellites: 2, fuel: 100 }
    };
    
    // Reset stats
    WOPR.stats = {
        USA: { launched: 0, intercepted: 0, hits: 0, casualties: 0 },
        USSR: { launched: 0, intercepted: 0, hits: 0, casualties: 0 }
    };
    
    // Reset date
    WOPR.startDate = new Date(1983, 0, 1);
    
    addWOPREvent('info', '─────── SIMULATION STARTED ───────');
    addWOPREvent('info', 'DEFCON 5: Normal peacetime readiness');
}

function getGameDate() {
    const WOPR = window.WOPR;
    const d = new Date(WOPR.startDate);
    d.setDate(d.getDate() + WOPR.turn * 7);
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function raiseAlert() {
    const WOPR = window.WOPR;
    
    if (WOPR.actionsRemaining <= 0) {
        addWOPREvent('error', 'NO ORDERS REMAINING THIS WEEK');
        return;
    }
    
    if (WOPR.defcon > 1) {
        WOPR.defcon--;
        WOPR.actionsRemaining--;
        WOPR.aiAggression += 10;
        WOPR.diplomacy.tension = Math.min(100, WOPR.diplomacy.tension + 10);
        addWOPREvent('warning', `★ DEFCON RAISED TO LEVEL ${WOPR.defcon}`);
        addWOPREvent('info', `Nuclear launch ${WOPR.defcon <= 2 ? 'NOW AUTHORIZED' : 'requires DEFCON 2'}`);
    } else {
        addWOPREvent('info', 'Already at maximum alert - DEFCON 1');
    }
    renderWOPRGame();
}

function executeRecon(type) {
    const WOPR = window.WOPR;
    
    WOPR.actionsRemaining--;
    WOPR.intel.lastScanTurn = WOPR.turn;
    WOPR.intel.accuracy = Math.min(1, WOPR.intel.accuracy + 0.1);
    
    const success = Math.random() < 0.8;
    
    switch(type) {
        case 'silos':
            if (success || WOPR.intel.ussrSilosRevealed) {
                WOPR.intel.ussrSilosRevealed = true;
                addWOPREvent('intel', `◆ SATELLITE RECON: ${WOPR.assets.USSR.icbms} ICBM silos located across USSR`);
                addWOPREvent('intel', `◆ Primary concentrations: Ural Mountains, Siberia`);
                addWOPREvent('success', `★ TACTICAL ADVANTAGE: +10% damage, +25% silo destruction chance`);
            } else {
                addWOPREvent('info', '◆ RECON INCONCLUSIVE: Cloud cover obscured imagery');
            }
            break;
        case 'subs':
            if (success || WOPR.intel.ussrSubsRevealed) {
                WOPR.intel.ussrSubsRevealed = true;
                addWOPREvent('intel', `◆ SONAR SWEEP: ${WOPR.assets.USSR.slbms} SLBM submarines detected`);
                addWOPREvent('intel', `◆ Patrol zones: Arctic Ocean, North Atlantic`);
                addWOPREvent('success', `★ TACTICAL ADVANTAGE: Enemy sub positions now tracked`);
            } else {
                addWOPREvent('info', '◆ SONAR INCONCLUSIVE: Thermal layers interfering');
            }
            break;
        case 'defenses':
            if (success || WOPR.intel.ussrDefensesRevealed) {
                WOPR.intel.ussrDefensesRevealed = true;
                addWOPREvent('intel', `◆ SIGINT ANALYSIS: ${WOPR.assets.USSR.interceptors} ABM interceptors identified`);
                addWOPREvent('intel', `◆ Moscow ABM ring: ACTIVE | Galosh system: OPERATIONAL`);
                addWOPREvent('success', `★ TACTICAL ADVANTAGE: -15% interception rate against our missiles`);
            } else {
                addWOPREvent('info', '◆ SIGINT INCONCLUSIVE: Encryption not broken');
            }
            break;
        case 'firstStrike':
            // Analyze AI state to predict first strike likelihood
            let strikeRisk = 0;
            strikeRisk += WOPR.aiAggression * 0.5; // Max 50 from aggression
            strikeRisk += (100 - WOPR.diplomacy.tension) * -0.2; // Low tension = low risk
            strikeRisk += WOPR.diplomacy.tension * 0.3; // High tension = high risk
            strikeRisk += (5 - WOPR.defcon) * 10; // Lower DEFCON = higher risk
            
            // Check for incoming missiles
            const ussrIncoming = WOPR.inFlight.filter(m => m.side === 'USSR').length;
            if (ussrIncoming > 0) strikeRisk = 100;
            
            let prediction;
            if (strikeRisk >= 80) {
                prediction = 'IMMINENT';
                WOPR.intel.firstStrikePrediction = 'imminent';
                addWOPREvent('alert', `⚠ CRITICAL: FIRST STRIKE IMMINENT`);
                addWOPREvent('warning', `◆ USSR forces at maximum readiness`);
                addWOPREvent('warning', `◆ Multiple ICBM silos showing launch preparation`);
            } else if (strikeRisk >= 50) {
                prediction = 'HIGH';
                WOPR.intel.firstStrikePrediction = 'high';
                addWOPREvent('warning', `⚠ WARNING: HIGH FIRST STRIKE PROBABILITY`);
                addWOPREvent('intel', `◆ Soviet bomber squadrons on runway alert`);
                addWOPREvent('intel', `◆ Submarine activity increased in Atlantic`);
            } else if (strikeRisk >= 25) {
                prediction = 'MEDIUM';
                WOPR.intel.firstStrikePrediction = 'medium';
                addWOPREvent('intel', `◆ ASSESSMENT: MODERATE FIRST STRIKE RISK`);
                addWOPREvent('intel', `◆ Soviet forces at elevated readiness`);
            } else {
                prediction = 'LOW';
                WOPR.intel.firstStrikePrediction = 'low';
                addWOPREvent('success', `★ ASSESSMENT: LOW FIRST STRIKE PROBABILITY`);
                addWOPREvent('intel', `◆ No unusual Soviet military activity detected`);
            }
            addWOPREvent('info', `◆ AI Aggression Index: ${WOPR.aiAggression} | Risk Score: ${Math.floor(strikeRisk)}`);
            break;
    }
    
    WOPR.phase = 'command';
    renderWOPRGame();
}

function executeDiplomacy(action) {
    const WOPR = window.WOPR;
    
    // Check for missiles in flight - can't de-escalate during nuclear exchange!
    const usaMissiles = WOPR.inFlight.filter(m => m.side === 'USA').length;
    const ussrMissiles = WOPR.inFlight.filter(m => m.side === 'USSR').length;
    
    if (action === 'deescalate' && (usaMissiles > 0 || ussrMissiles > 0)) {
        addWOPREvent('error', '⚠ DIPLOMATIC CHANNEL BLOCKED');
        addWOPREvent('warning', `◆ ${usaMissiles + ussrMissiles} nuclear weapons in flight - de-escalation impossible`);
        addWOPREvent('info', '◆ Moscow refuses to negotiate while under attack');
        WOPR.phase = 'command';
        renderWOPRGame();
        return;
    }
    
    WOPR.actionsRemaining--;
    
    switch(action) {
        case 'deescalate':
            const deescalateChance = WOPR.diplomacy.tension > 70 ? 0.15 : WOPR.diplomacy.tension > 40 ? 0.4 : 0.7;
            if (Math.random() < deescalateChance) {
                WOPR.diplomacy.tension = Math.max(0, WOPR.diplomacy.tension - 20);
                WOPR.diplomacy.negotiations++;
                WOPR.aiAggression = Math.max(0, WOPR.aiAggression - 15);
                addWOPREvent('success', '★ DIPLOMATIC SUCCESS: USSR agrees to mutual stand-down');
                addWOPREvent('info', `◆ Tension reduced. Both sides pulling back forces.`);
                if (WOPR.defcon < 5 && WOPR.diplomacy.tension < 30) {
                    WOPR.defcon = Math.min(5, WOPR.defcon + 1);
                    addWOPREvent('info', `◆ DEFCON lowered to ${WOPR.defcon}`);
                }
            } else {
                WOPR.diplomacy.tension = Math.min(100, WOPR.diplomacy.tension + 5);
                addWOPREvent('warning', '◆ DIPLOMATIC FAILURE: USSR rejects proposal');
                addWOPREvent('info', '◆ Kremlin views offer as sign of weakness');
            }
            break;
            
        case 'warning':
            WOPR.diplomacy.tension = Math.min(100, WOPR.diplomacy.tension + 15);
            WOPR.diplomacy.warnings++;
            WOPR.aiAggression = Math.max(0, WOPR.aiAggression - 10);
            addWOPREvent('warning', '★ WARNING TRANSMITTED TO MOSCOW');
            addWOPREvent('info', '◆ "Any attack will be met with overwhelming response"');
            addWOPREvent('info', '◆ USSR first-strike probability reduced');
            break;
            
        case 'intelligence':
            if (Math.random() < 0.5) {
                WOPR.diplomacy.tension = Math.max(0, WOPR.diplomacy.tension - 30);
                addWOPREvent('success', '★ INTELLIGENCE SHARING SUCCESSFUL');
                addWOPREvent('info', '◆ USSR acknowledges radar false alarm on their end');
                addWOPREvent('info', '◆ Both sides agree situation was misunderstanding');
            } else {
                WOPR.diplomacy.tension = Math.min(100, WOPR.diplomacy.tension + 10);
                WOPR.intel.accuracy = Math.max(0.3, WOPR.intel.accuracy - 0.2);
                addWOPREvent('alert', '⚠ INTELLIGENCE COMPROMISED');
                addWOPREvent('warning', '◆ USSR may have gained insight into our capabilities');
            }
            break;
    }
    
    WOPR.phase = 'command';
    renderWOPRGame();
}

function executeLaunch(weapon, targetIndex, targetCityName) {
    const WOPR = window.WOPR;
    const assets = WOPR.assets.USA;
    const ussrCities = window.WOPR_USSR_CITIES;
    const targetCity = ussrCities[targetIndex];
    const targetName = targetCityName || targetCity.name;
    
    // Check silo capacity (launch limit per turn)
    const maxLaunches = WOPR.siloCapacity.USA.launchesPerTurn;
    if (WOPR.launchesThisTurn >= maxLaunches) {
        addWOPREvent('error', `LAUNCH CAPACITY REACHED: Max ${maxLaunches} launches per turn (silo reload required)`);
        WOPR.phase = 'command';
        renderWOPRGame();
        return;
    }
    
    // Transit times
    const transitTime = weapon === 'bomber' ? 3 : 2;
    
    let launched = false;
    
    if (weapon === 'icbm' && assets.icbms > 0) {
        assets.icbms--;
        launched = true;
        WOPR.inFlight.push({
            side: 'USA',
            type: 'ICBM',
            target: targetName.toUpperCase(),
            targetIndex: targetIndex,
            targetCity: targetCity,
            turnsToImpact: transitTime,
            totalTransit: transitTime,
            launchTurn: WOPR.turn
        });
        addWOPREvent('launch', `★ ICBM LAUNCHED → ${targetName.toUpperCase()} (ETA: ${transitTime} weeks)`);
    } else if (weapon === 'slbm' && assets.slbms > 0) {
        assets.slbms--;
        launched = true;
        WOPR.inFlight.push({
            side: 'USA',
            type: 'SLBM',
            target: targetName.toUpperCase(),
            targetIndex: targetIndex,
            targetCity: targetCity,
            turnsToImpact: transitTime,
            totalTransit: transitTime,
            launchTurn: WOPR.turn
        });
        addWOPREvent('launch', `★ SLBM LAUNCHED → ${targetName.toUpperCase()} (ETA: ${transitTime} weeks)`);
    } else if (weapon === 'bomber' && assets.bombers > 0) {
        assets.bombers--;
        launched = true;
        WOPR.inFlight.push({
            side: 'USA',
            type: 'BOMBER',
            target: targetName.toUpperCase(),
            targetIndex: targetIndex,
            targetCity: targetCity,
            turnsToImpact: transitTime,
            totalTransit: transitTime,
            launchTurn: WOPR.turn
        });
        addWOPREvent('launch', `★ B-52 STEALTH BOMBER → ${targetName.toUpperCase()} (ETA: ${transitTime} weeks)`);
    }
    
    if (launched) {
        WOPR.actionsRemaining--;
        WOPR.launchesThisTurn++;
        WOPR.stats.USA.launched++;
        WOPR.aiAggression += 25;
        WOPR.diplomacy.tension = Math.min(100, WOPR.diplomacy.tension + 20);
        
        // Show remaining launch capacity
        const remaining = WOPR.siloCapacity.USA.launchesPerTurn - WOPR.launchesThisTurn;
        if (remaining > 0) {
            addWOPREvent('info', `◆ Silo capacity: ${remaining} more launch(es) available this turn`);
        } else {
            addWOPREvent('warning', `◆ All silos reloading - no more launches until next week`);
        }
    }
    
    WOPR.phase = 'command';
    renderWOPRGame();
}

function endTurn() {
    const WOPR = window.WOPR;
    
    WOPR.phase = 'resolution';
    addWOPREvent('info', `────────── WEEK ${WOPR.turn} ENDS ──────────`);
    
    // Track inaction (did player do anything offensive?)
    if (WOPR.launchesThisTurn === 0 && WOPR.stats.USA.launched === 0) {
        WOPR.inactionTurns++;
        if (WOPR.inactionTurns >= 5 && WOPR.inactionTurns % 3 === 0) {
            WOPR.aiAggression += 10;
            addWOPREvent('warning', `◆ INTEL: USSR military posture hardening (${WOPR.inactionTurns} weeks of standoff)`);
        }
        if (WOPR.inactionTurns >= 10) {
            addWOPREvent('alert', `⚠ USSR FIRST STRIKE PREPARATIONS DETECTED`);
            WOPR.aiAggression += 20;
        }
    } else {
        WOPR.inactionTurns = 0; // Reset if player took action
    }
    
    // Reset launches counter for next turn
    WOPR.launchesThisTurn = 0;
    
    // Auto-increase tension while missiles are in flight
    const usaMissiles = WOPR.inFlight.filter(m => m.side === 'USA').length;
    const ussrMissiles = WOPR.inFlight.filter(m => m.side === 'USSR').length;
    if (usaMissiles > 0 || ussrMissiles > 0) {
        const tensionIncrease = (usaMissiles + ussrMissiles) * 5;
        WOPR.diplomacy.tension = Math.min(100, WOPR.diplomacy.tension + tensionIncrease);
        addWOPREvent('alert', `⚠ GLOBAL TENSION RISING: ${usaMissiles + ussrMissiles} nuclear weapons in transit`);
    }
    
    // PRODUCTION PHASE - Both sides build warheads
    processProduction();
    
    processAITurn();
    processMissiles();
    
    if (checkVictoryConditions()) {
        return;
    }
    
    WOPR.turn++;
    WOPR.actionsRemaining = WOPR.maxActions;
    WOPR.phase = 'command';
    
    addWOPREvent('info', `────────── WEEK ${WOPR.turn} (${getGameDate()}) ──────────`);
    
    const incoming = WOPR.inFlight.filter(m => m.side === 'USSR' && m.turnsToImpact === 1);
    if (incoming.length > 0) {
        addWOPREvent('alert', `⚠ ${incoming.length} ENEMY MISSILE(S) ARRIVING THIS WEEK!`);
    }
    
    renderWOPRGame();
}

// Production - both sides build warheads over time
function processProduction() {
    const WOPR = window.WOPR;
    
    // US production (every 3 turns if industry is intact)
    const usIndustry = calculateIndustry('USA');
    if (WOPR.turn - WOPR.production.USA.lastBuild >= 3 && usIndustry > 30) {
        const produced = usIndustry > 60 ? 2 : 1;
        WOPR.assets.USA.icbms += produced;
        WOPR.production.USA.lastBuild = WOPR.turn;
        addWOPREvent('info', `◆ US PRODUCTION: +${produced} ICBM manufactured`);
    }
    
    // USSR production (every 2 turns - they're in full war production mode)
    const ussrIndustry = calculateIndustry('USSR');
    if (WOPR.turn - WOPR.production.USSR.lastBuild >= 2 && ussrIndustry > 20) {
        const produced = ussrIndustry > 50 ? 2 : 1;
        WOPR.assets.USSR.icbms += produced;
        WOPR.production.USSR.lastBuild = WOPR.turn;
        addWOPREvent('warning', `◆ INTEL: USSR produced +${produced} ICBM this week`);
    }
}

function calculateIndustry(side) {
    const WOPR = window.WOPR;
    let totalIndustry = 0;
    let totalDamage = 0;
    
    Object.values(WOPR.regions).forEach(region => {
        if (region.side === side) {
            totalIndustry += region.industry;
            totalDamage += region.damage * region.industry;
        }
    });
    
    return Math.max(0, totalIndustry - totalDamage);
}

// Build action - rush production
function executeBuild(type) {
    const WOPR = window.WOPR;
    
    if (WOPR.actionsRemaining <= 0) {
        addWOPREvent('error', 'NO ORDERS REMAINING THIS WEEK');
        renderWOPRGame();
        return;
    }
    
    WOPR.actionsRemaining--;
    
    switch(type) {
        case 'icbm':
            WOPR.assets.USA.icbms += 2;
            addWOPREvent('success', '★ RUSH ORDER: +2 ICBMs manufactured');
            break;
        case 'interceptor':
            WOPR.assets.USA.interceptors += 3;
            addWOPREvent('success', '★ RUSH ORDER: +3 Interceptors deployed');
            break;
        case 'bomber':
            WOPR.assets.USA.bombers += 1;
            addWOPREvent('success', '★ RUSH ORDER: +1 B-52 Bomber ready');
            break;
    }
    
    WOPR.phase = 'command';
    renderWOPRGame();
}

function processAITurn() {
    const WOPR = window.WOPR;
    const ai = WOPR.assets.USSR;
    let aiActionsRemaining = 2;
    
    // Update AI state
    if (WOPR.aiAggression > 80 || WOPR.defcon <= 1) {
        WOPR.aiState = 'aggressive';
    } else if (WOPR.aiAggression > 40 || WOPR.inFlight.some(m => m.side === 'USA')) {
        WOPR.aiState = 'retaliation';
    } else if (WOPR.aiAggression > 15) {
        WOPR.aiState = 'defensive';
    } else {
        WOPR.aiState = 'peaceful';
    }
    
    // Check for desperate mode
    let ussrDamage = 0;
    Object.values(WOPR.regions).forEach(r => {
        if (r.side === 'USSR') ussrDamage += r.damage;
    });
    if (ussrDamage > 1.0) {
        WOPR.aiState = 'desperate';
    }
    
    const stateMessages = {
        'peaceful': 'USSR forces at standard readiness',
        'defensive': 'USSR forces on heightened alert',
        'retaliation': 'USSR preparing retaliatory strike',
        'aggressive': 'USSR initiating offensive operations',
        'desperate': 'USSR launching full nuclear response'
    };
    addWOPREvent('intel', `◆ INTEL: ${stateMessages[WOPR.aiState]}`);
    
    const targets = ['usa_west', 'usa_central', 'usa_east'];
    const sortedTargets = targets.sort((a, b) => 
        WOPR.regions[a].damage - WOPR.regions[b].damage
    );
    
    switch (WOPR.aiState) {
        case 'peaceful':
            break;
        case 'defensive':
            if (Math.random() < 0.15 && ai.bombers > 0 && aiActionsRemaining > 0) {
                launchUSSRMissile('bomber', sortedTargets[0]);
                aiActionsRemaining--;
            }
            break;
        case 'retaliation':
            const usaLaunches = WOPR.inFlight.filter(m => m.side === 'USA').length;
            if (usaLaunches > 0 && ai.icbms > 0 && aiActionsRemaining > 0) {
                launchUSSRMissile('icbm', sortedTargets[0]);
                aiActionsRemaining--;
            }
            if (usaLaunches > 1 && ai.slbms > 0 && aiActionsRemaining > 0) {
                launchUSSRMissile('slbm', sortedTargets[1]);
                aiActionsRemaining--;
            }
            break;
        case 'aggressive':
            if (ai.icbms > 0 && aiActionsRemaining > 0) {
                launchUSSRMissile('icbm', sortedTargets[0]);
                aiActionsRemaining--;
            }
            if (Math.random() < 0.6 && ai.slbms > 0 && aiActionsRemaining > 0) {
                launchUSSRMissile('slbm', sortedTargets[1]);
                aiActionsRemaining--;
            }
            break;
        case 'desperate':
            if (ai.icbms > 0 && aiActionsRemaining > 0) {
                launchUSSRMissile('icbm', sortedTargets[0]);
                aiActionsRemaining--;
            }
            if (ai.icbms > 0 && aiActionsRemaining > 0) {
                launchUSSRMissile('icbm', sortedTargets[1]);
                aiActionsRemaining--;
            }
            break;
    }
}

function launchUSSRMissile(type, targetKey) {
    const WOPR = window.WOPR;
    const ai = WOPR.assets.USSR;
    const target = WOPR.regions[targetKey];
    const transitTime = type === 'bomber' ? 3 : 2;
    
    if (type === 'icbm' && ai.icbms > 0) {
        ai.icbms--;
        WOPR.inFlight.push({
            side: 'USSR', type: 'ICBM', target: target.name, targetKey,
            turnsToImpact: transitTime, totalTransit: transitTime, launchTurn: WOPR.turn
        });
        WOPR.stats.USSR.launched++;
        addWOPREvent('alert', `⚠ USSR ICBM LAUNCH DETECTED → ${target.name} (ETA: ${transitTime} weeks)`);
    } else if (type === 'slbm' && ai.slbms > 0) {
        ai.slbms--;
        WOPR.inFlight.push({
            side: 'USSR', type: 'SLBM', target: target.name, targetKey,
            turnsToImpact: transitTime, totalTransit: transitTime, launchTurn: WOPR.turn
        });
        WOPR.stats.USSR.launched++;
        addWOPREvent('alert', `⚠ USSR SLBM LAUNCH DETECTED → ${target.name} (ETA: ${transitTime} weeks)`);
    } else if (type === 'bomber' && ai.bombers > 0) {
        ai.bombers--;
        WOPR.inFlight.push({
            side: 'USSR', type: 'BOMBER', target: target.name, targetKey,
            turnsToImpact: transitTime, totalTransit: transitTime, launchTurn: WOPR.turn
        });
        WOPR.stats.USSR.launched++;
        addWOPREvent('alert', `⚠ USSR BOMBER SQUADRON LAUNCHED → ${target.name} (ETA: ${transitTime} weeks)`);
    }
    
    if (WOPR.defcon > 1) {
        WOPR.defcon = Math.max(1, WOPR.defcon - 1);
    }
}

function processMissiles() {
    const WOPR = window.WOPR;
    const toRemove = [];
    
    WOPR.inFlight.forEach((missile, index) => {
        missile.turnsToImpact--;
        
        if (missile.turnsToImpact <= 0) {
            const defender = missile.side === 'USA' ? 'USSR' : 'USA';
            const attacker = missile.side;
            const interceptors = WOPR.assets[defender].interceptors;
            
            let intercepted = false;
            if (interceptors > 0) {
                let interceptChance;
                switch(missile.type) {
                    case 'ICBM': interceptChance = 0.65; break;
                    case 'SLBM': interceptChance = 0.50; break;
                    case 'BOMBER': interceptChance = 0.35; break; // Stealth bombers hard to detect!
                    default: interceptChance = 0.60;
                }
                
                // INTEL BONUS: If we revealed their defenses, we can evade better (lower intercept chance)
                if (attacker === 'USA' && WOPR.intel.ussrDefensesRevealed) {
                    interceptChance -= 0.15;
                    if (missile.evadeBonus === undefined) {
                        addWOPREvent('intel', `◆ INTEL ADVANTAGE: Evading known ABM positions`);
                        missile.evadeBonus = true;
                    }
                }
                
                if (Math.random() < interceptChance) {
                    intercepted = true;
                    WOPR.assets[defender].interceptors--;
                    WOPR.stats[defender].intercepted++;
                    addWOPREvent('info', `✓ ${missile.type} INTERCEPTED over ${missile.target}`);
                }
            }
            
            if (!intercepted) {
                // Handle both city-based (US missiles) and region-based (USSR missiles) targeting
                let target;
                let targetCity = null;
                
                if (missile.targetCity) {
                    // US missile targeting USSR city - map to nearest region
                    targetCity = missile.targetCity;
                    // Map city to region based on location
                    if (targetCity.name === 'Moscow' || targetCity.name === 'Leningrad' || targetCity.name === 'Kiev') {
                        target = WOPR.regions.ussr_west;
                    } else if (targetCity.name === 'Sverdlovsk' || targetCity.name === 'Novosibirsk') {
                        target = WOPR.regions.ussr_central;
                    } else {
                        target = WOPR.regions.ussr_east;
                    }
                } else {
                    // USSR missile targeting US region
                    target = WOPR.regions[missile.targetKey];
                }
                
                if (!target) {
                    addWOPREvent('error', `◆ TARGETING ERROR: ${missile.target} - missile lost`);
                    toRemove.push(index);
                    return;
                }
                
                let damage;
                switch(missile.type) {
                    case 'ICBM': damage = 0.25; break;
                    case 'SLBM': damage = 0.20; break;
                    case 'BOMBER': damage = 0.30; break; // Precision bombing = high damage
                    default: damage = 0.20;
                }
                
                // INTEL BONUS: Revealed silos = better targeting = more damage
                if (attacker === 'USA' && WOPR.intel.ussrSilosRevealed) {
                    damage += 0.10;
                    addWOPREvent('intel', `◆ PRECISION STRIKE: Satellite targeting data applied`);
                }
                
                target.damage = Math.min(1, target.damage + damage);
                
                // INTEL BONUS: Better chance to hit silos when we know where they are
                let siloHitChance = 0.4;
                if (attacker === 'USA' && WOPR.intel.ussrSilosRevealed) {
                    siloHitChance = 0.65;
                }
                // BOMBER BONUS: Precision targeting = better silo destruction
                if (missile.type === 'BOMBER') {
                    siloHitChance += 0.20;
                    addWOPREvent('intel', `◆ PRECISION STRIKE: B-52 targeting military installations`);
                }
                
                if (target.silos > 0 && Math.random() < siloHitChance) {
                    target.silos--;
                    const silosDestroyed = WOPR.intel.ussrSilosRevealed ? 3 : 2;
                    if (missile.side === 'USA') {
                        WOPR.assets.USSR.icbms = Math.max(0, WOPR.assets.USSR.icbms - silosDestroyed);
                        addWOPREvent('intel', `◆ SILO DESTROYED: ${silosDestroyed} USSR ICBMs eliminated`);
                    } else {
                        WOPR.assets.USA.icbms = Math.max(0, WOPR.assets.USA.icbms - 2);
                    }
                }
                
                const casualties = Math.floor(target.pop * damage);
                WOPR.stats[missile.side].hits++;
                
                const victimSide = missile.side === 'USA' ? 'USSR' : 'USA';
                WOPR.stats[victimSide].casualties += casualties;
                
                addWOPREvent('impact', `✘ ${missile.type} IMPACT → ${missile.target} (${casualties}M casualties)`);
            }
            
            toRemove.push(index);
        }
    });
    
    toRemove.reverse().forEach(i => {
        WOPR.inFlight.splice(i, 1);
    });
}

function checkVictoryConditions() {
    const WOPR = window.WOPR;
    let usaPop = 0, ussrPop = 0;
    let usaCommand = 0, ussrCommand = 0;
    
    Object.values(WOPR.regions).forEach(r => {
        const remaining = Math.max(0, r.pop * (1 - r.damage));
        if (r.side === 'USA') {
            usaPop += remaining;
            if (r.damage < 0.9) usaCommand += r.command;
        }
        if (r.side === 'USSR') {
            ussrPop += remaining;
            if (r.damage < 0.9) ussrCommand += r.command;
        }
    });
    
    if (usaPop < 20 && ussrPop < 20) {
        showGameOver('MUTUAL ASSURED DESTRUCTION', 'draw');
        return true;
    }
    if (usaPop < 10 || usaCommand === 0) {
        showGameOver('UNITED STATES STRATEGIC DEFEAT', 'loss');
        return true;
    }
    if (ussrPop < 10 || ussrCommand === 0) {
        showGameOver('SOVIET UNION STRATEGIC DEFEAT', 'win');
        return true;
    }
    if (WOPR.turn >= 20 && WOPR.defcon >= 4 && WOPR.inFlight.length === 0) {
        showGameOver('PEACE THROUGH DETERRENCE', 'win');
        return true;
    }
    
    return false;
}

function addWOPREvent(type, message) {
    const WOPR = window.WOPR;
    WOPR.eventLog.push({
        type: type,
        message: `[T${String(WOPR.turn).padStart(2, '0')}] ${message}`,
        time: new Date()
    });
}

// Export functions
window.initWOPRGame = initWOPRGame;
window.getGameDate = getGameDate;
window.raiseAlert = raiseAlert;
window.executeRecon = executeRecon;
window.executeDiplomacy = executeDiplomacy;
window.executeLaunch = executeLaunch;
window.executeBuild = executeBuild;
window.endTurn = endTurn;
window.processAITurn = processAITurn;
window.launchUSSRMissile = launchUSSRMissile;
window.processMissiles = processMissiles;
window.checkVictoryConditions = checkVictoryConditions;
window.addWOPREvent = addWOPREvent;

