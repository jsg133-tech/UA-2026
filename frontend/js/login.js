import { mostrarModal } from './modal.js';
import { getToken, clearAuthSession, saveAuthSession } from './auth-storage.js';

const API = 'https://ua-2026.onrender.com';

const form = document.getElementById('form-login');
const inputEmail = document.getElementById('email');
const inputPass = document.getElementById('contrasena');
const inputRecordarme = document.getElementById('recordarme');
const btnLogin = document.getElementById('btn-login');
const passwordToggle = document.querySelector('.toggle-password[data-target="contrasena"]');
const LANG_STORAGE_KEY = 'bellaveste-language';

function idiomaActual() {
  return localStorage.getItem(LANG_STORAGE_KEY) === 'es' ? 'es' : 'en';
}

function textoLogin(clave) {
  const textos = {
    en: {
      loggingIn: 'LOGGING IN...',
      login: 'LOGIN',
    },
    es: {
      loggingIn: 'ENTRANDO...',
      login: 'INICIAR SESION',
    },
  };

  return textos[idiomaActual()][clave] || textos.en[clave] || '';
}

function alternarVisibilidadPassword(input, boton) {
  const mostrando = input.type === 'text';
  input.type = mostrando ? 'password' : 'text';
  boton.classList.toggle('is-visible', !mostrando);
  boton.setAttribute('aria-pressed', String(!mostrando));
  boton.setAttribute('aria-label', mostrando ? 'Show password' : 'Hide password');
}

if (passwordToggle) {
  passwordToggle.addEventListener('click', () => {
    alternarVisibilidadPassword(inputPass, passwordToggle);
  });
}

// Si ya hay sesión activa, VALIDAR el token antes de redirigir
async function validarSesionExistente() {
  const token = getToken();
  if (!token) {
    console.log('❌ No hay token guardado');
    return;
  }

  try {
    console.log('🔐 Validando token existente...');
    const response = await fetch(`${API}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      console.log('✅ Token válido, redirigiendo a inicio-logueado');
      window.location.href = 'inicio-logueado.html';
    } else {
      console.warn('⚠️ Token inválido, limpiando...');
      clearAuthSession();
    }
  } catch (err) {
    console.error('❌ Error validando token:', err.message);
    clearAuthSession();
  }
}

// Validar sesión al cargar
validarSesionExistente();

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = inputEmail.value.trim();
  const password = inputPass.value;

  if (!email || !password) {
    mostrarModal('Please fill in all fields.', 'error');
    return;
  }

  btnLogin.textContent = textoLogin('loggingIn');
  btnLogin.disabled = true;

  try {
    const response = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid username or password.');
      }
      throw new Error(data.error || 'Failed to log in.');
    }

    saveAuthSession({
      token: data.token,
      user: data.user,
      rememberMe: inputRecordarme.checked,
    });

    mostrarModal(
      'You have logged in successfully.',
      'success',
      'Welcome back!',
      {
        textoBoton: 'GO TO HOMEPAGE',
        alConfirmar: () => {
          window.location.href = 'inicio-logueado.html';
        },
      }
    );

    btnLogin.textContent = textoLogin('login');
    btnLogin.disabled = false;

  } catch (err) {
    mostrarModal(err.message, 'error', 'Access denied');
    btnLogin.textContent = textoLogin('login');
    btnLogin.disabled = false;
  }
});


