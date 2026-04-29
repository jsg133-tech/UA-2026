const API = 'https://ua-2026.onrender.com';
const TOKEN_KEY = 'token';

const gridArmario = document.getElementById('grid-armario');
const nombreUsuarioEl = document.getElementById('nombre-usuario');
const avatarUsuarioEl = document.getElementById('avatar-usuario');
const logoutLinkEl = document.getElementById('logout-link');

let categoriaActiva = null;

function obtenerToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function cerrarSesion() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('user');
    window.location.href = 'inicio.html';
}

function crearTarjetaOutfit(outfit) {
    const div = document.createElement('div');
    div.className = 'tarjeta-armario';

    const imagen = outfit.imageUrl || 'images/temporada.jfif';
    const nombre = (outfit.name || 'OUTFIT').toUpperCase();

    div.innerHTML = `
        <img src="${imagen}" alt="${nombre}">
        <div class="tarjeta-info">
            <span class="nombre-outfit">${nombre}</span>
            <button class="btn-favorito">&#9825;</button>
        </div>
    `;

    div.querySelector('.btn-favorito').addEventListener('click', (e) => {
        const boton = e.currentTarget;
        boton.classList.toggle('activo');
        boton.textContent = boton.classList.contains('activo') ? '♥' : '♡';
    });

    return div;
}

function renderizarOutfits(outfits) {
    gridArmario.innerHTML = '';

    if (!outfits.length) {
        gridArmario.innerHTML = '<p class="armario-vacio">Aún no tienes outfits guardados.</p>';
        return;
    }

    outfits.forEach(outfit => gridArmario.appendChild(crearTarjetaOutfit(outfit)));
}

async function cargarOutfits() {
    const token = obtenerToken();
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    let url = `${API}/api/armario`;
    if (categoriaActiva) url += `?categoria=${encodeURIComponent(categoriaActiva)}`;

    try {
        const respuesta = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const datos = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok) throw new Error(datos.error || 'Error al cargar outfits');

        renderizarOutfits(datos);
    } catch (err) {
        gridArmario.innerHTML = `<p class="armario-vacio">${err.message}</p>`;
    }
}

async function cargarUsuario() {
    const token = obtenerToken();
    if (!token) return;

    const guardado = localStorage.getItem('user');
    if (guardado) {
        try {
            const usuario = JSON.parse(guardado);
            nombreUsuarioEl.textContent = (usuario.name || 'USUARIO').toUpperCase();
            avatarUsuarioEl.src = usuario.avatar || 'images/perfil.jfif';
        } catch { /* continúa */ }
    }

    try {
        const respuesta = await fetch(`${API}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!respuesta.ok) return;
        const usuario = await respuesta.json();
        nombreUsuarioEl.textContent = (usuario.name || 'USUARIO').toUpperCase();
        avatarUsuarioEl.src = usuario.avatar || 'images/perfil.jfif';
        localStorage.setItem('user', JSON.stringify(usuario));
    } catch { /* silencioso */ }
}

// Filtro por categoría
document.querySelectorAll('.lista-categorias li').forEach(item => {
    item.addEventListener('click', () => {
        const categoria = item.textContent.trim();
        categoriaActiva = categoria === 'ALL' ? null : categoria;
        document.getElementById('chkCategorias').checked = false;
        cargarOutfits();
    });
});

logoutLinkEl.addEventListener('click', (e) => {
    e.preventDefault();
    cerrarSesion();
});

cargarUsuario();
cargarOutfits();
