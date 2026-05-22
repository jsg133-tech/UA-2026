import { getToken, getStoredUser, saveAuthSession, clearAuthSession, setStoredUser } from './auth-storage.js';
import { mostrarModal, mostrarConfirm, mostrarPrompt } from './modal.js';
import { inicializarBarraUsuario } from './barra-usuario.js';
import { t, tError } from './i18n-global.js';

const API = 'https://ua-2026.onrender.com';

// ── ELEMENTOS ────────────────────────────────────────────────
const vistaPrevia       = document.getElementById('vistaPrevia');
const inputFoto         = document.getElementById('inputFoto');
const nombreDisplay     = document.getElementById('perfil-nombre-display');
const inputName         = document.getElementById('input-name');
const inputEmail        = document.getElementById('input-email');
const inputNewPassword  = document.getElementById('input-new-password');
const inputCurrentPass  = document.getElementById('input-current-password');
const formPerfil        = document.getElementById('form-perfil');
const btnLogout         = document.querySelector('.btn-logout');
const btnDelete         = document.querySelector('.btn-delete');
const passwordToggles   = document.querySelectorAll('.toggle-password');

let avatarBase64 = null;

function alternarVisibilidadPassword(input, boton) {
    const mostrando = input.type === 'text';
    input.type = mostrando ? 'password' : 'text';
    boton.classList.toggle('is-visible', !mostrando);
    boton.setAttribute('aria-pressed', String(!mostrando));
    boton.setAttribute('aria-label', mostrando ? t('showPassword') : t('hidePassword'));
}

passwordToggles.forEach((boton) => {
    const targetId = boton.dataset.target;
    const input = document.getElementById(targetId);

    if (!input) {
        return;
    }

    boton.addEventListener('click', () => {
        alternarVisibilidadPassword(input, boton);
    });
});

// ── TABS ─────────────────────────────────────────────────────
function activarTab(targetId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(s => s.style.display = 'none');
    const btn = document.querySelector(`.tab-btn[data-target="${targetId}"]`);
    if (btn) btn.classList.add('active');
    const section = document.getElementById(targetId);
    if (section) section.style.display = 'block';
}

document.querySelectorAll('.tab-btn[data-target]').forEach(btn => {
    btn.addEventListener('click', () => activarTab(btn.dataset.target));
});

// Abrir pestaña desde URL ?tab=ajustes
const tabParam = new URLSearchParams(location.search).get('tab');
if (tabParam === 'ajustes') activarTab('seccion-ajustes');

// ── FOTO DE PERFIL ────────────────────────────────────────────
inputFoto.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        vistaPrevia.src = ev.target.result;
        avatarBase64 = ev.target.result;
    };
    reader.readAsDataURL(file);
});

// ── CARGAR DATOS DEL USUARIO ─────────────────────────────────
async function cargarUsuario() {
    const token = getToken();
    if (!token) { window.location.href = 'inicio.html'; return; }

    // Mostrar datos en caché primero
    const guardado = getStoredUser();
    if (guardado) rellenarFormulario(guardado);

    try {
        const r = await fetch(`${API}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) throw new Error();
        const user = await r.json();
        setStoredUser(user);
        rellenarFormulario(user);
    } catch {
        mostrarModal(t('profileLoadError'), 'error');
    }
}

function rellenarFormulario(user) {
    if (inputName)    inputName.value  = user.name  || '';
    if (inputEmail)   inputEmail.value = user.email || '';
    if (nombreDisplay) nombreDisplay.textContent = (user.name || t('usuario')).toUpperCase();
    if (vistaPrevia && user.avatar) vistaPrevia.src = user.avatar;

    // Actualizar también la barra superior
    const barraAvatar = document.getElementById('avatar-usuario');
    const barraNombre = document.getElementById('nombre-usuario');
    if (barraAvatar && user.avatar) barraAvatar.src = user.avatar;
    if (barraNombre) barraNombre.textContent = (user.name || t('usuario')).toUpperCase();
}

// ── GUARDAR CAMBIOS ───────────────────────────────────────────
formPerfil.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name         = inputName.value.trim();
    const email        = inputEmail.value.trim();
    const newPassword  = inputNewPassword.value;
    const currentPassword = inputCurrentPass.value;

    // Si hay cambios que requieren contraseña actual
    const needsPassword = email !== (getStoredUser()?.email || '') || newPassword;
    if (needsPassword && !currentPassword) {
        mostrarModal(t('enterPasswordToSave'), 'error');
        return;
    }

    const body = {};
    if (name)  body.name = name;
    if (email) body.email = email;
    if (newPassword) body.newPassword = newPassword;
    if (currentPassword) body.currentPassword = currentPassword;
    if (avatarBase64) body.avatar = avatarBase64;

    const token = getToken();
    try {
        const r = await fetch(`${API}/api/auth/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || 'Error updating profile');

        setStoredUser(data);
        rellenarFormulario(data);
        inputNewPassword.value  = '';
        inputCurrentPass.value  = '';
        avatarBase64 = null;
        mostrarModal(t('profileUpdated'), 'success', t('ready'));
    } catch (err) {
        mostrarModal(tError(err.message), 'error');
    }
});

// ── LOGOUT ────────────────────────────────────────────────────
btnLogout?.addEventListener('click', () => {
    mostrarConfirm(
        t('logoutQuestion'),
        () => { clearAuthSession(); window.location.href = 'inicio.html'; },
        t('logoutTitle'),
        t('logoutBtn')
    );
});

// ── ELIMINAR CUENTA ───────────────────────────────────────────
btnDelete?.addEventListener('click', () => {
    mostrarPrompt(
        t('deleteAccountMsg'),
        async (password) => {
            const token = getToken();
            try {
                const response = await fetch(`${API}/api/auth/me`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ password }),
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(data.error || t('deleteAccountFailed'));

                mostrarModal(t('accountDeleted'), 'success', t('goodbye'));
                setTimeout(() => { clearAuthSession(); window.location.href = 'inicio.html'; }, 1500);
            } catch (err) {
                mostrarModal(tError(err.message), 'error', t('deleteAccountFailed'));
            }
        },
        t('deleteAccountTitle'),
        t('deleteAccountPrompt'),
        t('delete')
    );
});

// ── INICIO ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    try { await inicializarBarraUsuario(); } catch { /* silencioso */ }
    cargarUsuario();
});
