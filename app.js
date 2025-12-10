/**
 * RETRO TERMINAL v2.0
 * Multi-module terminal system with NEWS, WEATHER, and STOCKS
 * Authentic VT220/CRT aesthetic
 */

// ============================================
// Configuration & State
// ============================================

const state = {
    currentModule: null,
    menuIndex: 0,
    articles: [],
    selectedIndex: 0,
    weatherData: null,
    stockData: null,
    inputMode: false,
    inputCallback: null
};

const MODULES = [
    { id: 'news', name: 'NEWS', icon: '📰', description: 'NYT RSS NEWS FEED' },
    { id: 'weather', name: 'WEATHER', icon: '🌤', description: 'LOCAL WEATHER FORECAST' },
    { id: 'stocks', name: 'STOCKS', icon: '📈', description: 'STOCK MARKET DATA' }
];

// API Configurations
const RSS_API = 'https://api.rss2json.com/v1/api.json?rss_url=';
const WEATHER_API = 'https://wttr.in';
const STOCK_API = 'https://query1.finance.yahoo.com/v8/finance/chart/';

const NEWS_FEEDS = {
    home: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    world: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    us: 'https://rss.nytimes.com/services/xml/rss/nyt/US.xml',
    technology: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
    science: 'https://rss.nytimes.com/services/xml/rss/nyt/Science.xml',
    business: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',
    sports: 'https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml'
};

// DOM Elements
const output = document.getElementById('output');
const datetimeEl = document.getElementById('datetime');
const appTitle = document.getElementById('app-title');
const mainNav = document.getElementById('main-nav');
const navButtons = document.getElementById('nav-buttons');
const navLabel = document.getElementById('nav-label');
const footerHelp = document.getElementById('footer-help');

// ============================================
// Utility Functions
// ============================================

function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    datetimeEl.textContent = now.toLocaleString('en-US', options).toUpperCase();
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

