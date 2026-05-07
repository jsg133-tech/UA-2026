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
    const nombre   = (outfit.name     || 'OUTFIT').toUpperCase();
    const catLabel = (outfit.category || '—').toUpperCase();

    div.innerHTML = `
        <img src="${imagen}" alt="${nombre}">
        <div class="tarjeta-info">
            <div class="tarjeta-info-texto">
                <span class="nombre-outfit">${nombre}</span>
                <button class="btn-categoria-tag" type="button" title="Mover a categoría">
                    <i class="icon-tag"></i>${catLabel}
                </button>
            </div>
            <button class="btn-favorito" title="Quitar del armario" type="button">
                <i class="icon-heart"></i>
            </button>
        </div>
    `;

    div.querySelector('.btn-categoria-tag').addEventListener('click', e => {
        e.stopPropagation();
        mostrarMenuCategoria(e.currentTarget, outfit._id, outfit.category);
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

// ── MENÚ FLOTANTE ─────────────────────────────────────────────────────────────

function mostrarMenuCategoria(btnTag, idOutfit, categoriaActualOutfit) {
    cerrarMenuCategoria();

    const rect = btnTag.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'menu-categoria-global';

    // Lista de categorías existentes
    if (categoriasUsuario.length) {
        const ul = document.createElement('ul');
        ul.className = 'menu-cat-lista';
        categoriasUsuario.forEach(cat => {
            const li = document.createElement('li');
            li.textContent = cat.name.toUpperCase();
            const esActual = cat.name.toUpperCase() === (categoriaActualOutfit || '').toUpperCase();
            if (esActual) li.classList.add('activa');
            li.addEventListener('click', () => {
                cerrarMenuCategoria();
                cambiarCategoriaOutfit(idOutfit, cat.name, btnTag);
            });
            ul.appendChild(li);
        });
        menu.appendChild(ul);
    } else {
        const info = document.createElement('p');
        info.className = 'menu-cat-vacio';
        info.textContent = 'You have to create a category first';
        menu.appendChild(info);
    }

    document.body.appendChild(menu);

    const margen = 8;
    let top  = rect.bottom + 5;
    let left = rect.left;
    if (left + 160 > window.innerWidth - margen) left = window.innerWidth - 160 - margen;
    if (top  + 200 > window.innerHeight - margen) top  = rect.top - menu.offsetHeight - 5;

    menu.style.top  = `${top}px`;
    menu.style.left = `${left}px`;
    menuCategoriaActivo = menu;
}

function cerrarMenuCategoria() {
    menuCategoriaActivo?.remove();
    menuCategoriaActivo = null;
}

document.addEventListener('click', cerrarMenuCategoria);

// ── CAMBIAR CATEGORÍA ─────────────────────────────────────────────────────────

async function cambiarCategoriaOutfit(idOutfit, nuevaCategoria, btnTag) {
    const token = obtenerToken();
    if (!token) return;

    btnTag.style.opacity = '0.5';
    const fd = new FormData();
    fd.append('category', nuevaCategoria);

    try {
        const r = await fetch(`${API}/api/outfits/${idOutfit}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
        });
        if (!r.ok) throw new Error();

        btnTag.innerHTML = `<i class="icon-tag"></i>${nuevaCategoria.toUpperCase()}`;
        btnTag.style.opacity = '1';

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
        ? todosLosOutfits.filter(o => (o.category || '').toUpperCase() === categoriaActiva.toUpperCase())
        : todosLosOutfits;

    gridArmario.innerHTML = '';
    if (!outfits.length) {
        gridArmario.innerHTML = '<p class="armario-vacio">You haven\'t saved any outfits yet.</p>';
        return;
    }
    outfits.forEach(o => gridArmario.appendChild(crearTarjetaOutfit(o)));
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

// ── INICIO ────────────────────────────────────────────────────────────────────

cargarUsuario();
cargarCategorias();
cargarOutfits();
