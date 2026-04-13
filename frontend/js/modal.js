/**
 * modal.js — Componente modal reutilizable Bellaveste
 *
 * Uso:
 *   import { showModal } from './modal.js';
 *   showModal('Contraseña incorrecta', 'error');
 *   showModal('Registro exitoso', 'success');
 */

// ── Inyectar estilos del modal una sola vez ──────────────────────────────────
(function injectStyles() {
  if (document.getElementById('bellaveste-modal-styles')) return;
  const style = document.createElement('style');
  style.id = 'bellaveste-modal-styles';
  style.textContent = `
    /* Overlay */
    .bv-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(61, 10, 17, 0.45);
      backdrop-filter: blur(3px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: bvFadeIn .18s ease;
    }

    /* Caja */
    .bv-modal {
      background: #f4ece4;
      border-radius: 12px;
      padding: 36px 32px 28px;
      max-width: 340px;
      width: 90%;
      text-align: center;
      box-shadow: 0 8px 32px rgba(61,10,17,0.25);
      position: relative;
      animation: bvSlideUp .2s ease;
    }

    /* Icono */
    .bv-modal-icon {
      font-size: 2rem;
      margin-bottom: 12px;
    }

    /* Título */
    .bv-modal-title {
      font-family: "Cinzel", serif;
      font-size: 1rem;
      letter-spacing: 2px;
      color: #5a0d16;
      margin-bottom: 10px;
      text-transform: uppercase;
    }

    /* Mensaje */
    .bv-modal-msg {
      font-family: "Cormorant Garamond", serif;
      font-size: 1rem;
      color: #6f4a52;
      line-height: 1.5;
      margin-bottom: 24px;
    }

    /* Botón */
    .bv-modal-btn {
      background: #5a0d16;
      color: #f4ece4;
      border: none;
      border-radius: 6px;
      padding: 10px 32px;
      font-family: "Cinzel", serif;
      font-size: 0.8rem;
      letter-spacing: 2px;
      cursor: pointer;
      transition: background .2s;
    }
    .bv-modal-btn:hover { background: #3d0a11; }

    /* Variante error: borde rojo vino */
    .bv-modal--error { border-top: 4px solid #5a0d16; }

    /* Variante success: borde dorado */
    .bv-modal--success { border-top: 4px solid #c9b2a3; }

    /* Animaciones */
    @keyframes bvFadeIn  { from { opacity: 0 } to { opacity: 1 } }
    @keyframes bvSlideUp { from { transform: translateY(20px); opacity:0 } to { transform: translateY(0); opacity:1 } }
  `;
  document.head.appendChild(style);
})();

// ── showModal ────────────────────────────────────────────────────────────────
/**
 * @param {string} mensaje   - Texto a mostrar en el modal
 * @param {'error'|'success'} [tipo='error'] - Variante visual
 * @param {string} [titulo]  - Título opcional (por defecto según tipo)
 */
export function showModal(mensaje, tipo = 'error', titulo = '') {
  // Título por defecto según tipo
  if (!titulo) {
    titulo = tipo === 'success' ? 'Listo' : 'Atención';
  }

  const icono = tipo === 'success' ? '✓' : '✕';

  // Crear overlay
  const overlay = document.createElement('div');
  overlay.className = 'bv-modal-overlay';

  overlay.innerHTML = `
    <div class="bv-modal bv-modal--${tipo}" role="dialog" aria-modal="true" aria-labelledby="bv-modal-title">
      <div class="bv-modal-icon">${icono}</div>
      <p class="bv-modal-title" id="bv-modal-title">${titulo}</p>
      <p class="bv-modal-msg">${mensaje}</p>
      <button class="bv-modal-btn" id="bv-modal-close">ACEPTAR</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Cerrar al hacer clic en el botón o fuera del modal
  const cerrar = () => {
    overlay.style.animation = 'bvFadeIn .15s ease reverse';
    setTimeout(() => overlay.remove(), 140);
  };

  overlay.querySelector('#bv-modal-close').addEventListener('click', cerrar);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) cerrar(); });

  // Cerrar con Escape
  const onKey = (e) => { if (e.key === 'Escape') { cerrar(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
}