function truncate(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

// ============================================
// Boot Sequence
// ============================================

async function showBootSequence() {
    const messages = [
        { text: '╔═══════════════════════════════════════════════════════════════╗', delay: 50 },
        { text: '║                                                               ║', delay: 20 },
        { text: '║   ██████╗ ███████╗████████╗██████╗  ██████╗                   ║', delay: 30 },
        { text: '║   ██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██╔═══██╗                  ║', delay: 30 },
        { text: '║   ██████╔╝█████╗     ██║   ██████╔╝██║   ██║                  ║', delay: 30 },
        { text: '║   ██╔══██╗██╔══╝     ██║   ██╔══██╗██║   ██║                  ║', delay: 30 },
        { text: '║   ██║  ██║███████╗   ██║   ██║  ██║╚██████╔╝                  ║', delay: 30 },
        { text: '║   ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝                   ║', delay: 30 },
        { text: '║                                                               ║', delay: 20 },
        { text: '║           ████████╗███████╗██████╗ ███╗   ███╗                ║', delay: 30 },
        { text: '║           ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║                ║', delay: 30 },
        { text: '║              ██║   █████╗  ██████╔╝██╔████╔██║                ║', delay: 30 },
        { text: '║              ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║                ║', delay: 30 },
        { text: '║              ██║   ███████╗██║  ██║██║ ╚═╝ ██║                ║', delay: 30 },
        { text: '║              ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝                ║', delay: 30 },
        { text: '║                                                               ║', delay: 20 },
        { text: '║                    VT220 TERMINAL EMULATOR                    ║', delay: 50 },
        { text: '║                         VERSION 2.0                           ║', delay: 50 },
        { text: '║                                                               ║', delay: 20 },
        { text: '╚═══════════════════════════════════════════════════════════════╝', delay: 50 },
        { text: '', delay: 200 },
        { text: 'INITIALIZING SYSTEM...', delay: 150 },
        { text: 'LOADING VT220 EMULATION LAYER........... [OK]', delay: 100 },
        { text: 'CALIBRATING PHOSPHOR DISPLAY............ [OK]', delay: 80 },
        { text: 'ESTABLISHING NETWORK CONNECTION......... [OK]', delay: 120 },
        { text: 'LOADING MODULE: NEWS.................... [OK]', delay: 80 },
        { text: 'LOADING MODULE: WEATHER................. [OK]', delay: 80 },
        { text: 'LOADING MODULE: STOCKS.................. [OK]', delay: 80 },
        { text: '', delay: 100 },
        { text: 'SYSTEM READY.', delay: 200 },
        { text: '', delay: 100 },
    ];

    output.innerHTML = '<div class="boot-text"></div>';
    const bootText = output.querySelector('.boot-text');
    
    for (const msg of messages) {
        const line = document.createElement('p');
        if (msg.text.includes('[OK]')) {
            const parts = msg.text.split('[OK]');
            line.innerHTML = `${escapeHtml(parts[0])}<span class="ok">[OK]</span>`;
        } else {
            line.textContent = msg.text;
        }
        bootText.appendChild(line);
        output.scrollTop = output.scrollHeight;
        await delay(msg.delay);
    }
    
    await delay(500);
}

// ============================================
// Main Menu
// ============================================

function showMainMenu() {
    state.currentModule = null;
    state.menuIndex = 0;
    
    appTitle.textContent = 'RETRO TERMINAL';
    mainNav.classList.add('hidden');
    
    footerHelp.innerHTML = `
        <span class="dim">[↑/↓] NAVIGATE</span> <span class="dim">|</span>
        <span class="dim">[ENTER] SELECT</span> <span class="dim">|</span>
        <span class="dim">[1-3] QUICK SELECT</span>
    `;
    
    output.innerHTML = `
        <div class="main-menu">
            <div class="menu-header">
                <p class="menu-title">═══ SELECT MODULE ═══</p>
                <p class="dim">USE ARROW KEYS TO NAVIGATE, ENTER TO SELECT</p>
            </div>
            <div class="menu-options">
                ${MODULES.map((mod, i) => `
                    <div class="menu-option ${i === 0 ? 'selected' : ''}" data-index="${i}">
                        <span class="menu-option-key">[${i + 1}]</span>
                        <span class="menu-option-icon">${mod.icon}</span>
                        <span class="menu-option-name">${mod.name}</span>
                        <span class="menu-option-desc dim">// ${mod.description}</span>
                    </div>
                `).join('')}
            </div>
            <div class="menu-footer">
                <p class="separator">────────────────────────────────────────────────────</p>
                <p class="dim blink">█ AWAITING INPUT...</p>
            </div>
        </div>
    `;
    
    updateMenuSelection();
}

function updateMenuSelection() {
    const options = document.querySelectorAll('.menu-option');
    options.forEach((opt, i) => {
        opt.classList.toggle('selected', i === state.menuIndex);
    });
}

function selectModule(index) {
    const mod = MODULES[index];
    if (!mod) return;
    
    state.currentModule = mod.id;
    
    switch (mod.id) {
        case 'news':
            initNewsModule();
            break;
        case 'weather':
            initWeatherModule();
            break;
        case 'stocks':
            initStocksModule();
            break;
    }
}

// ============================================
// NEWS MODULE
// ============================================

let currentNewsFeed = 'home';

async function initNewsModule() {
    appTitle.textContent = 'NEWS TERMINAL';
    
    mainNav.classList.remove('hidden');
    navLabel.textContent = 'SELECT FEED:';
    navButtons.innerHTML = `
        <button class="feed-btn active" data-feed="home">HOME</button>
        <button class="feed-btn" data-feed="world">WORLD</button>
        <button class="feed-btn" data-feed="us">U.S.</button>
        <button class="feed-btn" data-feed="technology">TECH</button>
        <button class="feed-btn" data-feed="science">SCIENCE</button>
        <button class="feed-btn" data-feed="business">BUSINESS</button>
        <button class="feed-btn" data-feed="sports">SPORTS</button>
    `;
    
    footerHelp.innerHTML = `
        <span class="dim">[ESC] MENU</span> <span class="dim">|</span>
        <span class="dim">[↑/↓] SCROLL</span> <span class="dim">|</span> 
        <span class="dim">[1-7] FEEDS</span> <span class="dim">|</span>
        <span class="dim">[R] REFRESH</span>
    `;
    
    // Setup feed button listeners
    document.querySelectorAll('.feed-btn').forEach(btn => {
        btn.addEventListener('click', () => loadNewsFeed(btn.dataset.feed));
    });
    
    await loadNewsFeed('home');
}

async function loadNewsFeed(feedKey) {
    currentNewsFeed = feedKey;
    state.selectedIndex = 0;
    
    // Update active button
    document.querySelectorAll('.feed-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.feed === feedKey);
    });
    
    output.innerHTML = `
        <p>CONNECTING TO NYT RSS GATEWAY...</p>
        <p class="loading">FETCHING ${feedKey.toUpperCase()} FEED</p>
        <p class="blink">█</p>
    `;
    
    try {
        const feedUrl = NEWS_FEEDS[feedKey];
        const response = await fetch(RSS_API + encodeURIComponent(feedUrl));
        const data = await response.json();
        
        if (data.status !== 'ok') throw new Error('Feed unavailable');
        
        state.articles = data.items;
        renderNewsArticles(data.items, feedKey);
    } catch (error) {
        output.innerHTML = `
            <div class="error">
                <p>*** ERROR ***</p>
                <p>FAILED TO FETCH NEWS FEED</p>
                <p>PRESS [R] TO RETRY</p>
            </div>
        `;
    }
}

