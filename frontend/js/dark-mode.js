/* dark-mode.js — Bellaveste */

const STORAGE_KEY = 'bellaveste-dark-mode';

function aplicarTema(oscuro) {
    document.body.classList.toggle('dark-mode', oscuro);
    actualizarBotones(oscuro);
}

function actualizarBotones(oscuro) {
    const lang = localStorage.getItem('bellaveste-language') || 'en';
    const textDay = lang === 'es' ? 'MODO CLARO' : 'DAY MODE';
    const textDark = lang === 'es' ? 'MODO OSCURO' : 'DARK MODE';

    document.querySelectorAll('.dark-mode-btn').forEach(btn => {
        const icono = btn.querySelector('i');
        const texto = btn.querySelector('span');
        if (icono) icono.className = oscuro ? 'icon-sun' : 'icon-moon';
        
        if (texto) {
            texto.textContent = oscuro ? textDay : textDark;
        } else {
            // Para botones sin span (como en perfil.html)
            btn.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
                    node.textContent = oscuro ? textDay : textDark;
                }
            });
        }
    });
}

function toggleDarkMode() {
    const oscuro = !document.body.classList.contains('dark-mode');
    localStorage.setItem(STORAGE_KEY, oscuro ? '1' : '0');
    aplicarTema(oscuro);
}

// Aplicar al cargar según preferencia guardada
const guardado = localStorage.getItem(STORAGE_KEY);
const oscuroInicial = guardado === '1' ||
    (guardado === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
aplicarTema(oscuroInicial);

// Conectar botones cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.dark-mode-btn').forEach(btn => {
        btn.addEventListener('click', toggleDarkMode);
    });
    actualizarBotones(document.body.classList.contains('dark-mode'));
});

// Sincronizar entre pestañas
window.addEventListener('storage', e => {
    if (e.key === STORAGE_KEY) aplicarTema(e.newValue === '1');
});

// Actualizar texto cuando cambie el idioma
document.addEventListener('bellaveste:language-changed', () => {
    actualizarBotones(document.body.classList.contains('dark-mode'));
});
