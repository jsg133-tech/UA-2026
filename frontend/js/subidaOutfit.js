// Control de subida de outfit - SUBIDAOUTFIT.JS

import { mostrarModal, mostrarConfirm } from './modal.js';
import { inicializarBarraUsuario } from './barra-usuario.js';
import { getToken } from './auth-storage.js';

const API = 'https://ua-2026.onrender.com';
const LANG_STORAGE_KEY = 'bellaveste-language';

function idiomaActual() {
    return localStorage.getItem(LANG_STORAGE_KEY) === 'es' ? 'es' : 'en';
}

function tUpload(clave) {
    const textos = {
        en: {
            discardChanges: 'Discard changes?',
            enterName: 'Please enter an outfit name.',
            selectPicture: 'Please select an outfit picture.',
            addPiece: 'Please add at least one piece to the outfit.',
            eachPieceName: 'Each piece needs a name.',
            piecePhotoPrefix: 'Please upload a photo for',
            notAuthenticated: 'You are not authenticated. Please log in.',
            uploaded: 'Outfit uploaded successfully!',
            uploadFailed: 'Upload Failed',
            uploading: 'UPLOADING...',
            upload: 'UPLOAD',
            selectSeason: 'Select',
            clickUpload: 'Click to upload',
            piece: 'Piece',
            brand: 'Brand',
            link: 'Link',
            size: 'Size',
            color: 'Color',
            season: 'Season',
            description: 'Description',
            piecePhoto: 'Piece Photo',
            deletePiece: 'Delete piece',
            pieceNamePlaceholder: 'e.g., T-shirt',
            descriptionPlaceholder: 'Describe this piece...',
        },
        es: {
            discardChanges: 'Descartar cambios?',
            enterName: 'Por favor introduce el nombre del outfit.',
            selectPicture: 'Por favor selecciona una foto del outfit.',
            addPiece: 'Agrega al menos una prenda al outfit.',
            eachPieceName: 'Cada prenda necesita un nombre.',
            piecePhotoPrefix: 'Sube una foto para',
            notAuthenticated: 'No estas autenticado. Inicia sesion.',
            uploaded: 'Outfit subido correctamente!',
            uploadFailed: 'Error al subir',
            uploading: 'SUBIENDO...',
            upload: 'SUBIR',
            selectSeason: 'Seleccionar',
            clickUpload: 'Haz clic para subir',
            piece: 'Prenda',
            brand: 'Marca',
            link: 'Enlace',
            size: 'Talla',
            color: 'Color',
            season: 'Temporada',
            description: 'Descripcion',
            piecePhoto: 'Foto de prenda',
            deletePiece: 'Eliminar prenda',
            pieceNamePlaceholder: 'ej. Camiseta',
            descriptionPlaceholder: 'Describe esta prenda...',
        },
    };

    return textos[idiomaActual()][clave] || textos.en[clave] || '';
}

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
const inputNombre    = document.getElementById('outfit-name');
const inputCategory  = document.getElementById('outfit-category');
const inputSeason    = document.getElementById('outfit-season');
const inputColor     = document.getElementById('outfit-color');
const inputFoto      = document.getElementById('outfit-picture');
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
                    <label class="label-mini">${tUpload('piece')}</label>
                    <input type="text" class="input-prenda input-nombre" placeholder="${tUpload('pieceNamePlaceholder')}" required>
                </div>
                <div class="campo-prenda">
                    <label class="label-mini">${tUpload('brand')}</label>
                    <input type="text" class="input-prenda input-marca" placeholder="${tUpload('brand')}">
                </div>
                <div class="campo-prenda">
                    <label class="label-mini">${tUpload('link')}</label>
                    <input type="url" class="input-prenda input-link" placeholder="${tUpload('link')}">
                </div>
                <div class="campo-prenda">
                    <label class="label-mini">${tUpload('size')}</label>
                    <input type="text" class="input-prenda input-size" placeholder="${tUpload('size')}">
                </div>
                <div class="campo-prenda">
                    <label class="label-mini">${tUpload('color')}</label>
                    <input type="color" class="input-prenda input-color" value="#5a0d16">
                </div>
                <div class="campo-prenda">
                    <label class="label-mini">${tUpload('season')}</label>
                    <select class="input-prenda input-season">
                        <option value="">${tUpload('selectSeason')}</option>
                        <option value="spring">Spring</option>
                        <option value="summer">Summer</option>
                        <option value="autumn">Autumn</option>
                        <option value="winter">Winter</option>
                    </select>
                </div>
            </div>
            <button type="button" class="boton-eliminar-prenda" title="${tUpload('deletePiece')}">
                <i class="icon-trash"></i>
            </button>
        </div>
        <div class="campo-prenda campo-descripcion">
            <label class="label-mini">${tUpload('description')}</label>
            <textarea class="input-prenda input-descripcion" placeholder="${tUpload('descriptionPlaceholder')}" rows="2"></textarea>
        </div>
        <div class="prenda-foto-section">
            <label for="prenda-picture-${contadorPrendas}" class="etiqueta-foto-prenda">
                <i class="icon-picture"></i> ${tUpload('piecePhoto')}
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
        previewPrenda.innerHTML = `<i class="icon-picture"></i> ${tUpload('clickUpload')}`;
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
    mostrarConfirm(
        'Your changes will be lost.',
        () => { window.location.href = 'inicio-logueado.html'; },
        'Discard changes?',
        'DISCARD'
    );
});

