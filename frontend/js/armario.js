import { getToken, getStoredUser, clearAuthSession, setStoredUser } from './auth-storage.js';

const API = 'https://ua-2026.onrender.com';

const gridArmario         = document.getElementById('grid-armario');
const categoriasBarra     = document.getElementById('categorias-bar');
const categoriasDropdown  = document.getElementById('categorias-dropdown');
const btnToggleCats       = document.getElementById('btn-toggle-categorias');
const iconoToggle         = document.getElementById('icono-toggle');
const btnNuevaCat         = document.getElementById('btn-nueva-categoria');
const nuevaCatForm        = document.getElementById('nueva-cat-form');
const nuevaCatInput       = document.getElementById('nueva-cat-input');
const nuevaCatOk          = document.getElementById('nueva-cat-ok');
const nuevaCatX           = document.getElementById('nueva-cat-x');
const nombreUsuarioEl     = document.getElementById('nombre-usuario');
const avatarUsuarioEl     = document.getElementById('avatar-usuario');
const logoutLinkEl        = document.getElementById('logout-link');

let categoriaActiva     = null;
let categoriasUsuario   = [];   // { _id, name }[]
let menuCategoriaActivo = null;

function obtenerToken() { return getToken(); }

function cerrarSesion() {
    clearAuthSession();
    window.location.href = 'inicio.html';
}

// ── BARRA DE CATEGORÍAS ──────────────────────────────────────────────────────

async function cargarCategorias() {
    const token = obtenerToken();
    if (!token) { renderizarBarra(); return; }
    try {
        const r = await fetch(`${API}/api/armario/categorias`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) categoriasUsuario = await r.json();
    } catch { /* silencioso */ }
    renderizarBarra();
}

function renderizarBarra() {
    categoriasBarra.innerHTML = '';
    categoriasBarra.appendChild(crearPill('ALL', null, !categoriaActiva));
    categoriasUsuario.forEach(cat => {
        categoriasBarra.appendChild(crearPill(cat.name, cat.name, categoriaActiva === cat.name));
    });
}

function crearPill(texto, valor, activa = false) {
    const btn = document.createElement('button');
    btn.className = 'pill-cat' + (activa ? ' activa' : '');
    btn.textContent = texto;
    btn.addEventListener('click', () => {
        categoriaActiva = valor;
        renderizarBarra();
        renderizarGrid();
    });
    return btn;
}

// ── TOGGLE DROPDOWN CATEGORÍAS ───────────────────────────────────────────────

let dropdownAbierto = false;

btnToggleCats.addEventListener('click', () => {
    dropdownAbierto = !dropdownAbierto;
    categoriasDropdown.classList.toggle('abierto', dropdownAbierto);
    iconoToggle.classList.toggle('rotado', dropdownAbierto);
});

// ── NUEVA CATEGORÍA ───────────────────────────────────────────────────────────

let formNuevaAbierto = false;

btnNuevaCat.addEventListener('click', () => {
    formNuevaAbierto = !formNuevaAbierto;
    nuevaCatForm.classList.toggle('abierto', formNuevaAbierto);
    if (formNuevaAbierto) {
        nuevaCatInput.value = '';
        nuevaCatInput.focus();
    }
});

nuevaCatX.addEventListener('click', () => {
    formNuevaAbierto = false;
    nuevaCatForm.classList.remove('abierto');
});

const confirmarNuevaCat = async () => {
    const nombre = nuevaCatInput.value.trim();
    if (!nombre) return;
    nuevaCatOk.disabled = true;
    try {
        const token = obtenerToken();
        const r = await fetch(`${API}/api/armario/categorias`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name: nombre }),
        });
        if (r.ok) {
            const nueva = await r.json();
            categoriasUsuario.push(nueva);
            renderizarBarra();
            nuevaCatInput.value = '';
            formNuevaAbierto = false;
            nuevaCatForm.classList.remove('abierto');
            dropdownAbierto = true;
            categoriasDropdown.classList.add('abierto');
            iconoToggle.classList.add('rotado');
        }
    } catch { /* silencioso */ }
    nuevaCatOk.disabled = false;
};