function renderNewsArticles(items, feedKey) {
    const feedNames = {
        home: 'HOME PAGE', world: 'WORLD NEWS', us: 'U.S. NEWS',
        technology: 'TECHNOLOGY', science: 'SCIENCE', business: 'BUSINESS', sports: 'SPORTS'
    };
    
    output.innerHTML = `
        <div class="news-container">
            <div class="category-header">
                <span class="category-title">═══ ${feedNames[feedKey]} ═══</span>
                <span class="category-count dim"> // ${items.length} ARTICLES</span>
            </div>
            <div class="separator">────────────────────────────────────────────────────────────────────</div>
            ${items.map((item, i) => {
                const desc = stripHtml(item.description || '');
                const date = item.pubDate ? new Date(item.pubDate).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                }).toUpperCase() : '';
                return `
                    <div class="news-item ${i === 0 ? 'selected' : ''}" data-index="${i}">
                        <span class="news-item-number dim">[${String(i + 1).padStart(2, '0')}]</span>
                        <span class="news-item-title">${escapeHtml(item.title)}</span>
                        <div class="news-item-meta dim">BY: ${escapeHtml((item.author || 'NYT').toUpperCase())} | ${date}</div>
                        <div class="news-item-description">${escapeHtml(truncate(desc, 250))}</div>
                    </div>
                `;
            }).join('')}
            <div class="separator">────────────────────────────────────────────────────────────────────</div>
            <p class="dim" style="text-align:center">*** END OF FEED ***</p>
        </div>
    `;
}

// ============================================
// WEATHER MODULE
// ============================================

async function initWeatherModule() {
    appTitle.textContent = 'WEATHER CHANNEL';
    mainNav.classList.add('hidden');
    
    footerHelp.innerHTML = `
        <span class="dim">[ESC] MENU</span> <span class="dim">|</span>
        <span class="dim">[R] NEW LOCATION</span>
    `;
    
    showWeatherInput();
}

function showWeatherInput() {
    output.innerHTML = `
        <div class="weather-input-screen">
            <div class="weather-channel-header">
                <div class="weather-logo">
                    <div class="weather-logo-box">THE</div>
                    <div class="weather-logo-box">WEATHER</div>
                    <div class="weather-logo-box accent">CHANNEL</div>
                </div>
            </div>
            <div class="input-section">
                <p class="input-prompt">╔════════════════════════════════════════╗</p>
                <p class="input-prompt">║   ENTER YOUR ZIP CODE OR CITY NAME     ║</p>
                <p class="input-prompt">╚════════════════════════════════════════╝</p>
                <div class="terminal-input-container">
                    <span class="prompt">&gt;</span>
                    <input type="text" id="weather-input" class="terminal-input" 
                           placeholder="e.g., 10001 or New York" maxlength="50" autofocus>
                </div>
                <p class="dim" style="margin-top: 15px;">PRESS [ENTER] TO SEARCH</p>
            </div>
        </div>
    `;
    
    const input = document.getElementById('weather-input');
    input.focus();
    
    input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
            await fetchWeather(input.value.trim());
        }
    });
}

