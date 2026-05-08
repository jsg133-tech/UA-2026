import { inicializarBarraUsuario } from './barra-usuario.js';

const API = 'https://ua-2026.onrender.com';
const LANG_STORAGE_KEY = 'bellaveste-language';

const COLOR_MAP = {
    'BLACK':      '#1a1a1a',
    'WHITE':      '#ffffff',
    'GARNET':     '#610B0B',
    'NAVY':       '#2c3e50',
    'GOLD':       '#d4af37',
    'EMERALD':    '#1e8449',
    'BEIGE':      '#e5d3b3',
    'OLIVE':      '#7d6608',
    'VIOLET':     '#8e44ad',
    'TERRACOTTA': '#a04000',
    'GREY':       '#C0C0C0',
    'SOFT PINK':  '#FADADD',
};

const MOOD_MAP = {
    'CASUAL':     'CASUAL',
    'ELEGANT':    'ELEGANT',
    'STREETWEAR': 'STREETWEAR',
    'BOHO CHIC':  'BOHO',
    'ATHLEISURE': 'SPORT',
    'MINIMAL':    'MINIMALIST',
};

function idiomaActual() {
    return localStorage.getItem(LANG_STORAGE_KEY) === 'es' ? 'es' : 'en';
}

function tResultado(clave) {
    const textos = {
        en: {
            noFilter: 'No filter selected.',
            collection: 'COLLECTION',
            noOutfits: 'No outfits found for this collection yet.',
            loadError: 'Could not load results.',
            season: 'SEASON',
            category: 'CATEGORY',
            color: 'COLOR',
            mood: 'MOOD',
        },
        es: {
            noFilter: 'No hay filtro seleccionado.',
            collection: 'COLECCION',
            noOutfits: 'No se encontraron outfits para esta coleccion.',
            loadError: 'No se pudieron cargar los resultados.',
            season: 'TEMPORADA',
            category: 'CATEGORIA',
            color: 'COLOR',
            mood: 'ESTADO',
        },
    };

    return textos[idiomaActual()][clave] || textos.en[clave] || '';
}

function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return {
        r: parseInt(h.substring(0, 2), 16),
        g: parseInt(h.substring(2, 4), 16),
        b: parseInt(h.substring(4, 6), 16),
    };
}

function colorDistance(hex1, hex2) {
    try {
        const a = hexToRgb(hex1);
        const b = hexToRgb(hex2);
        return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
    } catch { return 999; }
}

function crearTarjeta(outfit) {
    const div = document.createElement('div');
    div.className = 'tarjeta-armario';
    div.style.cursor = 'pointer';

    const imagen = outfit.imageUrl || 'images/temporada.jfif';
    const nombre = (outfit.name || 'OUTFIT').toUpperCase();
    const cat    = (outfit.category || '').toUpperCase();

    div.innerHTML = `
        <img src="${imagen}" alt="${nombre}">
        <div class="tarjeta-info">
            <div class="tarjeta-info-texto">
                <span class="nombre-outfit">${nombre}</span>
                ${cat ? `<span class="btn-categoria-tag"><i class="icon-tag"></i>${cat}</span>` : ''}
            </div>
        </div>
    `;

    div.addEventListener('click', () => {
        window.location.href = `outfit.html?id=${outfit._id}`;
    });

    return div;
}

async function cargarResultados() {
    const params   = new URLSearchParams(window.location.search);
    const tipo     = params.get('tipo');
    const v        = params.get('v');
    const tituloEl  = document.getElementById('titulo-filtro');
    const tipoEl    = document.getElementById('header-tipo');
    const subEl     = document.getElementById('subtitulo-filtro');
    const grid      = document.getElementById('grid-resultados');

    if (!tipo || !v) {
        grid.innerHTML = `<p style="padding:20px;font-family:Cormorant Garamond,serif;color:#7a5060;grid-column:1/-1">${tResultado('noFilter')}</p>`;
        return;
    }

    const tipoLabels = {
        season: tResultado('season'),
        category: tResultado('category'),
        color: tResultado('color'),
        mood: tResultado('mood'),
    };
    if (tituloEl) tituloEl.textContent = v.toUpperCase();
    if (tipoEl)   tipoEl.textContent   = tipoLabels[tipo] || tResultado('collection');
    if (subEl)    subEl.textContent    = `${tipoLabels[tipo] || ''} · ${v.toUpperCase()}`;

    try {
        let outfits = [];

        if (tipo === 'season') {
            const r = await fetch(`${API}/api/outfits?season=${encodeURIComponent(v)}`);
            outfits = await r.json();

        } else if (tipo === 'category' || tipo === 'mood') {
            const catValue = tipo === 'mood' ? (MOOD_MAP[v.toUpperCase()] || v) : v;
            const r = await fetch(`${API}/api/outfits?category=${encodeURIComponent(catValue)}`);
            outfits = await r.json();

        } else if (tipo === 'color') {
            const targetHex = COLOR_MAP[v.toUpperCase()];
            const r = await fetch(`${API}/api/outfits`);
            const todos = await r.json();
            if (targetHex) {
                outfits = todos.filter(o =>
                    o.color && o.color.startsWith('#') && colorDistance(o.color, targetHex) <= 90
                );
            } else {
                outfits = todos;
            }
        }

        grid.innerHTML = '';

        if (!Array.isArray(outfits) || !outfits.length) {
            grid.innerHTML = `
                <div style="grid-column:1/-1;padding:40px 20px;text-align:center;
                    font-family:'Cormorant Garamond',serif;font-style:italic;color:rgba(61,10,17,0.45);">
                    ${tResultado('noOutfits')}
                </div>
            `;
            return;
        }

        outfits.forEach(o => grid.appendChild(crearTarjeta(o)));

    } catch {
        grid.innerHTML = `<p style="padding:20px;grid-column:1/-1;font-family:Cormorant Garamond,serif;color:#7a5060;">${tResultado('loadError')}</p>`;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try { await inicializarBarraUsuario(); } catch { /* silencioso */ }
    cargarResultados();
});

document.addEventListener('bellaveste:language-changed', () => {
    cargarResultados();
});
