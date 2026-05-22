import { mostrarModal } from './modal.js';
import { clearAuthSession } from './auth-storage.js';
import { t, tError } from './i18n-global.js';

const API = 'https://ua-2026.onrender.com';

const form = document.querySelector('.formulario');
const inputNombre = document.getElementById('nombre');
const inputUser = document.getElementById('username');
const inputEmail = document.getElementById('email');
const inputPass = document.getElementById('contrasena');
const inputConfirm = document.getElementById('confirmar-contrasena');
const passwordToggles = document.querySelectorAll('.toggle-password');
const LANG_STORAGE_KEY = 'bellaveste-language';

function idiomaActual() {
    return localStorage.getItem(LANG_STORAGE_KEY) === 'es' ? 'es' : 'en';
}

function textoRegistro(clave) {
    const textos = {
        en: {
            registering: 'REGISTERING...',
            register: 'REGISTER',
        },
        es: {
            registering: 'REGISTRANDO...',
            register: 'REGISTRARME',
        },
    };

    return textos[idiomaActual()][clave] || textos.en[clave] || '';
}

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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

function validarFormularioRegistro() {
    const nombre = inputNombre.value.trim();
    const username = inputUser.value.trim();
    const email = inputEmail.value.trim();
    const password = inputPass.value;
    const confirm = inputConfirm.value;

    if (!nombre || !username || !email || !password || !confirm) {
        mostrarModal(t('fillRequired'), 'error', t('attention'));
        return false;
    }

    if (nombre.length < 2) {
        mostrarModal(t('nameTooShort'), 'error');
        return false;
    }

    if (!USER_REGEX.test(username)) {
        mostrarModal(t('usernameInvalid'), 'error');
        return false;
    }

    if (!EMAIL_REGEX.test(email)) {
        mostrarModal(t('invalidEmail'), 'error');
        return false;
    }

    if (password.length < 6) {
        mostrarModal(t('passwordTooShort'), 'error');
        return false;
    }

    if (password !== confirm) {
        mostrarModal(t('passwordsMismatch'), 'error');
        return false;
    }

    return true;
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validarFormularioRegistro()) {
        return;
    }

    const boton = form.querySelector('button[type="submit"]');
    boton.textContent = textoRegistro('registering');
    boton.disabled = true;

    try {
        const response = await fetch(`${API}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: inputNombre.value.trim(),
                username: inputUser.value.trim(),
                email: inputEmail.value.trim(),
                password: inputPass.value,
            }),
        });

        const data = await response.json();

        if (!response.ok) throw new Error(tError(data.error) || t('registrationError'));

        mostrarModal(
            t('registrationSuccess'),
            'success',
            t('registrationCompleted'),
            {
                textoBoton: t('goToLogin'),
                alConfirmar: () => {
                    clearAuthSession();
                    window.location.href = 'inicio.html';
                },
            }
        );

        form.reset();
        boton.textContent = textoRegistro('register');
        boton.disabled = false;

    } catch (err) {
        mostrarModal(err.message, 'error', t('registrationError'));
        boton.textContent = textoRegistro('register');
        boton.disabled = false;
    }
});