// ============================================
// WOPR Map Drawing Functions
// ============================================

// Cache for the background image
let mapBackgroundImage = null;
let mapImageLoaded = false;

// Preload the map image
function preloadMapImage() {
    if (!mapBackgroundImage) {
        mapBackgroundImage = new Image();
        mapBackgroundImage.onload = () => {
            mapImageLoaded = true;
            drawWorldMap(); // Redraw once loaded
        };
        mapBackgroundImage.src = 'thumb-1920-692355.jpeg';
    }
}

// Call preload on script load
preloadMapImage();

function drawWorldMap() {
    const canvas = document.getElementById('world-map-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to container
    const container = canvas.parentElement;
    canvas.width = container.clientWidth || 900;
    canvas.height = container.clientHeight - 80 || 450;
    
    const w = canvas.width;
    const h = canvas.height;
    
    // Clear canvas with dark background
    ctx.fillStyle = '#000508';
    ctx.fillRect(0, 0, w, h);
    
    // Draw background image if loaded
    if (mapImageLoaded && mapBackgroundImage) {
        // Draw the map image, scaled to fit canvas
        ctx.globalAlpha = 0.85; // Slightly dim for CRT effect
        ctx.drawImage(mapBackgroundImage, 0, 0, w, h);
        ctx.globalAlpha = 1.0;
        
        // Add slight scan line effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for (let y = 0; y < h; y += 3) {
            ctx.fillRect(0, y, w, 1);
        }
    } else {
        // Fallback: draw grid while image loads
        drawGrid(ctx, w, h);
    }
    
    // Convert lat/long to canvas coordinates
    const scaleX = w / 360;
    const scaleY = h / 180;
    const toX = (lon) => (lon + 180) * scaleX;
    const toY = (lat) => (90 - lat) * scaleY;
    
    // Draw game elements on top of the map
    drawCities(ctx, toX, toY);
    drawRevealedAssets(ctx, toX, toY); // Draw silos/subs when discovered
    drawMissilesOnMap(ctx, toX, toY);
    drawDamageOnMap(ctx, toX, toY);
}

function drawGrid(ctx, w, h) {
    // Simple grid as fallback while image loads
    ctx.strokeStyle = '#0a1a1a';
    ctx.lineWidth = 0.5;
    
    for (let x = 0; x < w; x += w / 12) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }
    
    for (let y = 0; y < h; y += h / 8) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }
}

function drawCities(ctx, toX, toY) {
    ctx.shadowBlur = 8;
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    
    // US cities - cyan glow
    const usCities = window.WOPR_US_CITIES;
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    
    usCities.forEach(city => {
        const x = toX(city.lon);
        const y = toY(city.lat);
        
        // City dot with glow
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // City label
        ctx.shadowBlur = 4;
        ctx.fillText(city.short || city.name.substring(0, 3).toUpperCase(), x + 7, y + 3);
        ctx.shadowBlur = 8;
        
        // Silo indicators (small squares)
        if (city.silos) {
            ctx.fillStyle = '#00ff88';
            ctx.shadowColor = '#00ff88';
            for (let i = 0; i < Math.min(city.silos, 4); i++) {
                ctx.fillRect(x - 8 + i * 5, y + 8, 3, 3);
            }
            ctx.fillStyle = '#00ffff';
            ctx.shadowColor = '#00ffff';
        }
    });
    
    // USSR cities - red/orange glow
    const ussrCities = window.WOPR_USSR_CITIES;
    ctx.fillStyle = '#ff4444';
    ctx.shadowColor = '#ff4444';
    
    ussrCities.forEach(city => {
        const x = toX(city.lon);
        const y = toY(city.lat);
        
        // City dot with glow
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // City label
        ctx.shadowBlur = 4;
        ctx.fillText(city.short || city.name.substring(0, 3).toUpperCase(), x + 7, y + 3);
        ctx.shadowBlur = 8;
        
        // Show silos if intel revealed
        if (city.silos && window.WOPR.intel.ussrSilosRevealed) {
            ctx.fillStyle = '#ff6622';
            ctx.shadowColor = '#ff6622';
            for (let i = 0; i < Math.min(city.silos, 5); i++) {
                ctx.fillRect(x - 10 + i * 5, y + 8, 3, 3);
            }
            ctx.fillStyle = '#ff4444';
            ctx.shadowColor = '#ff4444';
        }
    });
    
    ctx.shadowBlur = 0;
}

