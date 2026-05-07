import { mostrarModal } from './modal.js';
import { getToken, getStoredUser, clearAuthSession, setStoredUser } from './auth-storage.js';

const API = 'https://ua-2026.onrender.com';

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
	return getToken();
}

function obtenerUsuarioGuardado() {
	return getStoredUser();
}

function mostrarUsuarioEnInterfaz(user) {
	const displayName = (user?.name || 'USUARIO').toUpperCase();
	const avatar = user?.avatar || 'images/perfil.jfif';

	nombreUsuarioEl.textContent = displayName;
	avatarUsuarioEl.src = avatar;
}

function cerrarSesionYIrAInicio() {
	clearAuthSession();
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
			<time class="fecha">${created}</time>
		</div>
		<div class="info-outfit">
			<h3>${title}</h3>
			<div class="etiquetas">
				<span>${season}</span>
				<span>${category}</span>
				<span>${size}</span>
				<span>${color}</span>
			</div>
			<div class="outfit-footer">
				<div class="autor">
					<img src="${userAvatar}" alt="${userName}">
					<span>${userName}</span>
				</div>
				<button class="btn-anadir-armario" title="Añadir a mi armario" type="button">
					<i class="icon-t-shirt"></i><span>ADD CLOSET</span>
				</button>
			</div>
		</div>
	`;

	const btnAnadir = article.querySelector('.btn-anadir-armario');
	btnAnadir.addEventListener('click', () => agregarArmario(outfit, btnAnadir));

	return article;
}

async function agregarArmario(outfit, boton) {
	const token = obtenerToken();
	if (!token) {
		mostrarModal('Debes iniciar sesión para guardar outfits.', 'error');
		return;
	}

	boton.classList.add('cargando');
	boton.disabled = true;

	try {
		const formData = new FormData();
		formData.append('name',     outfit.name     || 'Outfit');
		formData.append('category', outfit.category || 'CASUAL');
		formData.append('season',   outfit.season   || '');
		formData.append('size',     outfit.size     || '');
		formData.append('color',    outfit.color    || '');
		if (outfit.imageUrl) formData.append('imageUrl', outfit.imageUrl);

		const respuesta = await fetch(`${API}/api/outfits`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}` },
			body: formData,
		});

		const datos = await respuesta.json().catch(() => ({}));
		if (!respuesta.ok) throw new Error(datos.error || 'No se pudo añadir el outfit.');

		boton.classList.remove('cargando');
		boton.classList.add('anadido');
		boton.innerHTML = '<i class="icon-ok"></i>';
		boton.title = 'Añadido a tu armario';

		setTimeout(() => {
			boton.classList.remove('anadido');
			boton.innerHTML = '<i class="icon-t-shirt"></i>';
			boton.title = 'Añadir a mi armario';
			boton.disabled = false;
		}, 2200);

	} catch (err) {
		boton.classList.remove('cargando');
		boton.disabled = false;
		mostrarModal(err.message || 'No se pudo añadir el outfit.', 'error');
	}
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

	const outfitsVisibles = outfitsCargados.slice(0, cantidadVisible);

	outfitsVisibles.forEach((outfit) => {
		const outfitUser = outfit.userId;
		const outfitUserName = (outfitUser?.name || 'Usuario').toUpperCase();
		const outfitUserAvatar = outfitUser?.avatar || 'images/perfil.jfif';
		outfitSectionEl.appendChild(crearTarjetaOutfit(outfit, outfitUserName, outfitUserAvatar));
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
	console.log('📄 Iniciando página, token:', token ? 'Existe ✓' : 'NO EXISTE ✗');
	
	if (!token) {
		console.warn('⚠️ No hay token guardado');
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
		setStoredUser(user);
		mostrarUsuarioEnInterfaz(user);
		console.log('✅ Usuario autenticado:', user.name);
	} catch (err) {
		console.error('❌ Error al obtener usuario:', err.message);
		if (/token|expired|invalid|401/i.test(err.message)) {
			console.warn('⚠️ Token inválido o expirado');
			clearAuthSession();
			mostrarModal('Your session has expired. Please log in again.', 'error');
			// NO redirijir automáticamente para permitir debugging
		}
	}
}

logoutLinkEl.addEventListener('click', (e) => {
	e.preventDefault();
	cerrarSesionYIrAInicio();
});

iniciarPagina();
