import { getToken, getStoredUser } from './auth-storage.js';
import { inicializarBarraUsuario } from './barra-usuario.js';
import { mostrarModal } from './modal.js';

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
            if (!token) { mostrarModal(tOutfit('loginToSave'), 'error'); return; }
            btnGuardar.disabled = true;
            try {
                const res = await fetch(`${API}/api/armario/${id}`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    btnGuardar.classList.add('guardado');
                    btnGuardar.innerHTML = `<i class="icon-ok"></i> ${tOutfit('saved')}`;
                } else {
                    mostrarModal('Could not save outfit. Try again.', 'error');
                }
            } catch { mostrarModal('Connection error.', 'error'); }
            btnGuardar.disabled = false;
        };

        // Cargar comentarios
        cargarReviews(id, token);

    } catch (err) {
        loadingEl.innerHTML = `<p style="font-family:Cormorant Garamond,serif;color:#7a5060;padding:20px;">${err.message}</p>`;
    }
}

// ── REVIEWS ────────────────────────────────────────────────────────────────────

function estrellas(n, total = 5) {
    return Array.from({ length: total }, (_, i) =>
        `<span style="color:${i < Math.round(n) ? '#c8963e' : 'rgba(90,13,22,0.2)'}">★</span>`
    ).join('');
}

function fechaCorta(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function cargarReviews(outfitId, token) {
    const listaEl    = document.getElementById('reviews-lista');
    const resumenEl  = document.getElementById('reviews-resumen');
    const notaEl     = document.getElementById('resumen-nota');
    const estrellasEl = document.getElementById('resumen-estrellas');
    const totalEl    = document.getElementById('resumen-total');
    const formWrap   = document.getElementById('review-form-wrap');
    const starsInput = document.getElementById('review-stars-input');
    const textoEl    = document.getElementById('review-texto');
    const submitBtn  = document.getElementById('review-submit');

    if (!listaEl) return;

    // Ocultar formulario si no está logueado
    if (!token && formWrap) formWrap.style.display = 'none';

    const renderLista = async () => {
        try {
            const r = await fetch(`${API}/api/outfits/${outfitId}/comments`);
            const { comments, avg, total } = await r.json();

            // Resumen
            if (total > 0) {
                notaEl.textContent     = avg;
                estrellasEl.innerHTML  = estrellas(avg);
                totalEl.textContent    = `${total} review${total !== 1 ? 's' : ''}`;
                resumenEl.style.display = 'flex';
            }

            // Lista
            listaEl.innerHTML = '';
            if (!comments.length) {
                listaEl.innerHTML = `<p class="reviews-vacio">Be the first to review this outfit.</p>`;
                return;
            }

            comments.forEach(c => {
                const div = document.createElement('div');
                div.className = 'review-item';
                const esPropio = token && c.userId?._id && c.userId._id === getStoredUser()?._id;

                div.innerHTML = `
                    <div class="review-header">
                        <img class="review-avatar" src="${c.userId?.avatar || 'images/perfil.jfif'}" alt="">
                        <div class="review-meta">
                            <span class="review-autor">${(c.userId?.name || 'User').toUpperCase()}</span>
                            <time class="review-fecha">${fechaCorta(c.createdAt)}</time>
                        </div>
                        <div class="review-estrellas">${estrellas(c.rating)}</div>
                    </div>
                    <p class="review-texto">${c.texto}</p>
                    ${esPropio ? `<button class="review-borrar" data-id="${c._id}">DELETE</button>` : ''}
                `;

                if (esPropio) {
                    div.querySelector('.review-borrar').addEventListener('click', async () => {
                        await fetch(`${API}/api/outfits/${outfitId}/comments/${c._id}`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        renderLista();
                    });
                }

                listaEl.appendChild(div);
            });
        } catch { /* silencioso */ }
    };

    await renderLista();

    // Estrellas interactivas
    let ratingSeleccionado = 0;
    if (starsInput) {
        starsInput.querySelectorAll('.star-btn').forEach(btn => {
            btn.addEventListener('mouseover', () => {
                const v = +btn.dataset.v;
                starsInput.querySelectorAll('.star-btn').forEach(b => {
                    b.classList.toggle('activa', +b.dataset.v <= v);
                });
            });
            btn.addEventListener('mouseleave', () => {
                starsInput.querySelectorAll('.star-btn').forEach(b => {
                    b.classList.toggle('activa', +b.dataset.v <= ratingSeleccionado);
                });
            });
            btn.addEventListener('click', () => {
                ratingSeleccionado = +btn.dataset.v;
                starsInput.querySelectorAll('.star-btn').forEach(b => {
                    b.classList.toggle('activa', +b.dataset.v <= ratingSeleccionado);
                });
            });
        });
    }

    // Enviar comentario
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const texto = textoEl?.value.trim();
            if (!ratingSeleccionado) { mostrarModal('Please select a star rating.', 'error'); return; }
            if (!texto) { mostrarModal('Please write your review before posting.', 'error'); return; }

            submitBtn.disabled = true;
            submitBtn.textContent = 'POSTING...';

            try {
                const res = await fetch(`${API}/api/outfits/${outfitId}/comments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ texto, rating: ratingSeleccionado }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.error || 'Error posting review');

                textoEl.value = '';
                ratingSeleccionado = 0;
                starsInput?.querySelectorAll('.star-btn').forEach(b => b.classList.remove('activa'));
                mostrarModal('Your review has been posted.', 'success', 'Thank you!');
                await renderLista();
            } catch (err) {
                mostrarModal(err.message, 'error', 'Could not post review');
            }

            submitBtn.disabled = false;
            submitBtn.textContent = 'POST REVIEW';
        });
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