async function fetchWeather(location) {
    output.innerHTML = `
        <div class="weather-loading">
            <p>CONNECTING TO WEATHER SATELLITE...</p>
            <p class="loading">FETCHING DATA FOR: ${escapeHtml(location.toUpperCase())}</p>
            <p class="blink">█</p>
        </div>
    `;
    
    try {
        // Using wttr.in for weather data (free, no API key needed)
        const response = await fetch(`${WEATHER_API}/${encodeURIComponent(location)}?format=j1`);
        if (!response.ok) throw new Error('Location not found');
        
        const data = await response.json();
        renderWeatherDisplay(data, location);
    } catch (error) {
        output.innerHTML = `
            <div class="error">
                <p>*** WEATHER ERROR ***</p>
                <p>COULD NOT FIND LOCATION: ${escapeHtml(location.toUpperCase())}</p>
                <p>PLEASE CHECK SPELLING AND TRY AGAIN</p>
                <p></p>
                <p class="dim">PRESS [R] TO TRY ANOTHER LOCATION</p>
            </div>
        `;
    }
}

function renderWeatherDisplay(data, location) {
    const current = data.current_condition[0];
    const area = data.nearest_area[0];
    const forecast = data.weather.slice(0, 3);
    
    const cityName = area.areaName[0].value.toUpperCase();
    const region = area.region[0].value.toUpperCase();
    const country = area.country[0].value.toUpperCase();
    
    const tempF = current.temp_F;
    const tempC = current.temp_C;
    const condition = current.weatherDesc[0].value.toUpperCase();
    const humidity = current.humidity;
    const windMph = current.windspeedMiles;
    const windDir = current.winddir16Point;
    const feelsLikeF = current.FeelsLikeF;
    const visibility = current.visibility;
    const pressure = current.pressure;
    
    // Get weather icon
    const weatherCode = parseInt(current.weatherCode);
    const weatherIcon = getWeatherAsciiArt(weatherCode);
    
    output.innerHTML = `
        <div class="weather-display">
            <div class="weather-channel-bar">
                <div class="weather-channel-logo">
                    <span class="logo-the">THE</span>
                    <span class="logo-weather">WEATHER</span>
                    <span class="logo-channel">CHANNEL</span>
                </div>
                <div class="weather-location-time">
                    <span class="weather-time">${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>
            
            <div class="weather-main">
                <div class="weather-left">
                    <div class="weather-location-header">
                        <p class="weather-city">${cityName}</p>
                        <p class="weather-region dim">${region}, ${country}</p>
                    </div>
                    
                    <div class="weather-current">
                        <div class="weather-temp-large">${tempF}°</div>
                        <div class="weather-condition">${condition}</div>
                    </div>
                    
                    <div class="weather-details">
                        <div class="weather-detail-row">
                            <span class="dim">FEELS LIKE:</span> <span>${feelsLikeF}°F</span>
                        </div>
                        <div class="weather-detail-row">
                            <span class="dim">HUMIDITY:</span> <span>${humidity}%</span>
                        </div>
                        <div class="weather-detail-row">
                            <span class="dim">WIND:</span> <span>${windDir} ${windMph} MPH</span>
                        </div>
                        <div class="weather-detail-row">
                            <span class="dim">VISIBILITY:</span> <span>${visibility} MI</span>
                        </div>
                        <div class="weather-detail-row">
                            <span class="dim">PRESSURE:</span> <span>${pressure} MB</span>
                        </div>
                    </div>
                </div>
                
                <div class="weather-right">
                    <pre class="weather-ascii">${weatherIcon}</pre>
                </div>
            </div>
            
            <div class="weather-forecast">
                <div class="forecast-header">═══ 3-DAY FORECAST ═══</div>
                <div class="forecast-days">
                    ${forecast.map((day, i) => {
                        const date = new Date(day.date);
                        const dayName = i === 0 ? 'TODAY' : date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                        const high = day.maxtempF;
                        const low = day.mintempF;
                        const desc = day.hourly[4].weatherDesc[0].value.toUpperCase();
                        return `
                            <div class="forecast-day">
                                <div class="forecast-day-name">${dayName}</div>
                                <div class="forecast-temps">
                                    <span class="forecast-high">${high}°</span>
                                    <span class="forecast-low dim">${low}°</span>
                                </div>
                                <div class="forecast-desc dim">${truncate(desc, 15)}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <div class="weather-footer">
                <div class="weather-crawl">
                    <span class="crawl-text">LOCAL FORECAST ★ ${cityName} ★ CURRENT TEMP: ${tempF}°F ★ ${condition} ★ WIND: ${windDir} AT ${windMph} MPH ★ HUMIDITY: ${humidity}% ★</span>
                </div>
            </div>
        </div>
    `;
}

function getWeatherAsciiArt(code) {
    // Weather codes from wttr.in
    if (code === 113) { // Clear/Sunny
        return `
    \\   /
     .-.
  ‒ (   ) ‒
     \`-᾿
    /   \\
        `;
    } else if ([116, 119].includes(code)) { // Partly cloudy
        return `
   \\  /
 _ /"\`.-.
   \\_(   ).
   /(___(__) 
        `;
    } else if ([122, 143, 248, 260].includes(code)) { // Cloudy/Overcast/Fog
        return `
             
     .--.
  .-(    ).
 (___.__)__)
             
        `;
    } else if ([176, 263, 266, 293, 296, 299, 302, 305, 308, 311, 314, 353, 356, 359].includes(code)) { // Rain
        return `
     .-.
    (   ).
   (___(__)
    ʻ ʻ ʻ ʻ
   ʻ ʻ ʻ ʻ
        `;
    } else if ([179, 182, 185, 227, 230, 317, 320, 323, 326, 329, 332, 335, 338, 350, 362, 365, 368, 371, 374, 377].includes(code)) { // Snow
        return `
     .-.
    (   ).
   (___(__)
    * * * *
   * * * *
        `;
    } else if ([200, 386, 389, 392, 395].includes(code)) { // Thunderstorm
        return `
     .-.
    (   ).
   (___(__)
   ⚡ʻ ⚡ʻ ⚡
    ʻ ʻ ʻ
        `;
    } else {
        return `
     .-.
    (   ).
   (___(__)
             
             
        `;
    }
}

