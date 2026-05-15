import { getToken } from './auth-storage.js';
import { inicializarBarraUsuario } from './barra-usuario.js';

const API = 'https://ua-2026.onrender.com';
const LANG_STORAGE_KEY = 'bellaveste-language';

const buscarInput    = document.getElementById('buscar-input');
const buscarBtn      = document.getElementById('buscar-btn');
const sugerencias    = document.getElementById('buscar-sugerencias');
const btnAdvanced    = document.getElementById('btn-advanced');
const filtrosEl      = document.getElementById('filtros-avanzados');
const advancedArrow  = document.getElementById('advanced-arrow');
const btnAplicar     = document.getElementById('btn-aplicar');
const grid           = document.getElementById('resultados-grid');
const tituloEl       = document.getElementById('resultados-titulo');
const countEl        = document.getElementById('resultados-count');

const fSize   = document.getElementById('f-size');
const fColor  = document.getElementById('f-color');
const fBrand  = document.getElementById('f-brand');
const fSeason = document.getElementById('f-season');

let todosLosOutfits = [];
let advancedAbierto = false;

// ── UTILIDADES DE COLOR ───────────────────────────────────────
function hexToRgb(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex);
    if (!m) return null;
    return [parseInt(m[1].slice(0,2),16), parseInt(m[1].slice(2,4),16), parseInt(m[1].slice(4,6),16)];
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l * 100];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === r)      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else                h = ((r - g) / d + 4) / 6;
    return [h * 360, s * 100, l * 100];
}

// Devuelve los nombres (es + en) que corresponden a un hex
function nombresDeHex(hex) {
    if (!hex) return [];
    const rgb = hexToRgb(hex);
    if (!rgb) return [];
    const [h, s, l] = rgbToHsl(...rgb);

    if (l < 15)                                  return ['negro', 'black'];
    if (l > 88 && s < 15)                        return ['blanco', 'white'];
    if (s < 12)                                  return ['gris', 'gray', 'grey'];
    if (h >= 25 && h <= 50 && s < 40 && l > 70) return ['beige', 'crema', 'cream'];
    if (h >= 15 && h <= 45 && l < 50)           return ['marrón', 'marron', 'cafe', 'café', 'brown'];
    if ((h >= 345 || h <= 15) && s >= 40)        return ['rojo', 'red'];
    if (h > 15  && h <= 45)                      return ['naranja', 'orange'];
    if (h > 45  && h <= 70)                      return ['amarillo', 'yellow'];
    if (h > 70  && h <= 160)                     return ['verde', 'green'];
    if (h > 160 && h <= 250)                     return ['azul', 'blue'];
    if (h > 250 && h <= 310)                     return ['morado', 'violeta', 'lila', 'purple', 'violet'];
    if (h > 310 && h <= 345)                     return ['rosa', 'pink'];
    return [];
}

// Comprueba si un hex coincide con el término buscado (nombre o hex parcial)
function colorCoincide(hex, query) {
    if (!query) return true;
    if (hex?.toLowerCase().includes(query)) return true;
    return nombresDeHex(hex).some(n => n.includes(query));
}

function idiomaActual() {
    return localStorage.getItem(LANG_STORAGE_KEY) === 'es' ? 'es' : 'en';
}

function tBuscar(clave) {
    const textos = {
        en: {
            recommended: 'RECOMMENDED OUTFITS',
            filtered: 'FILTERED OUTFITS',
            resultsFor: 'RESULTS FOR',
            outfitsSingular: 'outfit',
            outfitsPlural: 'outfits',
            loadError: 'Could not load outfits.',
            noResults: 'No outfits found for your search.',
            saveTitle: 'Save to closet',
            defaultOutfit: 'Outfit',
        },
        es: {
            recommended: 'OUTFITS RECOMENDADOS',
            filtered: 'OUTFITS FILTRADOS',
            resultsFor: 'RESULTADOS PARA',
            outfitsSingular: 'outfit',
            outfitsPlural: 'outfits',
            loadError: 'No se pudieron cargar los outfits.',
            noResults: 'No se encontraron outfits para tu busqueda.',
            saveTitle: 'Guardar en armario',
            defaultOutfit: 'Outfit',
        },
    };

    return textos[idiomaActual()][clave] || textos.en[clave] || '';
}

// ── TOGGLE ADVANCED ───────────────────────────────────────────
btnAdvanced.addEventListener('click', () => {
    advancedAbierto = !advancedAbierto;
    filtrosEl.classList.toggle('abierto', advancedAbierto);
    btnAdvanced.classList.toggle('activo', advancedAbierto);
    advancedArrow.classList.toggle('rotado', advancedAbierto);
});

// ── CARGAR TODOS LOS OUTFITS ──────────────────────────────────
async function cargarOutfits() {
    try {
        const r = await fetch(`${API}/api/outfits`);
        todosLosOutfits = await r.json();
        mostrarGrid(todosLosOutfits, tBuscar('recommended'));
    } catch {
        mostrarVacio(tBuscar('loadError'));
    }
}