// Enviar formulario
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!inputNombre.value.trim()) {
        mostrarModal(tUpload('enterName'), 'error');
        return;
    }
    if (!inputFoto.files.length) {
        mostrarModal(tUpload('selectPicture'), 'error');
        return;
    }

    // Leer prendas directamente del DOM en el momento de enviar
    const items = listaPrendas.querySelectorAll('.item-prenda');
    if (!items.length) {
        mostrarModal(tUpload('addPiece'), 'error');
        return;
    }

    const prendasDOM = [];
    for (const item of items) {
        const nombre = item.querySelector('.input-nombre')?.value.trim();
        const fotoInput = item.querySelector('.input-archivo-prenda');
        if (!nombre) {
            mostrarModal(tUpload('eachPieceName'), 'error');
            return;
        }
        if (!fotoInput?.files.length) {
            mostrarModal(`${tUpload('piecePhotoPrefix')} "${nombre}".`, 'error');
            return;
        }
        prendasDOM.push({
            nombre,
            marca:       item.querySelector('.input-marca')?.value.trim()      || '',
            link:        item.querySelector('.input-link')?.value.trim()       || '',
            size:        item.querySelector('.input-size')?.value.trim()       || '',
            color:       item.querySelector('.input-color')?.value             || '',
            season:      item.querySelector('.input-season')?.value            || '',
            descripcion: item.querySelector('.input-descripcion')?.value.trim()|| '',
            foto:        fotoInput.files[0],
        });
    }

    btnUpload.disabled = true;
    btnUpload.textContent = tUpload('uploading');

    try {
        const token = getToken();
        if (!token) throw new Error(tUpload('notAuthenticated'));

        const formData = new FormData();
        formData.append('name',     inputNombre.value.trim());
        formData.append('category', inputCategory.value || 'CASUAL');
        formData.append('season',   inputSeason.value   || '');
        formData.append('color',    inputColor.value     || '');
        formData.append('image',    await toJpeg(inputFoto.files[0]));

        for (let i = 0; i < prendasDOM.length; i++) {
            formData.append(`piece-image-${i}`, await toJpeg(prendasDOM[i].foto));
        }

        const piezasSinFoto = prendasDOM.map(({ foto, ...p }) => p);
        formData.append('pieces', JSON.stringify(piezasSinFoto));
        
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
        mostrarModal(tUpload('uploaded'), 'success', 'Success');
        
        // Éxito - redireccionar automáticamente
        setTimeout(() => {
            window.location.href = 'subidos.html';
        }, 1500);

    } catch (err) {
        console.error('Error en upload:', err);
        mostrarModal(err.message, 'error', tUpload('uploadFailed'));
        btnUpload.disabled = false;
        btnUpload.textContent = tUpload('upload');
        return;
    }
});

// Inicializar
document.addEventListener('DOMContentLoaded', inicializar);
