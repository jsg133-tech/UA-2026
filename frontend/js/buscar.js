import { getToken } from './auth-storage.js';
import { inicializarBarraUsuario } from './barra-usuario.js';

const API = 'https://ua-2026.onrender.com';

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
        mostrarGrid(todosLosOutfits, 'RECOMMENDED OUTFITS');
    } catch {
        mostrarVacio('Could not load outfits.');
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
                const matchColor = !color || p.color?.toLowerCase().includes(color) ||
                                   outfit.color?.toLowerCase().includes(color);
                const matchBrand = !brand || p.marca?.toLowerCase().includes(brand);
                return matchSize && matchColor && matchBrand;
            });
            if (!tienePrenda) return false;
        }

        return true;
    });

    const titulo = query
        ? `RESULTS FOR "${query.toUpperCase()}"`
        : 'FILTERED OUTFITS';

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
        ? `${outfits.length} outfit${outfits.length !== 1 ? 's' : ''}`
        : '';
    grid.innerHTML = '';

    if (!outfits.length) {
        mostrarVacio('No outfits found for your search.');
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
    const nombre = (outfit.name || 'Outfit').toUpperCase();

    card.innerHTML = `
        <img src="${img}" alt="${nombre}" loading="lazy">
        <div class="resultado-overlay">
            <span class="resultado-nombre">${nombre}</span>
            <button class="resultado-heart" title="Save to closet">
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