// ── AUTOCOMPLETE ──────────────────────────────────────────────
buscarInput.addEventListener('input', () => {
    const query = buscarInput.value.trim().toLowerCase();
    if (!query) { ocultarSugerencias(); return; }

    const matches = todosLosOutfits
        .filter(o => o.name?.toLowerCase().includes(query))
        .slice(0, 8);

    if (!matches.length) { ocultarSugerencias(); return; }

    sugerencias.innerHTML = '';
    matches.forEach(o => {
        const li = document.createElement('li');
        li.className = 'sugerencia-item';
        const meta = [o.category, o.season].filter(Boolean).join(' · ');
        li.innerHTML = `
            <img class="sugerencia-foto" src="${o.imageUrl || 'images/temporada.jfif'}" alt="">
            <div class="sugerencia-texto">
                <span class="sugerencia-nombre">${o.name.toUpperCase()}</span>
                ${meta ? `<span class="sugerencia-meta">${meta}</span>` : ''}
            </div>
        `;
        li.addEventListener('click', () => {
            buscarInput.value = o.name;
            ocultarSugerencias();
            buscar();
        });
        sugerencias.appendChild(li);
    });

    sugerencias.classList.add('visible');
});

// Cerrar sugerencias al hacer clic fuera
document.addEventListener('click', (e) => {
    if (!buscarInput.contains(e.target) && !sugerencias.contains(e.target)) {
        ocultarSugerencias();
    }
});

function ocultarSugerencias() {
    sugerencias.classList.remove('visible');
    sugerencias.innerHTML = '';
}

// ── BÚSQUEDA PRINCIPAL ────────────────────────────────────────
function buscar() {
    const query  = buscarInput.value.trim().toLowerCase();
    const size   = fSize.value.trim().toLowerCase();
    const color  = fColor.value.trim().toLowerCase();
    const brand  = fBrand.value.trim().toLowerCase();
    const season = fSeason.value.toLowerCase();

    const resultados = todosLosOutfits.filter(outfit => {
        // Filtro por nombre
        if (query && !outfit.name?.toLowerCase().includes(query)) return false;

        // Filtro por temporada
        if (season && outfit.season?.toLowerCase() !== season) return false;

        // Filtros de prendas (size, color, brand)
        if (size || color || brand) {
            const pieces = outfit.pieces || [];
            const tienePrenda = pieces.some(p => {
                const matchSize  = !size  || p.size?.toLowerCase().includes(size);
                const matchColor = !color || colorCoincide(p.color, color) || colorCoincide(outfit.color, color);
                const matchBrand = !brand || p.marca?.toLowerCase().includes(brand);
                return matchSize && matchColor && matchBrand;
            });
            if (!tienePrenda) return false;
        }

        return true;
    });

    const titulo = query
        ? `${tBuscar('resultsFor')} "${query.toUpperCase()}"`
        : tBuscar('filtered');

    mostrarGrid(resultados, titulo);
    ocultarSugerencias();
}

buscarBtn.addEventListener('click', buscar);
btnAplicar.addEventListener('click', buscar);
buscarInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { buscar(); ocultarSugerencias(); }
});

// ── RENDERIZAR GRID ───────────────────────────────────────────
function mostrarGrid(outfits, titulo) {
    tituloEl.textContent = titulo;
    countEl.textContent  = outfits.length
        ? `${outfits.length} ${outfits.length !== 1 ? tBuscar('outfitsPlural') : tBuscar('outfitsSingular')}`
        : '';
    grid.innerHTML = '';

    if (!outfits.length) {
        mostrarVacio(tBuscar('noResults'));
        return;
    }

    outfits.forEach(o => grid.appendChild(crearTarjeta(o)));
}

function mostrarVacio(msg) {
    grid.innerHTML = `<p class="buscar-vacio">${msg}</p>`;
    countEl.textContent = '';
}

function crearTarjeta(outfit) {
    const card = document.createElement('div');
    card.className = 'resultado-card';

    const img = outfit.imageUrl || 'images/temporada.jfif';
    const nombre = (outfit.name || tBuscar('defaultOutfit')).toUpperCase();

    card.innerHTML = `
        <img src="${img}" alt="${nombre}" loading="lazy">
        <div class="resultado-overlay">
            <span class="resultado-nombre">${nombre}</span>
            <button class="resultado-heart" title="${tBuscar('saveTitle')}">
                <i class="icon-heart"></i>
            </button>
        </div>
    `;

    card.addEventListener('click', (e) => {
        if (e.target.closest('.resultado-heart')) return;
        window.location.href = `outfit.html?id=${outfit._id}`;
    });

    card.querySelector('.resultado-heart').addEventListener('click', async (e) => {
        e.stopPropagation();
        const token = getToken();
        if (!token) { window.location.href = 'inicio.html'; return; }
        try {
            const r = await fetch(`${API}/api/armario/${outfit._id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (r.ok) {
                const icon = e.currentTarget.querySelector('i');
                icon.className = 'icon-heart';
                e.currentTarget.style.color = '#f4e9df';
            }
        } catch { /* silencioso */ }
    });

    return card;
}

// ── INICIO ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    try { await inicializarBarraUsuario(); } catch { /* silencioso */ }
    cargarOutfits();
});

document.addEventListener('bellaveste:language-changed', () => {
    if (buscarInput.value.trim() || fSize.value || fColor.value || fBrand.value || fSeason.value) {
        buscar();
        return;
    }
    mostrarGrid(todosLosOutfits, tBuscar('recommended'));
});
