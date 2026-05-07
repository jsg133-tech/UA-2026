import { getToken, getStoredUser } from './auth-storage.js';
import { mostrarModal } from './modal.js';

const API = 'https://ua-2026.onrender.com';

// Elementos de la interfaz (asegúrate de que existan en tus HTML de categorías)
// Cambia estas líneas al principio de categoria.js
const tituloSeccion = document.getElementById('titulo-filtro'); // Usa el ID que ya tienes
const gridResultados = document.getElementById('grid-resultados');

/**
 * Función principal que detecta qué estamos filtrando según la URL
 */
async function inicializarFiltros() {
    const params = new URLSearchParams(window.location.search);
    const filtroValor = params.get('v');    // Ejemplo: "RED", "WINTER", "CASUAL"
    const filtroTipo  = params.get('tipo'); // Ejemplo: "color", "season", "mood"

    if (!filtroValor || !filtroTipo) {
        console.warn("Faltan parámetros en la URL para filtrar.");
        return;
    }

    // Actualizar el título de la página para que el usuario sepa qué está viendo
    if (tituloSeccion) {
        tituloSeccion.textContent = `${filtroTipo.toUpperCase()}: ${filtroValor.toUpperCase()}`;
    }

    await cargarOutfitsFiltrados(filtroTipo, filtroValor);
}

/**
 * Pide al servidor los outfits y los filtra localmente según la base de datos
 */
async function cargarOutfitsFiltrados(tipo, valor) {
    const token = getToken();
    if (!token) return;

    try {
        // Pedimos todos los outfits del usuario (siguiendo el ejemplo de armario.js)
        const r = await fetch(`${API}/api/armario`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!r.ok) throw new Error('Error al conectar con la base de datos');
        
        const todosLosOutfits = await r.json();

        console.log("Datos recibidos de la BD:", todosLosOutfits);

        // Filtramos según la propiedad de la base de datos
        const filtrados = todosLosOutfits.filter(outfit => {
            const propiedad = outfit[tipo] ? outfit[tipo].toUpperCase() : '';
            return propiedad === valor.toUpperCase();
        });

        renderizarResultados(filtrados);

    } catch (err) {
        mostrarModal('No se pudieron cargar los outfits: ' + err.message, 'error');
    }
}

/**
 * Crea las tarjetas en el grid (siguiendo el estilo de inicio.js)
 */
function renderizarResultados(outfits) {
    if (!gridResultados) return;

    gridResultados.innerHTML = '';

    if (outfits.length === 0) {
        gridResultados.innerHTML = `<p class="armario-vacio">No outfits found with this criteria.</p>`;
        return;
    }

    outfits.forEach(outfit => {
        const tarjeta = document.createElement('article');
        tarjeta.className = 'tarjeta-armario'; // Usamos tu clase de estilo existente

        const imagen = outfit.imageUrl || 'images/fondo-ord.jfif';
        const nombre = (outfit.name || 'OUTFIT').toUpperCase();

        tarjeta.innerHTML = `
            <img src="${imagen}" alt="${nombre}">
            <div class="tarjeta-info">
                <div class="tarjeta-info-texto">
                    <span class="nombre-outfit">${nombre}</span>
                    <span class="tag-pequeno">${outfit.category || ''}</span>
                </div>
            </div>
        `;
        gridResultados.appendChild(tarjeta);
    });
}

// Ejecutar al cargar
document.addEventListener('DOMContentLoaded', inicializarFiltros);