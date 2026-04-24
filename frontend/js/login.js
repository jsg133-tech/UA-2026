import { mostrarModal } from './modal.js';

const API = 'https://ua-2026.onrender.com';

const form = document.getElementById('form-login');
const inputEmail = document.getElementById('email');
const inputPass = document.getElementById('contrasena');
const btnLogin = document.getElementById('btn-login');

// Si ya hay sesión activa, ir directo a la app
if (localStorage.getItem('token')) {
  window.location.href = 'inicio-logueado.html';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = inputEmail.value.trim();
  const password = inputPass.value;

  if (!email || !password) {
    mostrarModal('Please fill in all fields.', 'error');
    return;
  }

  btnLogin.textContent = 'LOGGING IN...';
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

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

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

    btnLogin.textContent = 'LOGIN';
    btnLogin.disabled = false;

  } catch (err) {
    mostrarModal(err.message, 'error', 'Access denied');
    btnLogin.textContent = 'LOGIN';
    btnLogin.disabled = false;
  }
});
