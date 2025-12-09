/**
 * RetroNews VT220 Terminal RSS Reader
 * Fetches and displays NYT RSS feeds with authentic terminal aesthetics
 */

// RSS Feed URLs (using RSS2JSON API to handle CORS)
const RSS_API = 'https://api.rss2json.com/v1/api.json?rss_url=';

const FEEDS = {
    home: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    world: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    us: 'https://rss.nytimes.com/services/xml/rss/nyt/US.xml',
    technology: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
    science: 'https://rss.nytimes.com/services/xml/rss/nyt/Science.xml',
    business: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',
    sports: 'https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml'
};

const FEED_NAMES = {
    home: 'HOME PAGE',
    world: 'WORLD NEWS',
    us: 'U.S. NEWS',
    technology: 'TECHNOLOGY',
    science: 'SCIENCE',
    business: 'BUSINESS',
    sports: 'SPORTS'
};

// State
let currentFeed = 'home';
let articles = [];
let selectedIndex = 0;

// DOM Elements
const output = document.getElementById('output');
const datetimeEl = document.getElementById('datetime');

// ============================================
// Utility Functions
// ============================================

function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'short', 
        year: 'numeric', 
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
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleString('en-US', options).toUpperCase();
}

// ============================================
// Terminal Effects
// ============================================

async function typeText(element, text, speed = 10) {
    element.textContent = '';
    for (let i = 0; i < text.length; i++) {
        element.textContent += text[i];
        if (speed > 0) await delay(speed);
    }
}

async function showBootSequence() {
    const messages = [
        { text: 'RETRONEWS TERMINAL v1.0', delay: 100 },
        { text: '========================', delay: 50 },
        { text: '', delay: 100 },
        { text: 'INITIALIZING VT220 EMULATION...', delay: 200 },
        { text: 'LOADING PHOSPHOR DISPLAY DRIVER... [OK]', delay: 150 },
        { text: 'CALIBRATING CRT GEOMETRY... [OK]', delay: 100 },
        { text: 'CONNECTING TO NYT RSS GATEWAY...', delay: 300 },
        { text: '', delay: 100 },
        { text: 'CONNECTION ESTABLISHED.', delay: 200 },
        { text: 'FETCHING NEWS FEED...', delay: 100 },
    ];

    output.innerHTML = '';
    
    for (const msg of messages) {
        const p = document.createElement('p');
        if (msg.text.includes('[OK]')) {
            const parts = msg.text.split('[OK]');
            p.innerHTML = `${escapeHtml(parts[0])}<span class="ok">[OK]</span>${escapeHtml(parts[1] || '')}`;
        } else {
            p.textContent = msg.text;
        }
        output.appendChild(p);
        await delay(msg.delay);
    }
}

// ============================================
// RSS Fetching
// ============================================

