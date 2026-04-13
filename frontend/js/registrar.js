import { showModal } from './modal.js';

const API = 'https://ua-2026-production.up.railway.app';

const form         = document.querySelector('.formulario');
const inputNombre  = document.getElementById('nombre');
const inputEmail   = document.getElementById('email');
const inputPass    = document.getElementById('contrasena');
const inputConfirm = document.getElementById('confirmar-contrasena');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (inputPass.value !== inputConfirm.value) {
    showModal('Las contraseñas no coinciden.', 'error');
    return;
  }

  if (inputPass.value.length < 6) {
    showModal('La contraseña debe tener al menos 6 caracteres.', 'error');
    return;
  }

  const boton = form.querySelector('button[type="submit"]');
  boton.textContent = 'REGISTERING...';
  boton.disabled    = true;

  try {
    const response = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:     inputNombre.value.trim(),
        email:    inputEmail.value.trim(),
        password: inputPass.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || 'Error al registrar');

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    window.location.href = 'inicio-logueado.html';

  } catch (err) {
    showModal(err.message, 'error', 'Error de registro');
    boton.textContent = 'REGISTER';
    boton.disabled    = false;
  }
});
