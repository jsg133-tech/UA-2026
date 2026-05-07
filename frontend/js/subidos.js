import { getToken } from './auth-storage.js';
import { inicializarBarraUsuario } from './barra-usuario.js';
import { mostrarConfirm } from './modal.js';

const API  = 'https://ua-2026.onrender.com';
const grid = document.getElementById('subidos-grid');

function crearTarjeta(outfit) {
    const div = document.createElement('div');
    div.className = 'subidos-tarjeta';

    const foto = outfit.imageUrl || 'images/temporada.jfif';
    const nombre = (outfit.name || 'Outfit').toUpperCase();

    const pills = [outfit.category, outfit.season]
        .filter(Boolean)
        .map(v => `<span class="subidos-pill">${v.toUpperCase()}</span>`)
        .join('');

    const colorDot = outfit.color
        ? `<span class="subidos-color" style="background:${outfit.color}"></span>`
        : '';

    div.innerHTML = `
        <img class="subidos-foto" src="${foto}" alt="${nombre}" loading="lazy">
        <div class="subidos-overlay">
            <span class="subidos-nombre">${nombre}</span>
            <div class="subidos-meta">${pills}${colorDot}</div>
        </div>
        <button class="btn-eliminar-outfit" title="Delete outfit">
            <i class="icon-trash"></i>
        </button>
    `;

    div.addEventListener('click', (e) => {
        if (e.target.closest('.btn-eliminar-outfit')) return;
        window.location.href = `outfit.html?id=${outfit._id}`;
    });

    div.querySelector('.btn-eliminar-outfit').addEventListener('click', (e) => {
        e.stopPropagation();
        mostrarConfirm(
            `"${outfit.name}" will be permanently deleted.`,
            async () => {
                const token = getToken();
                try {
                    const r = await fetch(`${API}/api/outfits/${outfit._id}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (r.ok) {
                        div.style.transition = 'opacity 0.3s, transform 0.3s';
                        div.style.opacity = '0';
                        div.style.transform = 'scale(0.9)';
                        setTimeout(() => div.remove(), 320);
                    }
                } catch { /* silencioso */ }
            },
            'Delete outfit?'
        );
    });

    return div;
}

async function cargarSubidos() {
    const token = getToken();
    if (!token) {
        window.location.href = 'inicio.html';
        return;
    }

    try {
        const r = await fetch(`${API}/api/outfits/mine`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!r.ok) throw new Error();
        const outfits = await r.json();

        grid.innerHTML = '';

        if (!outfits.length) {
            grid.innerHTML = `
                <div class="subidos-vacio">
                    <i class="icon-picture"></i>
                    <p>You haven't posted any outfits yet.</p>
                    <a href="subidaOutfit.html">POST YOUR FIRST OUTFIT</a>
                </div>
            `;
            return;
        }

        outfits.forEach(o => grid.appendChild(crearTarjeta(o)));

    } catch {
        grid.innerHTML = `
            <div class="subidos-vacio">
                <p>Could not load your outfits.</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try { await inicializarBarraUsuario(); } catch { /* silencioso */ }
    cargarSubidos();
});
