/**
 * modal.js — Componente modal reutilizable Bellaveste
 *
 * Uso:
 *   import { mostrarModal } from './modal.js';
 *   mostrarModal('Contrasena incorrecta', 'error');
 *   mostrarModal('Registro exitoso', 'success');
 */

// ── mostrarModal ─────────────────────────────────────────────────────────────
/**
 * @param {string} mensaje   - Texto a mostrar en el modal
 * @param {'error'|'success'} [tipo='error'] - Variante visual
 * @param {string} [titulo]  - Título opcional (por defecto según tipo)
 * @param {{ textoBoton?: string, alConfirmar?: () => void }} [opciones] - Opciones del modal
 */
export function mostrarModal(mensaje, tipo = 'error', titulo = '', opciones = {}) {
  // Título por defecto según tipo
  if (!titulo) {
    titulo = tipo === 'success' ? 'Listo' : 'Atención';
  }

  const textoBoton = opciones.textoBoton || 'ACEPTAR';
  const alConfirmar = typeof opciones.alConfirmar === 'function' ? opciones.alConfirmar : null;
  const icono = tipo === 'success' ? '✓' : '✕';

  // Crear overlay
  const overlay = document.createElement('div');
  overlay.className = 'bv-modal-overlay';

  overlay.innerHTML = `
    <div class="bv-modal bv-modal--${tipo}" role="dialog" aria-modal="true" aria-labelledby="bv-modal-title">
      <div class="bv-modal-icon">${icono}</div>
      <p class="bv-modal-title" id="bv-modal-title">${titulo}</p>
      <p class="bv-modal-msg">${mensaje}</p>
      <button class="bv-modal-btn" id="bv-modal-close">${textoBoton}</button>
    </div>
  `;

  document.body.appendChild(overlay);

  let estaCerrado = false;
  const limpiarEventos = () => {
    document.removeEventListener('keydown', onKey);
  };

  // Cerrar al hacer clic en el botón o fuera del modal
  const cerrar = () => {
    if (estaCerrado) return;
    estaCerrado = true;
    limpiarEventos();
    overlay.style.animation = 'bvFadeIn .15s ease reverse';
    setTimeout(() => overlay.remove(), 140);
  };

  const botonCerrar = overlay.querySelector('#bv-modal-close');
  botonCerrar.addEventListener('click', () => {
    if (alConfirmar) alConfirmar();
    cerrar();
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) cerrar(); });

  // Cerrar con Escape
  const onKey = (e) => { if (e.key === 'Escape') cerrar(); };
  document.addEventListener('keydown', onKey);
}