// ============================================
// STOCKS MODULE
// ============================================

async function initStocksModule() {
    appTitle.textContent = 'STOCK TICKER';
    mainNav.classList.add('hidden');
    
    footerHelp.innerHTML = `
        <span class="dim">[ESC] MENU</span> <span class="dim">|</span>
        <span class="dim">[R] NEW TICKER</span>
    `;
    
    showStockInput();
}

function showStockInput() {
    output.innerHTML = `
        <div class="stock-input-screen">
            <div class="stock-header">
                <pre class="stock-logo">
╔═╗╔╦╗╔═╗╔═╗╦╔═  ╔╦╗╦╔═╗╦╔═╔═╗╦═╗
╚═╗ ║ ║ ║║  ╠╩╗   ║ ║║  ╠╩╗║╣ ╠╦╝
╚═╝ ╩ ╚═╝╚═╝╩ ╩   ╩ ╩╚═╝╩ ╩╚═╝╩╚═
                </pre>
            </div>
            <div class="input-section">
                <p class="input-prompt">╔════════════════════════════════════════╗</p>
                <p class="input-prompt">║      ENTER STOCK TICKER SYMBOL         ║</p>
                <p class="input-prompt">╚════════════════════════════════════════╝</p>
                <div class="terminal-input-container">
                    <span class="prompt">&gt;</span>
                    <input type="text" id="stock-input" class="terminal-input" 
                           placeholder="e.g., AAPL, GOOGL, MSFT" maxlength="10" autofocus
                           style="text-transform: uppercase;">
                </div>
                <p class="dim" style="margin-top: 15px;">PRESS [ENTER] TO SEARCH</p>
                <div class="popular-tickers">
                    <p class="dim" style="margin-top: 20px;">POPULAR TICKERS:</p>
                    <p>AAPL • GOOGL • MSFT • AMZN • TSLA • NVDA • META</p>
                </div>
            </div>
        </div>
    `;
    
    const input = document.getElementById('stock-input');
    input.focus();
    
    input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
            await fetchStock(input.value.trim().toUpperCase());
        }
    });
}