async function fetchFeed(feedKey) {
    const feedUrl = FEEDS[feedKey];
    const apiUrl = RSS_API + encodeURIComponent(feedUrl);
    
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (data.status !== 'ok') {
            throw new Error(data.message || 'Failed to parse feed');
        }
        
        return data.items;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

// ============================================
// Rendering
// ============================================

function renderArticles(items, feedKey) {
    articles = items;
    selectedIndex = 0;
    
    output.innerHTML = '';
    
    // Category header
    const header = document.createElement('div');
    header.className = 'category-header';
    header.innerHTML = `
        <span class="category-title">═══ ${FEED_NAMES[feedKey]} ═══</span>
        <span class="category-count"> // ${items.length} ARTICLES LOADED</span>
    `;
    output.appendChild(header);
    
    // Separator
    const sep = document.createElement('div');
    sep.className = 'separator';
    sep.textContent = '────────────────────────────────────────────────────────────────────';
    output.appendChild(sep);
    
    // Articles
    items.forEach((item, index) => {
        const article = document.createElement('div');
        article.className = 'news-item' + (index === 0 ? ' selected' : '');
        article.dataset.index = index;
        article.dataset.url = item.link;
        
        const description = stripHtml(item.description || item.content || '');
        const pubDate = item.pubDate ? formatDate(item.pubDate) : '';
        const author = item.author || 'NYT';
        
        article.innerHTML = `
            <span class="news-item-number">[${String(index + 1).padStart(2, '0')}]</span>
            <span class="news-item-title">${escapeHtml(item.title)}</span>
            <div class="news-item-meta">
                <span class="dim">BY:</span> ${escapeHtml(author.toUpperCase())} 
                <span class="dim">|</span> 
                <span class="dim">DATE:</span> ${pubDate}
            </div>
            <div class="news-item-description">${escapeHtml(truncate(description, 280))}</div>
            <div class="news-item-link"><span class="dim">└─▶</span> ${escapeHtml(truncate(item.link, 60))}</div>
        `;
        
        article.addEventListener('click', () => openArticle(index));
        output.appendChild(article);
    });
    
    // Footer separator
    const footerSep = document.createElement('div');
    footerSep.className = 'separator';
    footerSep.textContent = '────────────────────────────────────────────────────────────────────';
    output.appendChild(footerSep);
    
    // End message
    const endMsg = document.createElement('p');
    endMsg.innerHTML = '<span class="dim">*** END OF FEED ***</span>';
    endMsg.style.textAlign = 'center';
    output.appendChild(endMsg);
}

function renderError(error) {
    output.innerHTML = `
        <div class="error">
            <p>*** ERROR ***</p>
            <p>FAILED TO FETCH NEWS FEED</p>
            <p>REASON: ${escapeHtml(error.message)}</p>
            <p></p>
            <p>TROUBLESHOOTING:</p>
            <p>  1. CHECK NETWORK CONNECTION</p>
            <p>  2. RSS GATEWAY MAY BE TEMPORARILY UNAVAILABLE</p>
            <p>  3. PRESS [R] TO RETRY</p>
        </div>
    `;
}

function updateSelection(newIndex) {
    const items = document.querySelectorAll('.news-item');
    if (items.length === 0) return;
    
    // Remove old selection
    items[selectedIndex]?.classList.remove('selected');
    
    // Update index with wrapping
    selectedIndex = newIndex;
    if (selectedIndex < 0) selectedIndex = items.length - 1;
    if (selectedIndex >= items.length) selectedIndex = 0;
    
    // Add new selection
    items[selectedIndex]?.classList.add('selected');
    items[selectedIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function openArticle(index) {
    // Disabled - keeps immersion by not navigating away
    // Just select the article instead
    updateSelection(index);
}

// ============================================
// Feed Loading
// ============================================

async function loadFeed(feedKey) {
    currentFeed = feedKey;
    
    // Update active button
    document.querySelectorAll('.feed-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.feed === feedKey);
    });
    
    // Show loading
    output.innerHTML = `
        <p>SWITCHING TO ${FEED_NAMES[feedKey]}...</p>
        <p class="loading">FETCHING DATA</p>
        <p class="blink">█</p>
    `;
    
    try {
        const items = await fetchFeed(feedKey);
        await delay(300); // Brief pause for effect
        renderArticles(items, feedKey);
    } catch (error) {
        renderError(error);
    }
}

// ============================================
// Event Handlers
// ============================================

function setupEventListeners() {
    // Feed buttons
    document.querySelectorAll('.feed-btn').forEach(btn => {
        btn.addEventListener('click', () => loadFeed(btn.dataset.feed));
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowUp':
            case 'k':
                e.preventDefault();
                updateSelection(selectedIndex - 1);
                break;
            case 'ArrowDown':
            case 'j':
                e.preventDefault();
                updateSelection(selectedIndex + 1);
                break;
            case 'Enter':
                e.preventDefault();
                openArticle(selectedIndex);
                break;
            case 'r':
            case 'R':
                e.preventDefault();
                loadFeed(currentFeed);
                break;
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
                e.preventDefault();
                const feedKeys = Object.keys(FEEDS);
                const index = parseInt(e.key) - 1;
                if (feedKeys[index]) loadFeed(feedKeys[index]);
                break;
            case 'Home':
                e.preventDefault();
                updateSelection(0);
                break;
            case 'End':
                e.preventDefault();
                updateSelection(articles.length - 1);
                break;
        }
    });
}

// ============================================
// Initialization
// ============================================

async function init() {
    // Start datetime updates
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Setup events
    setupEventListeners();
    
    // Boot sequence
    await showBootSequence();
    await delay(500);
    
    // Load initial feed
    await loadFeed('home');
}

// Start the terminal
document.addEventListener('DOMContentLoaded', init);

