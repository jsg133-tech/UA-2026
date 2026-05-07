import { getToken, getStoredUser, clearAuthSession, setStoredUser } from './auth-storage.js';

const API = 'https://ua-2026.onrender.com';

const gridArmario      = document.getElementById('grid-armario');
const categoriasBarra  = document.getElementById('categorias-bar');
const nombreUsuarioEl  = document.getElementById('nombre-usuario');
const avatarUsuarioEl  = document.getElementById('avatar-usuario');
const logoutLinkEl     = document.getElementById('logout-link');

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

    // ALL
    categoriasBarra.appendChild(crearPill('ALL', null, !categoriaActiva));

    // Categorías del usuario
    categoriasUsuario.forEach(cat => {
        categoriasBarra.appendChild(crearPill(cat.name, cat.name, categoriaActiva === cat.name));
    });

    // Pill "+"
    categoriasBarra.appendChild(crearPillNueva());
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

function crearPillNueva() {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;align-items:center;gap:6px;flex-shrink:0';

    const btnMas = document.createElement('button');
    btnMas.className = 'pill-cat-nueva';
    btnMas.title = 'Nueva categoría';
    btnMas.innerHTML = '<i class="icon-plus"></i>';

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'pill-input-wrapper';
    inputWrapper.hidden = true;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'pill-input';
    input.placeholder = 'Nueva categoría...';
    input.maxLength = 30;

    const btnOk = document.createElement('button');
    btnOk.type = 'button';
    btnOk.className = 'pill-btn-ok';
    btnOk.innerHTML = '<i class="icon-ok"></i>';

    const btnX = document.createElement('button');
    btnX.type = 'button';
    btnX.className = 'pill-btn-x';
    btnX.innerHTML = '<i class="icon-cancel"></i>';

    inputWrapper.append(input, btnOk, btnX);
    wrapper.append(btnMas, inputWrapper);

    btnMas.addEventListener('click', () => {
        btnMas.hidden = true;
        inputWrapper.hidden = false;
        input.value = '';
        input.focus();
    });

    btnX.addEventListener('click', () => {
        inputWrapper.hidden = true;
        btnMas.hidden = false;
    });

    const confirmar = async () => {
        const nombre = input.value.trim();
        if (!nombre) return;
        btnOk.disabled = true;
        await crearCategoria(nombre);
        btnOk.disabled = false;
    };

    btnOk.addEventListener('click', confirmar);
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter')  confirmar();
        if (e.key === 'Escape') { inputWrapper.hidden = true; btnMas.hidden = false; }
    });

    return wrapper;
}

async function crearCategoria(nombre) {
    const token = obtenerToken();
    if (!token) return;
    try {
        const r = await fetch(`${API}/api/armario/categorias`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name: nombre }),
        });
        if (!r.ok) return;
        const nueva = await r.json();
        categoriasUsuario.push(nueva);
        renderizarBarra();
    } catch { /* silencioso */ }
}

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
    div.querySelector('.btn-favorito').addEventListener('click', () =>
        quitarDelArmario(outfit._id, div.querySelector('.btn-favorito'), div)
    );

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
