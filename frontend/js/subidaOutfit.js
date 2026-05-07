// Control de subida de outfit - SUBIDAOUTFIT.JS

import { mostrarModal } from './modal.js';
import { inicializarBarraUsuario } from './barra-usuario.js';
import { getToken } from './auth-storage.js';

const API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://ua-2026.onrender.com';

// Convierte cualquier imagen a JPEG para evitar rechazos del servidor
function toJpeg(file) {
    return new Promise((resolve) => {
        const ext = file.name.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) && file.type !== 'image/jfif') {
            return resolve(file);
        }
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            canvas.getContext('2d').drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            canvas.toBlob((blob) => {
                resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
            }, 'image/jpeg', 0.92);
        };
        img.src = url;
    });
}

// Elementos del formulario - OUTFIT
const form = document.getElementById('form-subida');
const inputNombre = document.getElementById('outfit-name');
const inputFoto = document.getElementById('outfit-picture');
const previewPicture = document.getElementById('preview-picture');

// Elementos del formulario - PRENDAS
const btnAgregarPrenda = document.getElementById('btn-agregar-prenda');
const listaPrendas = document.getElementById('lista-prendas');
const btnCancelar = document.getElementById('btn-cancelar');
const btnUpload = document.getElementById('btn-upload');

let contadorPrendas = 0;
let prendas = [];

// Inicializar página
async function inicializar() {
    try {
        await inicializarBarraUsuario();
    } catch (err) {
        console.error('Error al inicializar:', err);
    }
}

// Preview de imagen
inputFoto.addEventListener('change', (e) => {
    const archivo = e.target.files[0];
    if (archivo) {
        const reader = new FileReader();
        reader.onload = (event) => {
            previewPicture.innerHTML = `<img src="${event.target.result}" alt="Preview outfit">`;
            inputFoto.classList.add('valido');
        };
        reader.readAsDataURL(archivo);
    }
});

// Validar nombre del outfit
inputNombre.addEventListener('change', () => validarCampo(inputNombre));
inputNombre.addEventListener('blur', () => validarCampo(inputNombre));

// Validar campo en tiempo real
function validarCampo(input) {
    const valor = input.value.trim();
    const esValido = valor.length > 0;

    if (esValido) {
        input.classList.add('valido');
        input.classList.remove('invalido');
    } else {
        input.classList.remove('valido');
    }

    return esValido;
}

// Agregar prenda
btnAgregarPrenda.addEventListener('click', (e) => {
    e.preventDefault();
    contadorPrendas++;

    const id = `prenda-${contadorPrendas}`;

    const item = document.createElement('div');
    item.className = 'item-prenda';
    item.id = id;
    item.innerHTML = `
        <div class="prenda-header">
            <div class="prenda-grid">
                <div class="campo-prenda">
                    <label class="label-mini">Piece</label>
                    <input type="text" class="input-prenda input-nombre" placeholder="e.g., T-shirt" required>
                </div>
                <div class="campo-prenda">
                    <label class="label-mini">Brand</label>
                    <input type="text" class="input-prenda input-marca" placeholder="Brand">
                </div>
                <div class="campo-prenda">
                    <label class="label-mini">Link</label>
                    <input type="url" class="input-prenda input-link" placeholder="Link">
                </div>
                <div class="campo-prenda">
                    <label class="label-mini">Size</label>
                    <input type="text" class="input-prenda input-size" placeholder="Size">
                </div>
                <div class="campo-prenda">
                    <label class="label-mini">Color</label>
                    <input type="color" class="input-prenda input-color" value="#5a0d16">
                </div>
                <div class="campo-prenda">
                    <label class="label-mini">Season</label>
                    <select class="input-prenda input-season">
                        <option value="">Select</option>
                        <option value="spring">Spring</option>
                        <option value="summer">Summer</option>
                        <option value="autumn">Autumn</option>
                        <option value="winter">Winter</option>
                    </select>
                </div>
            </div>
            <button type="button" class="boton-eliminar-prenda" title="Delete piece">
                <i class="icon-trash"></i>
            </button>
        </div>
        <div class="campo-prenda campo-descripcion">
            <label class="label-mini">Description</label>
            <textarea class="input-prenda input-descripcion" placeholder="Describe this piece..." rows="2"></textarea>
        </div>
        <div class="prenda-foto-section">
            <label for="prenda-picture-${contadorPrendas}" class="etiqueta-foto-prenda">
                <i class="icon-picture"></i> Piece Photo
            </label>
            <input 
                type="file" 
                id="prenda-picture-${contadorPrendas}" 
                class="input-archivo-prenda"
                accept="image/*"
                required
            >
            <div class="preview-prenda" id="preview-${id}"></div>
        </div>
    `;

    listaPrendas.appendChild(item);

    // Guardar datos de la prenda en tiempo real
    const inputNombrePrenda = item.querySelector('.input-nombre');
    const inputMarca = item.querySelector('.input-marca');
    const inputLink = item.querySelector('.input-link');
    const inputSize = item.querySelector('.input-size');
    const inputColor = item.querySelector('.input-color');
    const inputSeason = item.querySelector('.input-season');
    const inputDescripcion = item.querySelector('.input-descripcion');
    const inputFotoPrenda = item.querySelector('.input-archivo-prenda');
    const previewPrenda = item.querySelector(`#preview-${id}`);

    function guardarPrenda() {
        const nombre = inputNombrePrenda.value.trim();
        const index = prendas.findIndex(p => p.id === id);

        if (nombre) {
            inputNombrePrenda.classList.add('valido');
            const prenda = {
                id,
                nombre,
                marca: inputMarca.value.trim(),
                link: inputLink.value.trim(),
                size: inputSize.value.trim(),
                color: inputColor.value,
                season: inputSeason.value,
                descripcion: inputDescripcion.value.trim(),
                foto: inputFotoPrenda.files[0] || null,
            };

            if (index === -1) {
                prendas.push(prenda);
            } else {
                prendas[index] = prenda;
            }
        } else {
            inputNombrePrenda.classList.remove('valido');
            if (index !== -1) {
                prendas.splice(index, 1);
            }
        }
    }

    inputNombrePrenda.addEventListener('blur', guardarPrenda);
    inputMarca.addEventListener('blur', guardarPrenda);
    inputLink.addEventListener('blur', guardarPrenda);
    inputSize.addEventListener('blur', guardarPrenda);
    inputColor.addEventListener('change', guardarPrenda);
    inputSeason.addEventListener('change', guardarPrenda);
    inputDescripcion.addEventListener('blur', guardarPrenda);

    // Manejar foto de la prenda
    inputFotoPrenda.addEventListener('change', (e) => {
        const archivo = e.target.files[0];
        if (archivo) {
            const reader = new FileReader();
            reader.onload = (event) => {
                previewPrenda.innerHTML = `<img src="${event.target.result}" alt="Preview piece">`;
                inputFotoPrenda.classList.add('valido');
                guardarPrenda();
            };
            reader.readAsDataURL(archivo);
        }
    });

    // Permitir clic en la preview para seleccionar foto
    previewPrenda.addEventListener('click', () => {
        inputFotoPrenda.click();
    });

    // Mostrar placeholder si no hay foto
    if (!inputFotoPrenda.files.length) {
        previewPrenda.innerHTML = '<i class="icon-picture"></i> Click to upload';
    }

    // Eliminar prenda
    const btnEliminar = item.querySelector('.boton-eliminar-prenda');
    btnEliminar.addEventListener('click', () => {
        item.remove();
        prendas = prendas.filter(p => p.id !== id);
    });

    inputNombrePrenda.focus();
});