function drawRevealedAssets(ctx, toX, toY) {
    const WOPR = window.WOPR;
    
    // Always draw US silos (friendly - cyan)
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#00ffff';
    ctx.strokeStyle = '#00aaaa';
    ctx.lineWidth = 1;
    
    const usSiloLocations = [
        { lon: -155, lat: 52, label: 'MINOT' },      // North Dakota
        { lon: -145, lat: 48, label: 'MALMST' },    // Montana
        { lon: -140, lat: 44, label: 'WARREN' },    // Wyoming
        { lon: -130, lat: 40, label: 'VANDEN' },    // California
    ];
    
    usSiloLocations.forEach(silo => {
        const x = toX(silo.lon);
        const y = toY(silo.lat);
        
        // Draw silo symbol (triangle pointing up)
        ctx.beginPath();
        ctx.moveTo(x, y - 5);
        ctx.lineTo(x - 4, y + 3);
        ctx.lineTo(x + 4, y + 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw label
        ctx.font = '6px monospace';
        ctx.fillStyle = '#00dddd';
        ctx.fillText(silo.label, x + 6, y);
    });
    
    // Always draw US subs (friendly - cyan diamonds)
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#00dddd';
    ctx.strokeStyle = '#00aaaa';
    
    const usSubLocations = [
        { lon: -165, lat: 35, label: 'PACFLT' },    // Pacific Fleet
        { lon: -105, lat: 28, label: 'GULF' },      // Gulf
        { lon: -85, lat: 42, label: 'ATLC' },       // Atlantic
    ];
    
    usSubLocations.forEach(sub => {
        const x = toX(sub.lon);
        const y = toY(sub.lat);
        
        // Draw sub symbol (diamond)
        ctx.beginPath();
        ctx.moveTo(x, y - 4);
        ctx.lineTo(x + 5, y);
        ctx.lineTo(x, y + 4);
        ctx.lineTo(x - 5, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw label
        ctx.font = '6px monospace';
        ctx.fillStyle = '#00dddd';
        ctx.fillText(sub.label, x + 8, y);
    });
    
    // Draw USSR silos when revealed
    if (WOPR.intel.ussrSilosRevealed) {
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#ff6600';
        ctx.fillStyle = '#ff6600';
        ctx.strokeStyle = '#ff3300';
        ctx.lineWidth = 1;
        
        // Silo locations (approximate military installations) - shifted left and up
        const siloLocations = [
            { lon: 40, lat: 66, label: 'URAL-1' },   // Ural region
            { lon: 45, lat: 62, label: 'URAL-2' },
            { lon: 60, lat: 64, label: 'SIB-1' },    // Siberia
            { lon: 70, lat: 60, label: 'SIB-2' },
            { lon: 25, lat: 60, label: 'MOW-1' },    // Moscow region
            { lon: 95, lat: 55, label: 'FAR-1' },    // Far East
        ];
        
        siloLocations.forEach(silo => {
            const x = toX(silo.lon);
            const y = toY(silo.lat);
            
            // Draw silo symbol (triangle)
            ctx.beginPath();
            ctx.moveTo(x, y - 6);
            ctx.lineTo(x - 5, y + 4);
            ctx.lineTo(x + 5, y + 4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Draw label
            ctx.font = '7px monospace';
            ctx.fillStyle = '#ff9900';
            ctx.fillText(silo.label, x + 8, y);
        });
    }
    
    // Draw USSR subs when revealed
    if (WOPR.intel.ussrSubsRevealed) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ff0066';
        ctx.fillStyle = '#ff0066';
        ctx.strokeStyle = '#cc0044';
        ctx.lineWidth = 1;
        
        // Sub patrol locations
        const subLocations = [
            { lon: -30, lat: 70, label: 'ARCT-1' },  // Arctic
            { lon: 10, lat: 72, label: 'ARCT-2' },
            { lon: -40, lat: 55, label: 'ATLC-1' },  // Atlantic
            { lon: 170, lat: 55, label: 'PAC-1' },   // Pacific
        ];
        
        subLocations.forEach(sub => {
            const x = toX(sub.lon);
            const y = toY(sub.lat);
            
            // Draw sub symbol (diamond)
            ctx.beginPath();
            ctx.moveTo(x, y - 5);
            ctx.lineTo(x + 6, y);
            ctx.lineTo(x, y + 5);
            ctx.lineTo(x - 6, y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Draw sonar ping circles
            ctx.strokeStyle = 'rgba(255, 0, 102, 0.3)';
            ctx.lineWidth = 1;
            const pulse = (Date.now() / 1000) % 1;
            ctx.beginPath();
            ctx.arc(x, y, 15 + pulse * 10, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw label
            ctx.font = '7px monospace';
            ctx.fillStyle = '#ff6699';
            ctx.fillText(sub.label, x + 10, y);
        });
    }
    
    ctx.shadowBlur = 0;
}

function drawMissilesOnMap(ctx, toX, toY) {
    const usaMissiles = window.WOPR.inFlight.filter(m => m.side === 'USA');
    const ussrMissiles = window.WOPR.inFlight.filter(m => m.side === 'USSR');
    const routes = window.WOPR_MISSILE_ROUTES;
    
    // Draw US missiles (cyan/green trail)
    usaMissiles.forEach(m => {
        const route = routes[m.target] || routes['MOSCOW'];
        const progress = 1 - (m.turnsToImpact / m.totalTransit);
        drawMissileTrajectory(ctx, toX, toY, route.start, route.end, progress, '#00ff88');
    });
    
    // Draw USSR missiles (red/orange trail)
    ussrMissiles.forEach(m => {
        const route = routes[m.target] || routes['MIDWEST'];
        const progress = 1 - (m.turnsToImpact / m.totalTransit);
        drawMissileTrajectory(ctx, toX, toY, route.start, route.end, progress, '#ff4422');
    });
}

function drawMissileTrajectory(ctx, toX, toY, start, end, progress, color) {
    const startX = toX(start[0]);
    const startY = toY(start[1]);
    const endX = toX(end[0]);
    const endY = toY(end[1]);
    
    const arcHeight = 50;
    
    // Draw full trajectory path (dotted)
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.02) {
        const x = startX + (endX - startX) * t;
        const y = startY + (endY - startY) * t - Math.sin(t * Math.PI) * arcHeight;
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    
    // Draw traveled path (solid with glow)
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let t = 0; t <= progress; t += 0.02) {
        const x = startX + (endX - startX) * t;
        const y = startY + (endY - startY) * t - Math.sin(t * Math.PI) * arcHeight;
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Draw missile head (bright dot)
    const currentX = startX + (endX - startX) * progress;
    const currentY = startY + (endY - startY) * progress - Math.sin(progress * Math.PI) * arcHeight;
    
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(currentX, currentY, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner colored dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(currentX, currentY, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
}

function drawDamageOnMap(ctx, toX, toY) {
    const regions = window.WOPR.regions;
    
    // Region center coordinates
    const regionCoords = {
        'usa_west': { lon: -120, lat: 37 },
        'usa_central': { lon: -95, lat: 40 },
        'usa_east': { lon: -77, lat: 40 },
        'ussr_west': { lon: 37, lat: 55 },
        'ussr_central': { lon: 60, lat: 56 },
        'ussr_east': { lon: 131, lat: 43 }
    };
    
    Object.keys(regions).forEach(key => {
        const region = regions[key];
        if (region.damage > 0) {
            const coord = regionCoords[key];
            if (coord) {
                const x = toX(coord.lon);
                const y = toY(coord.lat);
                
                // Pulsing damage indicator
                const pulse = 0.5 + Math.sin(Date.now() / 150) * 0.4;
                const radius = 15 + region.damage * 20;
                
                // Outer glow
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                gradient.addColorStop(0, `rgba(255, 60, 20, ${pulse * 0.6})`);
                gradient.addColorStop(0.5, `rgba(255, 100, 50, ${pulse * 0.3})`);
                gradient.addColorStop(1, 'rgba(255, 60, 20, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Inner ring
                ctx.strokeStyle = `rgba(255, 80, 30, ${pulse})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    });
}

// Export for use in other modules
window.drawWorldMap = drawWorldMap;
window.preloadMapImage = preloadMapImage;