async function fetchStock(ticker) {
    output.innerHTML = `
        <div class="stock-loading">
            <p>CONNECTING TO MARKET DATA FEED...</p>
            <p class="loading">FETCHING DATA FOR: ${escapeHtml(ticker)}</p>
            <p class="blink">█</p>
        </div>
    `;
    
    try {
        // Using a CORS proxy for Yahoo Finance
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1mo`;
        
        const response = await fetch(proxyUrl + encodeURIComponent(yahooUrl));
        if (!response.ok) throw new Error('Ticker not found');
        
        const data = await response.json();
        
        if (data.chart.error) {
            throw new Error(data.chart.error.description);
        }
        
        renderStockDisplay(data.chart.result[0], ticker);
    } catch (error) {
        output.innerHTML = `
            <div class="error">
                <p>*** STOCK ERROR ***</p>
                <p>COULD NOT FIND TICKER: ${escapeHtml(ticker)}</p>
                <p>PLEASE CHECK SYMBOL AND TRY AGAIN</p>
                <p></p>
                <p class="dim">PRESS [R] TO TRY ANOTHER TICKER</p>
            </div>
        `;
    }
}

function renderStockDisplay(data, ticker) {
    const meta = data.meta;
    const quote = data.indicators.quote[0];
    const timestamps = data.timestamp;
    const closes = quote.close.filter(c => c !== null);
    
    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.chartPreviousClose || meta.previousClose;
    const change = currentPrice - previousClose;
    const changePercent = ((change / previousClose) * 100);
    const isPositive = change >= 0;
    
    const high = Math.max(...quote.high.filter(h => h !== null));
    const low = Math.min(...quote.low.filter(l => l !== null));
    const volume = quote.volume.reduce((a, b) => a + (b || 0), 0);
    
    // Generate ASCII chart (wider for better resolution)
    const chart = generateAsciiChart(closes, 60, 18);
    
    const changeSymbol = isPositive ? '▲' : '▼';
    const changeClass = isPositive ? 'positive' : 'negative';
    
    output.innerHTML = `
        <div class="stock-display">
            <div class="stock-header-bar">
                <div class="stock-ticker-large">${ticker}</div>
                <div class="stock-company-name dim">${meta.shortName || meta.symbol}</div>
            </div>
            
            <div class="stock-main">
                <div class="stock-price-section">
                    <div class="stock-current-price">$${currentPrice.toFixed(2)}</div>
                    <div class="stock-change ${changeClass}">
                        ${changeSymbol} ${Math.abs(change).toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)
                    </div>
                </div>
                
                <div class="stock-stats">
                    <div class="stock-stat">
                        <span class="dim">PREV CLOSE:</span> $${previousClose.toFixed(2)}
                    </div>
                    <div class="stock-stat">
                        <span class="dim">DAY HIGH:</span> $${high.toFixed(2)}
                    </div>
                    <div class="stock-stat">
                        <span class="dim">DAY LOW:</span> $${low.toFixed(2)}
                    </div>
                    <div class="stock-stat">
                        <span class="dim">VOLUME:</span> ${formatVolume(volume)}
                    </div>
                </div>
            </div>
            
            <div class="stock-chart-section">
                <div class="chart-header">═══ 1-MONTH PRICE CHART ═══</div>
                <pre class="stock-chart">${chart}</pre>
                <div class="chart-footer dim">
                    <span>1 MONTH AGO</span>
                    <span>TODAY</span>
                </div>
            </div>
            
            <div class="stock-footer">
                <p class="dim">DATA DELAYED 15 MINUTES • MARKET ${meta.marketState === 'REGULAR' ? 'OPEN' : 'CLOSED'}</p>
                <p class="dim">LAST UPDATED: ${new Date().toLocaleString('en-US').toUpperCase()}</p>
            </div>
        </div>
    `;
}

function generateAsciiChart(data, width, height) {
    if (!data || data.length === 0) return 'NO DATA AVAILABLE';
    
    // Filter out any remaining nulls/undefined and ensure we have valid data
    const validData = data.filter(d => d !== null && d !== undefined && !isNaN(d));
    if (validData.length === 0) return 'NO DATA AVAILABLE';
    
    const min = Math.min(...validData);
    const max = Math.max(...validData);
    const range = max - min || 1;
    
    // Resample data using linear interpolation for smoother results
    const samples = [];
    for (let i = 0; i < width; i++) {
        // Map chart position to data position
        const dataIndex = (i / (width - 1)) * (validData.length - 1);
        const lowerIndex = Math.floor(dataIndex);
        const upperIndex = Math.min(lowerIndex + 1, validData.length - 1);
        const fraction = dataIndex - lowerIndex;
        
        // Linear interpolation between two nearest data points
        const interpolatedValue = validData[lowerIndex] * (1 - fraction) + validData[upperIndex] * fraction;
        samples.push(interpolatedValue);
    }
    
    // Create chart grid
    const chart = [];
    for (let y = 0; y < height; y++) {
        chart.push(new Array(width).fill(' '));
    }
    
    // Plot data points and connect them with lines
    let prevY = null;
    for (let x = 0; x < samples.length; x++) {
        const normalized = (samples[x] - min) / range;
        const y = Math.floor((1 - normalized) * (height - 1));
        
        // Draw vertical line connecting to previous point for smoother chart
        if (prevY !== null) {
            const minY = Math.min(prevY, y);
            const maxY = Math.max(prevY, y);
            for (let connectY = minY; connectY <= maxY; connectY++) {
                if (chart[connectY][x - 1] === ' ') {
                    chart[connectY][x - 1] = '│';
                }
            }
        }
        
        // Plot the main data point
        chart[y][x] = '█';
        
        // Fill below for area chart effect
        for (let fillY = y + 1; fillY < height; fillY++) {
            chart[fillY][x] = '░';
        }
        
        prevY = y;
    }
    
    // Add Y-axis labels
    const lines = [];
    const priceStep = range / (height - 1);
    
    for (let y = 0; y < height; y++) {
        const price = max - (y * priceStep);
        const label = y === 0 || y === height - 1 || y === Math.floor(height / 2)
            ? `$${price.toFixed(0).padStart(5)}│`
            : '      │';
        lines.push(label + chart[y].join(''));
    }
    
    // Add X-axis
    lines.push('      └' + '─'.repeat(width));
    
    return lines.join('\n');
}

function formatVolume(vol) {
    if (vol >= 1e9) return (vol / 1e9).toFixed(2) + 'B';
    if (vol >= 1e6) return (vol / 1e6).toFixed(2) + 'M';
    if (vol >= 1e3) return (vol / 1e3).toFixed(2) + 'K';
    return vol.toString();
}

// ============================================
// Keyboard Navigation
// ============================================

function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        // Don't intercept when typing in input
        if (e.target.tagName === 'INPUT') {
            if (e.key === 'Escape') {
                e.target.blur();
                showMainMenu();
            }
            return;
        }
        
        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                showMainMenu();
                break;
                
            case 'ArrowUp':
            case 'k':
                e.preventDefault();
                if (!state.currentModule) {
                    state.menuIndex = Math.max(0, state.menuIndex - 1);
                    updateMenuSelection();
                } else if (state.currentModule === 'news') {
                    state.selectedIndex = Math.max(0, state.selectedIndex - 1);
                    updateNewsSelection();
                }
                break;
                
            case 'ArrowDown':
            case 'j':
                e.preventDefault();
                if (!state.currentModule) {
                    state.menuIndex = Math.min(MODULES.length - 1, state.menuIndex + 1);
                    updateMenuSelection();
                } else if (state.currentModule === 'news') {
                    state.selectedIndex = Math.min(state.articles.length - 1, state.selectedIndex + 1);
                    updateNewsSelection();
                }
                break;
                
            case 'Enter':
                e.preventDefault();
                if (!state.currentModule) {
                    selectModule(state.menuIndex);
                }
                break;
                
            case 'r':
            case 'R':
                e.preventDefault();
                if (state.currentModule === 'news') {
                    loadNewsFeed(currentNewsFeed);
                } else if (state.currentModule === 'weather') {
                    showWeatherInput();
                } else if (state.currentModule === 'stocks') {
                    showStockInput();
                }
                break;
                
            case '1':
            case '2':
            case '3':
                if (!state.currentModule) {
                    e.preventDefault();
                    selectModule(parseInt(e.key) - 1);
                } else if (state.currentModule === 'news') {
                    handleNewsFeedKey(e.key);
                }
                break;
                
            case '4':
            case '5':
            case '6':
            case '7':
                if (state.currentModule === 'news') {
                    e.preventDefault();
                    handleNewsFeedKey(e.key);
                }
                break;
        }
    });
}

function handleNewsFeedKey(key) {
    const feeds = ['home', 'world', 'us', 'technology', 'science', 'business', 'sports'];
    const index = parseInt(key) - 1;
    if (feeds[index]) {
        loadNewsFeed(feeds[index]);
    }
}

function updateNewsSelection() {
    const items = document.querySelectorAll('.news-item');
    items.forEach((item, i) => {
        item.classList.toggle('selected', i === state.selectedIndex);
    });
    items[state.selectedIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============================================
// Initialization
// ============================================

async function init() {
    // Start datetime updates
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Setup keyboard navigation
    setupKeyboardNavigation();
    
    // Boot sequence
    await showBootSequence();
    
    // Show main menu
    showMainMenu();
}

// Start the application
document.addEventListener('DOMContentLoaded', init);
