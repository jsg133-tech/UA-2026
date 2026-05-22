/* high-contrast.js — Bellaveste */
import { t } from './i18n-global.js';

const HC_KEY = 'bellaveste-high-contrast';

function aplicarAltoContraste(activo) {
    document.documentElement.classList.toggle('high-contrast', activo);
    document.body.classList.toggle('high-contrast', activo);
    actualizarBotones(activo);
}

function actualizarBotones(activo) {
    document.querySelectorAll('.high-contrast-btn').forEach(btn => {
        const icono = btn.querySelector('i');
        const texto = btn.querySelector('span');
        if (icono) icono.className = activo ? 'icon-eye' : 'icon-eye-off';
        if (texto) {
            texto.textContent = activo ? t('normalMode') : t('highContrast');
        }
    });
}

function toggleAltoContraste() {
    const activo = !document.body.classList.contains('high-contrast');
    localStorage.setItem(HC_KEY, activo ? '1' : '0');
    aplicarAltoContraste(activo);
}

// Aplicar al cargar
const guardado = localStorage.getItem(HC_KEY);
if (guardado === '1') aplicarAltoContraste(true);

// Conectar botones cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.high-contrast-btn').forEach(btn => {
        btn.addEventListener('click', toggleAltoContraste);
    });
    actualizarBotones(document.body.classList.contains('high-contrast'));
});

// Sincronizar entre pestañas
window.addEventListener('storage', e => {
    if (e.key === HC_KEY) aplicarAltoContraste(e.newValue === '1');
});
