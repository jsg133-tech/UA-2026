import { getToken, getStoredUser } from './auth-storage.js';
import { inicializarBarraUsuario } from './barra-usuario.js';

const API = 'https://ua-2026.onrender.com';
const LANG_STORAGE_KEY = 'bellaveste-language';

const loadingEl      = document.getElementById('outfit-loading');
const contenidoEl    = document.getElementById('outfit-contenido');
const fotoEl         = document.getElementById('outfit-foto');
const nombreEl       = document.getElementById('outfit-nombre');
const categoriaEl    = document.getElementById('outfit-categoria');
const fechaEl        = document.getElementById('outfit-fecha');
const autorNombreEl  = document.getElementById('autor-nombre');
const autorAvatarEl  = document.getElementById('autor-avatar');
const prendasListaEl = document.getElementById('prendas-lista');
const btnGuardar     = document.getElementById('btn-guardar');

function idiomaActual() {
    return localStorage.getItem(LANG_STORAGE_KEY) === 'es' ? 'es' : 'en';
}

function tOutfit(clave) {
    const textos = {
        en: {
            brand: 'Brand',
            size: 'Size',
            season: 'Season',
            color: 'Color',
            viewStore: 'VIEW IN STORE',
            noOutfit: 'No outfit selected.',
            notFound: 'Outfit not found',
            unknown: 'Unknown',
            noPieces: 'No pieces added to this outfit.',
            loginToSave: 'You must be logged in to save outfits.',
            saved: 'SAVED',
            loadErrorPrefix: 'Error',
            dateLocale: 'en-US',
        },
        es: {
            brand: 'Marca',
            size: 'Talla',
            season: 'Temporada',
            color: 'Color',
            viewStore: 'VER EN TIENDA',
            noOutfit: 'No hay outfit seleccionado.',
            notFound: 'Outfit no encontrado',
            unknown: 'Desconocido',
            noPieces: 'No hay prendas agregadas a este outfit.',
            loginToSave: 'Debes iniciar sesion para guardar outfits.',
            saved: 'GUARDADO',
            loadErrorPrefix: 'Error',
            dateLocale: 'es-ES',
        },
    };

    return textos[idiomaActual()][clave] || textos.en[clave] || '';
}

function formatearFecha(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString(tOutfit('dateLocale'), { day: 'numeric', month: 'long', year: 'numeric' });
}

