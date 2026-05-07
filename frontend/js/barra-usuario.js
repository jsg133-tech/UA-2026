import { getToken, getStoredUser, clearAuthSession, setStoredUser } from './auth-storage.js';
const API = 'https://ua-2026.onrender.com';

function obtenerToken() {
  return getToken();
}

function obtenerUsuarioGuardado() {
  return getStoredUser();
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
  clearAuthSession();
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
  console.log('🔐 Token en barra-usuario:', token ? 'Existe' : 'NO EXISTE');
  
  if (!token) {
    console.warn('❌ No hay token, se muestra modo invitado');
    return;
  }

  enlazarAccionesLogout();

  const usuarioGuardado = obtenerUsuarioGuardado();
  if (usuarioGuardado) {
    mostrarUsuarioEnBarra(usuarioGuardado);
  }

  try {
    const usuarioActual = await pedirUsuarioActual();
    setStoredUser(usuarioActual);
    mostrarUsuarioEnBarra(usuarioActual);
    console.log('✅ Usuario cargado correctamente:', usuarioActual.name);
  } catch (err) {
    console.error('❌ Error al cargar usuario:', err.message);
    clearAuthSession();
    console.warn('⚠️ Token inválido o expirado - sesión limpiada');
  }
}

inicializarBarraUsuario();
