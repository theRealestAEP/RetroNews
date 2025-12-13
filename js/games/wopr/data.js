// ============================================
// WOPR Game Data - State, Constants, Map Data
// ============================================

const WOPR = {
    // Game state
    gameActive: false,
    turn: 0,
    phase: 'command',
    defcon: 5,
    playerSide: 'USA',
    
    // Action points per turn
    actionsRemaining: 3,
    maxActions: 3,
    
    // Game start date (Cold War era)
    startDate: new Date(1983, 0, 1),
    
    // Intel & Reconnaissance
    intel: {
        ussrSilosRevealed: false,
        ussrSubsRevealed: false,
        ussrDefensesRevealed: false,
        firstStrikePrediction: null, // null, 'low', 'medium', 'high', 'imminent'
        lastScanTurn: 0,
        accuracy: 0.5
    },
    
    // Submarine positioning
    subs: {
        USA: { atlantic: 2, pacific: 2, arctic: 0, detected: false },
        USSR: { atlantic: 1, pacific: 1, arctic: 2, detected: false }
    },
    
    // Diplomatic status
    diplomacy: {
        tension: 50,
        negotiations: 0,
        warnings: 0,
        hotlineActive: true
    },
    
    // Targeting strategy
    strategy: 'balanced',
    
    // Regions with data
    regions: {
        usa_west: { name: 'WEST COAST', shortName: 'LA', side: 'USA', pop: 45, industry: 35, silos: 2, subs: 2, radar: true, command: false, damage: 0 },
        usa_central: { name: 'MIDWEST', shortName: 'CHI', side: 'USA', pop: 55, industry: 55, silos: 4, subs: 0, radar: true, command: true, damage: 0 },
        usa_east: { name: 'EAST COAST', shortName: 'NYC', side: 'USA', pop: 90, industry: 65, silos: 3, subs: 2, radar: true, command: true, damage: 0 },
        ussr_west: { name: 'MOSCOW REGION', shortName: 'MOW', side: 'USSR', pop: 70, industry: 60, silos: 3, subs: 1, radar: true, command: true, damage: 0 },
        ussr_central: { name: 'URAL MOUNTAINS', shortName: 'URAL', side: 'USSR', pop: 25, industry: 35, silos: 5, subs: 0, radar: true, command: false, damage: 0 },
        ussr_east: { name: 'FAR EAST', shortName: 'VLA', side: 'USSR', pop: 35, industry: 25, silos: 2, subs: 3, radar: true, command: true, damage: 0 }
    },
    
    // Production & Capacity
    production: {
        USA: { rate: 1, lastBuild: 0 },  // +1 ICBM every 2 turns
        USSR: { rate: 1, lastBuild: 0 }
    },
    
    // Silo capacity (determines max launches per turn)
    siloCapacity: {
        USA: { total: 15, active: 15, launchesPerTurn: 3 },   // 1 launch per 5 silos
        USSR: { total: 19, active: 19, launchesPerTurn: 4 }
    },
    
    // Track launches this turn
    launchesThisTurn: 0,
    
    // Inaction counter (USSR gets aggressive if player does nothing)
    inactionTurns: 0,
    
    // Assets
    assets: {
        USA: {
            icbms: 24,
            slbms: 12,
            bombers: 16,
            interceptors: 20,
            satellites: 3,
            fuel: 100
        },
        USSR: {
            icbms: 28,
            slbms: 10,
            bombers: 14,
            interceptors: 18,
            satellites: 2,
            fuel: 100
        }
    },
    
    // Missiles in flight
    inFlight: [],
    
    // Event log
    eventLog: [],
    
    // AI state
    aiState: 'defensive',
    aiAggression: 0,
    aiPersonality: 'cautious',
    
    // Stats
    stats: {
        USA: { launched: 0, intercepted: 0, hits: 0, casualties: 0 },
        USSR: { launched: 0, intercepted: 0, hits: 0, casualties: 0 }
    }
};

// ============================================
// City Data for Map Display
// ============================================