nuevaCatOk.addEventListener('click', confirmarNuevaCat);
nuevaCatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter')  confirmarNuevaCat();
    if (e.key === 'Escape') {
        formNuevaAbierto = false;
        nuevaCatForm.classList.remove('abierto');
    }
});

// ── TARJETA ──────────────────────────────────────────────────────────────────

function crearTarjetaOutfit(outfit) {
    const div = document.createElement('div');
    div.className = 'tarjeta-armario';

    const imagen   = outfit.imageUrl || 'images/temporada.jfif';
    const nombre   = (outfit.name || 'OUTFIT').toUpperCase();
    const catLabel = outfit.armarioCategoria || null;

    div.innerHTML = `
        <img src="${imagen}" alt="${nombre}">
        <div class="tarjeta-overlay">
            <div class="tarjeta-top">
                <span class="nombre-outfit">${nombre}</span>
                <button class="btn-favorito" title="Remove from closet" type="button">
                    <i class="icon-heart"></i>
                </button>
            </div>
        </div>
        <button class="btn-categorizar" type="button" title="Add to category">
            <i class="icon-folder"></i>
            <span>${catLabel ? catLabel.toUpperCase() : 'ADD TO CATEGORY'}</span>
            <i class="icon-right-open btn-cat-arrow"></i>
        </button>
    `;

    div.querySelector('.btn-categorizar').addEventListener('click', e => {
        e.stopPropagation();
        abrirBottomSheet(outfit._id, 'outfit', div.querySelector('.btn-categorizar'));
    });

    div.querySelector('.btn-favorito').addEventListener('click', e => {
        e.stopPropagation();
        quitarDelArmario(outfit._id, div.querySelector('.btn-favorito'), div);
    });

    div.addEventListener('click', () => {
        window.location.href = `outfit.html?id=${outfit._id}`;
    });
    div.style.cursor = 'pointer';

    return div;
}

// ── BOTTOM SHEET CATEGORÍAS ───────────────────────────────────────────────────

let bottomSheetActivo = null;

function abrirBottomSheet(itemId, tipo, btnCat, outfitId = null) {
    cerrarBottomSheet();

    const overlay = document.createElement('div');
    overlay.className = 'bs-overlay';

    const sheet = document.createElement('div');
    sheet.className = 'bs-sheet';

    const titulo = tipo === 'outfit' ? 'MOVE OUTFIT TO' : 'MOVE PIECE TO';

    const opciones = categoriasUsuario.length
        ? categoriasUsuario.map(cat => `
            <button class="bs-opcion" data-cat="${cat.name}" type="button">
                <i class="icon-folder"></i>
                <span>${cat.name.toUpperCase()}</span>
                <i class="icon-ok bs-check" style="display:none"></i>
            </button>`).join('')
        : `<p class="bs-vacio">Create a category first using the NEW button above.</p>`;

    sheet.innerHTML = `
        <div class="bs-handle"></div>
        <p class="bs-titulo">${titulo}</p>
        <div class="bs-opciones">${opciones}</div>
        <button class="bs-cancelar" type="button">CANCEL</button>
    `;

    overlay.appendChild(sheet);
    document.body.appendChild(overlay);
    bottomSheetActivo = overlay;

    requestAnimationFrame(() => sheet.classList.add('bs-sheet--open'));

    sheet.querySelectorAll('.bs-opcion').forEach(btn => {
        btn.addEventListener('click', async () => {
            const cat = btn.dataset.cat;
            cerrarBottomSheet();
            if (tipo === 'outfit') {
                cambiarCategoriaOutfit(itemId, cat, btnCat);
            } else if (tipo === 'piece' && outfitId) {
                const token = obtenerToken();
                try {
                    await fetch(`${API}/api/outfits/${outfitId}/pieces/${itemId}/category`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ categoria: cat }),
                    });
                    btnCat.querySelector('span').textContent = cat.toUpperCase();
                    // Recargar prendas para reflejar el cambio
                    await cargarPrendasGuardadas();
                } catch { /* silencioso */ }
            }
        });
    });

    sheet.querySelector('.bs-cancelar').addEventListener('click', cerrarBottomSheet);
    overlay.addEventListener('click', e => { if (e.target === overlay) cerrarBottomSheet(); });
}