function renderPrenda(prenda, outfitId, token) {
    const card = document.createElement('article');
    card.className = 'prenda-card';

    const fotoSrc = prenda.imageUrl || 'images/temporada.jfif';

    const campos = [
        { label: tOutfit('brand'),  valor: prenda.marca  },
        { label: tOutfit('size'),   valor: prenda.size   },
        { label: tOutfit('season'), valor: prenda.season },
    ].filter(c => c.valor && c.valor.trim());

    const colorHtml = prenda.color
        ? `<div class="prenda-campo">
               <span class="campo-label">${tOutfit('color')}</span>
               <span class="campo-color-swatch" style="background:${prenda.color}"></span>
               <span class="campo-valor">${prenda.color}</span>
           </div>`
        : '';

    const camposHtml = campos.map(c => `
        <div class="prenda-campo">
            <span class="campo-label">${c.label}</span>
            <span class="campo-valor">${c.valor.toUpperCase()}</span>
        </div>`).join('');

    const linkHtml = prenda.link
        ? `<a class="prenda-link" href="${prenda.link}" target="_blank" rel="noopener">
               <i class="icon-link-ext"></i> ${tOutfit('viewStore')}
           </a>`
        : '';

    const descHtml = prenda.descripcion
        ? `<p class="prenda-descripcion">${prenda.descripcion}</p>`
        : '';

    card.innerHTML = `
        <div class="prenda-foto">
            <img src="${fotoSrc}" alt="${prenda.nombre}" loading="lazy">
        </div>
        <div class="prenda-detalle">
            <div class="prenda-detalle-top">
                <h3 class="prenda-nombre">${prenda.nombre.toUpperCase()}</h3>
                <button class="btn-guardar-prenda" title="Save piece" type="button">
                    <i class="icon-heart"></i>
                </button>
            </div>
            ${descHtml}
            <div class="prenda-campos">
                ${camposHtml}
                ${colorHtml}
            </div>
            ${linkHtml}
        </div>
    `;

    // Lógica del botón guardar prenda
    const btnSave = card.querySelector('.btn-guardar-prenda');
    let guardada = prenda.savedBy && token && prenda.savedBy.some(id => id === getToken());

    if (guardada) {
        btnSave.classList.add('guardada');
        btnSave.querySelector('i').className = 'icon-heart';
    }

    btnSave.addEventListener('click', async () => {
        if (!token) { window.location.href = 'inicio.html'; return; }
        btnSave.disabled = true;
        try {
            if (!guardada) {
                const r = await fetch(`${API}/api/outfits/${outfitId}/pieces/${prenda._id}/save`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (r.ok) {
                    guardada = true;
                    btnSave.classList.add('guardada');
                    btnSave.querySelector('i').className = 'icon-heart';
                    btnSave.title = 'Saved';
                }
            } else {
                const r = await fetch(`${API}/api/outfits/${outfitId}/pieces/${prenda._id}/save`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (r.ok) {
                    guardada = false;
                    btnSave.classList.remove('guardada');
                    btnSave.querySelector('i').className = 'icon-heart-empty';
                    btnSave.title = 'Save piece';
                }
            }
        } catch { /* silencioso */ }
        btnSave.disabled = false;
    });

    return card;
}

async function cargarOutfit() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        loadingEl.innerHTML = `<p>${tOutfit('noOutfit')}</p>`;
        return;
    }

    try {
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const r = await fetch(`${API}/api/outfits/${id}`, { headers });
        const data = await r.json().catch(() => ({}));

        if (!r.ok) throw new Error(`${tOutfit('loadErrorPrefix')} ${r.status}: ${data.error || tOutfit('notFound')}`);
        const outfit = data;

        // Foto principal
        fotoEl.src = outfit.imageUrl || 'images/temporada.jfif';
        fotoEl.alt = outfit.name;

        // Meta
        nombreEl.textContent   = (outfit.name || 'Outfit').toUpperCase();
        categoriaEl.textContent = (outfit.category || '').toUpperCase();
        fechaEl.textContent    = formatearFecha(outfit.createdAt);

        // Autor
        if (outfit.userId) {
            autorNombreEl.textContent = (outfit.userId.name || tOutfit('unknown')).toUpperCase();
            autorAvatarEl.src = outfit.userId.avatar || 'images/perfil.jfif';
        }

        // Prendas
        prendasListaEl.innerHTML = '';
        if (outfit.pieces && outfit.pieces.length) {
            outfit.pieces.forEach(p => prendasListaEl.appendChild(renderPrenda(p, outfit._id, token)));
        } else {
            prendasListaEl.innerHTML = `<p style="padding:20px;text-align:center;font-family:Cormorant Garamond,serif;color:#7a5060;">${tOutfit('noPieces')}</p>`;
        }

        // Mostrar contenido
        loadingEl.classList.remove('visible');
        contenidoEl.style.display = 'block';

        // Boton guardar en armario
        btnGuardar.onclick = async () => {
            if (!token) {
                alert(tOutfit('loginToSave'));
                return;
            }
            btnGuardar.disabled = true;
            try {
                const res = await fetch(`${API}/api/armario/${id}`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    btnGuardar.classList.add('guardado');
                    btnGuardar.innerHTML = `<i class="icon-ok"></i> ${tOutfit('saved')}`;
                }
            } catch { /* silencioso */ }
            btnGuardar.disabled = false;
        };

    } catch (err) {
        loadingEl.innerHTML = `<p style="font-family:Cormorant Garamond,serif;color:#7a5060;padding:20px;">${err.message}</p>`;
    }
}

// Necesitamos la ruta GET /api/outfits/:id en el backend
document.addEventListener('DOMContentLoaded', async () => {
    try { await inicializarBarraUsuario(); } catch { /* silencioso */ }
    cargarOutfit();
});

document.addEventListener('bellaveste:language-changed', () => {
    cargarOutfit();
});