// Cancelar
btnCancelar.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('¿Descartar cambios?')) {
        window.location.href = 'inicio-logueado.html';
    }
});

// Enviar formulario
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validar campos requeridos del outfit
    if (!inputNombre.value.trim()) {
        mostrarModal('Please enter an outfit name.', 'error');
        return;
    }

    if (!inputFoto.files.length) {
        mostrarModal('Please select an outfit picture.', 'error');
        return;
    }

    // Validar que haya al menos una prenda
    if (prendas.length === 0) {
        mostrarModal('Please add at least one piece to the outfit.', 'error');
        return;
    }

    // Validar que todas las prendas tengan foto
    for (const prenda of prendas) {
        if (!prenda.foto) {
            mostrarModal(`Please upload a photo for the "${prenda.nombre}" piece.`, 'error');
            return;
        }
    }

    btnUpload.disabled = true;
    btnUpload.textContent = 'UPLOADING...';

    try {
        const token = getToken();

        if (!token) {
            throw new Error('You are not authenticated. Please log in.');
        }

        console.log('Iniciando upload del outfit...');
        console.log('Outfit name:', inputNombre.value.trim());
        console.log('Número de prendas:', prendas.length);

        // Crear FormData para enviar archivo
        const formData = new FormData();
        formData.append('name', inputNombre.value.trim());
        formData.append('category', 'CASUAL');
        formData.append('image', await toJpeg(inputFoto.files[0]));

        // Agregar fotos de las prendas
        for (let index = 0; index < prendas.length; index++) {
            const prenda = prendas[index];
            if (prenda.foto) {
                formData.append(`piece-image-${index}`, await toJpeg(prenda.foto));
                console.log(`Agregada foto de prenda ${index}:`, prenda.nombre);
            }
        }
        
        // Crear estructura de prendas sin las fotos (ya que van como archivos separados)
        const prendaszSinFotos = prendas.map(({ foto, ...prenda }) => prenda);
        formData.append('pieces', JSON.stringify(prendaszSinFotos));
        
        console.log('FormData preparado, enviando...');

        // Enviar al servidor
        const response = await fetch(`${API}/api/outfits`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        console.log('Response status:', response.status);
        
        let data;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            console.error('Response text:', text);
            data = { error: 'Server error - check console for details' };
        }
        
        console.log('Response data:', data);

        if (!response.ok) {
            throw new Error(data.error || `Server error: ${response.status}`);
        }

        console.log('Upload exitoso, redireccionando...');
        mostrarModal('Outfit uploaded successfully!', 'success', 'Success');
        
        // Éxito - redireccionar automáticamente
        setTimeout(() => {
            window.location.href = 'armario.html';
        }, 1500);

    } catch (err) {
        console.error('Error en upload:', err);
        mostrarModal(err.message, 'error', 'Upload Failed');
        btnUpload.disabled = false;
        btnUpload.textContent = 'UPLOAD';
        return;
    }
});

// Inicializar
document.addEventListener('DOMContentLoaded', inicializar);
