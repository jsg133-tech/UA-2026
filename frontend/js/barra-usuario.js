const API = 'https://ua-2026.onrender.com';
const CLAVE_TOKEN = 'token';
const CLAVE_USUARIO = 'user';

function obtenerToken() {
  return localStorage.getItem(CLAVE_TOKEN);
}

function obtenerUsuarioGuardado() {
  const raw = localStorage.getItem(CLAVE_USUARIO);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function mostrarUsuarioEnBarra(usuario) {
  if (!usuario) return;

  const nombre = (usuario.name || 'USUARIO').toUpperCase();
  const avatar = usuario.avatar || 'images/perfil.jfif';

  const nombreBarra = document.querySelector('.usuario-barra .nombre-usuario');
  if (nombreBarra) nombreBarra.textContent = nombre;

  const avatarBarra = document.querySelector('.usuario-barra .avatar');
  if (avatarBarra) avatarBarra.src = avatar;
}

function cerrarSesion() {
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem(CLAVE_USUARIO);
  window.location.href = 'inicio.html';
}

function enlazarAccionesLogout() {
  const enlacesLogout = document.querySelectorAll('.menu-perfil a[href="./inicio.html"], #logout-link, .btn-logout');
  enlacesLogout.forEach((enlace) => {
    enlace.addEventListener('click', (e) => {
      e.preventDefault();
      cerrarSesion();
    });
  });
}

async function pedirUsuarioActual() {
  const token = obtenerToken();
  const response = await fetch(`${API}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'No se pudo cargar el usuario actual.');
  }

  return data;
}

export async function inicializarBarraUsuario() {
  const token = obtenerToken();
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  enlazarAccionesLogout();

  const usuarioGuardado = obtenerUsuarioGuardado();
  if (usuarioGuardado) {
    mostrarUsuarioEnBarra(usuarioGuardado);
  }

  try {
    const usuarioActual = await pedirUsuarioActual();
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuarioActual));
    mostrarUsuarioEnBarra(usuarioActual);
  } catch {
    // Si el token no es valido, cerramos sesion para evitar estados inconsistentes.
    cerrarSesion();
  }
}

inicializarBarraUsuario();