function cerrarBottomSheet() {
    if (!bottomSheetActivo) return;
    const sheet = bottomSheetActivo.querySelector('.bs-sheet');
    sheet.classList.remove('bs-sheet--open');
    setTimeout(() => { bottomSheetActivo?.remove(); bottomSheetActivo = null; }, 280);
}

// ── CAMBIAR CATEGORÍA ─────────────────────────────────────────────────────────

async function cambiarCategoriaOutfit(idOutfit, nuevaCategoria, btnTag) {
    const token = obtenerToken();
    if (!token) return;

    btnTag.style.opacity = '0.5';

    try {
        const r = await fetch(`${API}/api/armario/${idOutfit}/categoria`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ categoria: nuevaCategoria }),
        });
        if (!r.ok) throw new Error();

        // Actualizar el span del botón
        btnTag.querySelector('span').textContent = nuevaCategoria.toUpperCase();
        btnTag.style.opacity = '1';

        // Si hay filtro activo y no coincide, sacar la tarjeta del grid
        if (categoriaActiva && categoriaActiva.toUpperCase() !== nuevaCategoria.toUpperCase()) {
            const tarjeta = btnTag.closest('.tarjeta-armario');
            tarjeta.style.transition = 'opacity 0.3s, transform 0.3s';
            tarjeta.style.opacity = '0';
            tarjeta.style.transform = 'scale(0.93)';
            setTimeout(() => tarjeta.remove(), 320);
        }
    } catch {
        btnTag.style.opacity = '1';
    }
}

// ── QUITAR DEL ARMARIO ────────────────────────────────────────────────────────