const US_CITIES = [
    { name: 'Seattle', short: 'SEA', lon: -150, lat: 54, silos: 1 },
    { name: 'San Francisco', short: 'SFO', lon: -160, lat: 44, silos: 2 },
    { name: 'Los Angeles', short: 'LAX', lon: -156, lat: 40, silos: 2 },
    { name: 'Denver', short: 'DEN', lon: -144, lat: 46, silos: 4 },
    { name: 'Chicago', short: 'CHI', lon: -126, lat: 48, silos: 2 },
    { name: 'Houston', short: 'HOU', lon: -134, lat: 36, silos: 1 },
    { name: 'New York', short: 'NYC', lon: -110, lat: 45, silos: 2 },
    { name: 'Washington', short: 'DC', lon: -115, lat: 40, silos: 1 },
    { name: 'Miami', short: 'MIA', lon: -118, lat: 32, silos: 1 }
];

const USSR_CITIES = [
    { name: 'Moscow', short: 'MOW', lon: 22, lat: 62, silos: 3 },
    { name: 'Leningrad', short: 'LED', lon: 15, lat: 66, silos: 2 },
    { name: 'Kiev', short: 'KIV', lon: 15, lat: 57, silos: 2 },
    { name: 'Sverdlovsk', short: 'SVX', lon: 44, lat: 64, silos: 5 },
    { name: 'Novosibirsk', short: 'OVB', lon: 66, lat: 62, silos: 4 },
    { name: 'Vladivostok', short: 'VVO', lon: 98, lat: 50, silos: 2 },
    { name: 'Murmansk', short: 'MMK', lon: 18, lat: 74, silos: 1 }
];

// ============================================
// Missile Routes for Trajectory Drawing
// ============================================

const MISSILE_ROUTES = {
    // USSR cities (US missiles targeting them)
    'MOSCOW': { start: [-100, 45], end: [37, 55] },
    'LENINGRAD': { start: [-100, 45], end: [30, 60] },
    'KIEV': { start: [-100, 45], end: [30, 50] },
    'SVERDLOVSK': { start: [-100, 45], end: [60, 56] },
    'NOVOSIBIRSK': { start: [-100, 45], end: [82, 55] },
    'VLADIVOSTOK': { start: [-100, 45], end: [131, 43] },
    'MURMANSK': { start: [-100, 45], end: [33, 69] },
    // Legacy region names
    'URAL': { start: [-100, 45], end: [60, 56] },
    'SIBERIA': { start: [-100, 45], end: [82, 55] },
    'FAR EAST': { start: [-100, 45], end: [131, 43] },
    'MOSCOW REGION': { start: [-100, 45], end: [37, 55] },
    'URAL MOUNTAINS': { start: [-100, 45], end: [60, 56] },
    // US cities (USSR missiles targeting them)
    'SEATTLE': { start: [60, 55], end: [-122, 47] },
    'SAN FRANCISCO': { start: [60, 55], end: [-122, 37] },
    'LOS ANGELES': { start: [60, 55], end: [-118, 34] },
    'DENVER': { start: [60, 55], end: [-105, 40] },
    'CHICAGO': { start: [60, 55], end: [-87, 42] },
    'HOUSTON': { start: [60, 55], end: [-95, 30] },
    'NEW YORK': { start: [60, 55], end: [-74, 41] },
    'WASHINGTON': { start: [60, 55], end: [-77, 39] },
    'MIAMI': { start: [60, 55], end: [-80, 26] },
    // Legacy region names
    'WEST COAST': { start: [60, 55], end: [-120, 37] },
    'MIDWEST': { start: [60, 55], end: [-95, 40] },
    'EAST COAST': { start: [60, 55], end: [-75, 40] }
};

// ============================================
// Export to Window
// ============================================

window.WOPR = WOPR;
window.WOPR_US_CITIES = US_CITIES;
window.WOPR_USSR_CITIES = USSR_CITIES;
window.WOPR_MISSILE_ROUTES = MISSILE_ROUTES;
