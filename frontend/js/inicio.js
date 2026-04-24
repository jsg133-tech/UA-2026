import { mostrarModal } from './modal.js';

const API = 'https://ua-2026.onrender.com';
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const nombreUsuarioEl = document.getElementById('nombre-usuario');
const avatarUsuarioEl = document.getElementById('avatar-usuario');
const outfitSectionEl = document.querySelector('.outfit-dia');
const logoutLinkEl = document.getElementById('logout-link');

const CANTIDAD_INICIAL_OUTFITS = 4;
const CANTIDAD_POR_BOTON = 4;

let outfitsCargados = [];
let cantidadVisible = CANTIDAD_INICIAL_OUTFITS;
let botonMostrarMas = null;

function obtenerToken() {
	return localStorage.getItem(TOKEN_KEY);
}

function obtenerUsuarioGuardado() {
	const raw = localStorage.getItem(USER_KEY);
	if (!raw) return null;

	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

function mostrarUsuarioEnInterfaz(user) {
	const displayName = (user?.name || 'USUARIO').toUpperCase();
	const avatar = user?.avatar || 'images/perfil.jfif';

	nombreUsuarioEl.textContent = displayName;
	avatarUsuarioEl.src = avatar;
}

function cerrarSesionYIrAInicio() {
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(USER_KEY);
	window.location.href = 'inicio.html';
}

function formatearFecha(value) {
	if (!value) return '';

	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return '';

	return d.toLocaleDateString('es-ES', {
		day: '2-digit',
		month: 'long',
		year: 'numeric',
	});
}

function obtenerImagenOutfit(outfit) {
	if (outfit.imageUrl && outfit.imageUrl.trim()) {
		return outfit.imageUrl;
	}

	return 'images/fondo-ord.jfif';
}

function formatearTextoCampo(valor, textoPorDefecto) {
	const texto = (valor || '').trim();
	return texto ? texto.toUpperCase() : textoPorDefecto;
}

function crearTarjetaOutfit(outfit, userName, userAvatar) {
	const article = document.createElement('article');
	article.className = 'tarjeta-outfit';

	const imageUrl = obtenerImagenOutfit(outfit);
	const title = formatearTextoCampo(outfit.name, 'OUTFIT');
	const category = formatearTextoCampo(outfit.category, 'SIN CATEGORIA');
	const season = formatearTextoCampo(outfit.season, 'SIN TEMPORADA');
	const size = formatearTextoCampo(outfit.size, 'SIN TALLA');
	const color = formatearTextoCampo(outfit.color, 'SIN COLOR');
	const created = formatearFecha(outfit.createdAt);

	article.innerHTML = `
		<div class="imagen-outfit">
			<img src="${imageUrl}" alt="${title}">
		</div>
		<div class="info-outfit">
			<h3>${title}</h3>
			<div class="mini-galeria">
				<button type="button" aria-label="Imagen anterior"><i class="icon-left-open"></i></button>
				<img src="${imageUrl}" alt="${title}">
				<button type="button" aria-label="Imagen siguiente"><i class="icon-right-open"></i></button>
			</div>
			<div class="etiquetas">
				<span>${season}</span>
				<span>${category}</span>
			</div>
			<div class="etiquetas">
				<span>${size}</span>
				<span>${color}</span>
			</div>
			<div class="autor">
				<img src="${userAvatar}" alt="Autor">
				<span>${userName}</span>
			</div>
		</div>
		<time class="fecha">${created}</time>
	`;

	return article;
}

function renderizarOutfits(outfits, user) {
	outfitsCargados = Array.isArray(outfits) ? outfits : [];
	cantidadVisible = CANTIDAD_INICIAL_OUTFITS;
	actualizarListaOutfits(user);
}

function limpiarTarjetasOutfit() {
	const oldCards = outfitSectionEl.querySelectorAll('.tarjeta-outfit');
	oldCards.forEach((card) => card.remove());

	const empty = outfitSectionEl.querySelector('.outfits-empty');
	if (empty) empty.remove();

	if (botonMostrarMas) {
		botonMostrarMas.remove();
		botonMostrarMas = null;
	}
}

function crearBotonMostrarMas(user) {
	const boton = document.createElement('button');
	boton.type = 'button';
	boton.className = 'btn-mostrar-mas';
	boton.textContent = 'SHOW MORE OUTFITS';

	boton.addEventListener('click', () => {
		cantidadVisible += CANTIDAD_POR_BOTON;
		actualizarListaOutfits(user);
	});

	return boton;
}

function actualizarListaOutfits(user) {
	limpiarTarjetasOutfit();

	if (!Array.isArray(outfitsCargados) || outfitsCargados.length === 0) {
		const empty = document.createElement('p');
		empty.className = 'outfits-empty';
		empty.textContent = 'You do not have any outfits created yet.';
		outfitSectionEl.appendChild(empty);
		return;
	}

	const userName = user?.name || 'Usuario';
	const userAvatar = user?.avatar || 'images/perfil.jfif';
	const outfitsVisibles = outfitsCargados.slice(0, cantidadVisible);

	outfitsVisibles.forEach((outfit) => {
		outfitSectionEl.appendChild(crearTarjetaOutfit(outfit, userName, userAvatar));
	});

	if (cantidadVisible < outfitsCargados.length) {
		botonMostrarMas = crearBotonMostrarMas(user);
		outfitSectionEl.appendChild(botonMostrarMas);
	}
}

async function peticionConAutorizacion(path) {
	const token = obtenerToken();
	const response = await fetch(`${API}${path}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	const data = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(data.error || 'No se pudo cargar la informacion.');
	}
	return data;
}

async function iniciarPagina() {
	const token = obtenerToken();
	if (!token) {
		window.location.href = 'login.html';
		return;
	}

	const userFromStorage = obtenerUsuarioGuardado();
	if (userFromStorage) mostrarUsuarioEnInterfaz(userFromStorage);

	try {
		const outfits = await peticionConAutorizacion('/api/outfits');
		renderizarOutfits(outfits, userFromStorage || {});
	} catch (err) {
		mostrarModal(err.message || 'Error loading homepage data.', 'error');
		return;
	}

	try {
		const user = await peticionConAutorizacion('/api/auth/me');
		localStorage.setItem(USER_KEY, JSON.stringify(user));
		mostrarUsuarioEnInterfaz(user);
	} catch (err) {
		if (/token|expired|invalid|401/i.test(err.message)) {
			mostrarModal('Your session has expired. Please log in again.', 'error');
			setTimeout(() => cerrarSesionYIrAInicio(), 400);
		}
	}
}

logoutLinkEl.addEventListener('click', (e) => {
	e.preventDefault();
	cerrarSesionYIrAInicio();
});

iniciarPagina();