async function quitarDelArmario(idOutfit, boton, tarjeta) {
    const token = obtenerToken();
    if (!token) return;

    boton.querySelector('i').className = 'icon-heart-empty';
    boton.classList.add('quitando');
    boton.disabled = true;

    try {
        const r = await fetch(`${API}/api/armario/${idOutfit}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) throw new Error();

        tarjeta.style.transition = 'opacity 0.35s, transform 0.35s';
        tarjeta.style.opacity = '0';
        tarjeta.style.transform = 'scale(0.93)';
        setTimeout(() => tarjeta.remove(), 380);
    } catch {
        boton.querySelector('i').className = 'icon-heart';
        boton.classList.remove('quitando');
        boton.disabled = false;
    }
}

// ── GRID ──────────────────────────────────────────────────────────────────────

let todosLosOutfits = [];

function renderizarGrid() {
    const outfits = categoriaActiva
        ? todosLosOutfits.filter(o => (o.armarioCategoria || '').toUpperCase() === categoriaActiva.toUpperCase())
        : todosLosOutfits;

    gridArmario.innerHTML = '';
    if (!outfits.length) {
        gridArmario.innerHTML = '<p class="armario-vacio">You haven\'t saved any outfits yet.</p>';
    } else {
        outfits.forEach(o => gridArmario.appendChild(crearTarjetaOutfit(o)));
    }

    // Filtrar prendas por categoría activa
    actualizarSeccionPrendas();
}

function actualizarSeccionPrendas() {
    if (!prendasSeccion) return;
    if (!todasLasPrendas.length) { prendasSeccion.style.display = 'none'; return; }

    const token = obtenerToken();
    const filtradas = categoriaActiva
        ? todasLasPrendas.filter(({ piece }) => {
            if (!piece.savedCategories) return false;
            return piece.savedCategories.some(sc =>
                sc.categoria && sc.categoria.toUpperCase() === categoriaActiva.toUpperCase()
            );
          })
        : todasLasPrendas; // ALL: mostrar todas

    if (!filtradas.length) { prendasSeccion.style.display = 'none'; return; }

    prendasSeccion.style.display = 'block';
    prendasGrid.innerHTML = '';
    filtradas.forEach(item => prendasGrid.appendChild(crearTarjetaPrenda(item)));
}

async function cargarOutfits() {
    const token = obtenerToken();
    if (!token) { window.location.href = 'login.html'; return; }

    try {
        const r = await fetch(`${API}/api/armario`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const datos = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(datos.error || 'Error al cargar');
        todosLosOutfits = datos;
        renderizarGrid();
    } catch (err) {
        gridArmario.innerHTML = `<p class="armario-vacio">${err.message}</p>`;
    }
}

// ── USUARIO ───────────────────────────────────────────────────────────────────

async function cargarUsuario() {
    const token = obtenerToken();
    if (!token) return;
    const guardado = getStoredUser();
    if (guardado) {
        try {
            const u = guardado;
            nombreUsuarioEl.textContent = (u.name || 'USUARIO').toUpperCase();
            avatarUsuarioEl.src = u.avatar || 'images/perfil.jfif';
        } catch { /* continúa */ }
    }
    try {
        const r = await fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) return;
        const u = await r.json();
        nombreUsuarioEl.textContent = (u.name || 'USUARIO').toUpperCase();
        avatarUsuarioEl.src = u.avatar || 'images/perfil.jfif';
        setStoredUser(u);
    } catch { /* silencioso */ }
}

logoutLinkEl.addEventListener('click', e => { e.preventDefault(); cerrarSesion(); });

// ── PRENDAS GUARDADAS ─────────────────────────────────────────────────────────

const prendasSeccion = document.getElementById('prendas-guardadas-seccion');
const prendasGrid    = document.getElementById('prendas-guardadas-grid');
let todasLasPrendas  = [];

function crearTarjetaPrenda({ piece, outfitId, outfitName }) {
    const card = document.createElement('div');
    card.className = 'prenda-guardada-card';

    const foto   = piece.imageUrl || 'images/temporada.jfif';
    const nombre = (piece.nombre || 'Piece').toUpperCase();
    const marca  = piece.marca || '';
    const token  = obtenerToken();

    // Categoría actual de esta prenda para este usuario
    const catActual = piece.savedCategories?.find(sc => sc.userId === sc.userId)?.categoria || null;

    card.innerHTML = `
        <div class="prenda-guardada-foto">
            <img src="${foto}" alt="${nombre}" loading="lazy">
        </div>
        <div class="prenda-guardada-info">
            <span class="prenda-guardada-nombre">${nombre}</span>
            ${marca ? `<span class="prenda-guardada-marca">${marca}</span>` : ''}
            <span class="prenda-guardada-outfit">${(outfitName || '').toUpperCase()}</span>
        </div>
        <button class="btn-categorizar btn-categorizar--prenda" type="button" title="Add to category">
            <i class="icon-folder"></i>
            <span>${catActual ? catActual.toUpperCase() : 'ADD TO CATEGORY'}</span>
            <i class="icon-right-open btn-cat-arrow"></i>
        </button>
    `;

    card.querySelector('.btn-categorizar--prenda').addEventListener('click', e => {
        e.stopPropagation();
        abrirBottomSheet(piece._id, 'piece', e.currentTarget, outfitId);
    });

    card.addEventListener('click', () => { window.location.href = `outfit.html?id=${outfitId}`; });
    card.style.cursor = 'pointer';
    return card;
}

async function cargarPrendasGuardadas() {
    const token = obtenerToken();
    if (!token) return;
    try {
        const r = await fetch(`${API}/api/outfits/pieces/saved`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) return;
        todasLasPrendas = await r.json();
        actualizarSeccionPrendas();
    } catch { /* silencioso */ }
}

// ── INICIO ────────────────────────────────────────────────────────────────────

cargarUsuario();
cargarCategorias();
cargarOutfits();
cargarPrendasGuardadas();
