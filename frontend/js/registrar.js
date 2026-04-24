import { mostrarModal } from './modal.js';

const API = 'https://ua-2026-production.up.railway.app';

const form         = document.querySelector('.formulario');
const inputNombre  = document.getElementById('nombre');
const inputUser    = document.getElementById('username');
const inputEmail   = document.getElementById('email');
const inputPass    = document.getElementById('contrasena');
const inputConfirm = document.getElementById('confirmar-contrasena');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

function validarFormularioRegistro() {
    const nombre = inputNombre.value.trim();
    const username = inputUser.value.trim();
    const email = inputEmail.value.trim();
    const password = inputPass.value;
    const confirm = inputConfirm.value;

    if (!nombre || !username || !email || !password || !confirm) {
        mostrarModal('Completa todos los campos obligatorios.', 'error', 'Campos incompletos');
        return false;
    }

    if (nombre.length < 2) {
        mostrarModal('El nombre debe tener al menos 2 caracteres.', 'error');
        return false;
    }

    if (!USER_REGEX.test(username)) {
        mostrarModal('El username debe tener 3-20 caracteres y solo letras, numeros o _.', 'error');
        return false;
    }

    if (!EMAIL_REGEX.test(email)) {
        mostrarModal('Introduce un email valido.', 'error');
        return false;
    }

    if (password.length < 6) {
        mostrarModal('La contrasena debe tener al menos 6 caracteres.', 'error');
        return false;
    }

    if (password !== confirm) {
        mostrarModal('Las contrasenas no coinciden.', 'error');
        return false;
    }

    return true;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

    if (!validarFormularioRegistro()) {
    return;
  }

  const boton = form.querySelector('button[type="submit"]');
  boton.textContent = 'REGISTERING...';
  boton.disabled    = true;

  try {
    const response = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:     inputNombre.value.trim(),
                username: inputUser.value.trim(),
        email:    inputEmail.value.trim(),
        password: inputPass.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || 'Error al registrar');

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    window.location.href = 'inicio-logueado.html';

  } catch (err) {
    mostrarModal(err.message, 'error', 'Error de registro');
    boton.textContent = 'REGISTER';
    boton.disabled    = false;
  }
});

/*
'use strict';

window.onload = function () {
    controlarAcceso();

    let usuario = sessionStorage.getItem('usuario') || localStorage.getItem('usuario');

    if (usuario) {
        window.location.href = "index.html";
    }

    document.getElementById("login").addEventListener("blur", comprobarLogin);
}

function comprobarLogin() {
    let login = document.getElementById("login").value;

    if (!login) {
        return;
    }

    let xhr = new XMLHttpRequest();

    xhr.open("GET", "api/usuarios/" + login, true);
    xhr.responseType = 'json';

    xhr.onload = function () {
        let res = xhr.response;

        if (!res.DISPONIBLE) {
            alert("Usuario no disponible");
        }
    }

    xhr.send();

}

function mensajeModal(titulo, texto, callbackOk, callbackCancel) {
    let dialogo = document.createElement('dialog'),
        html;

    html = '<h2>' + titulo + '</h2>';
    html += `<p>${texto}</p>`;
    html += '<footer>';
    html += '<button id="btn1">Aceptar</button>';
    if (callbackCancel) {
        html += '<button id="btn2">Cancelar</button>';
    }
    html += '</footer>';

    dialogo.innerHTML = html;
    document.body.appendChild(dialogo);

    dialogo.querySelector('#btn1').addEventListener('click', function (evt) {
        dialogo.close();
        dialogo.remove();
        if (callbackOk) {
            callbackOk();
        }
    });
    if (callbackCancel) {
        dialogo.querySelector('#btn2').addEventListener('click', function (evt) {
            dialogo.close();
            dialogo.remove();
            callbackCancel();
        });
    }


    dialogo.showModal();
}

function hacerRegistro(evt) {
    evt.preventDefault(); // cancela la acción por defecto asociada al evento

    let pwd = document.getElementById("pwd").value;
    let pwd2 = document.getElementById("pwd2").value;

    if (pwd !== pwd2) {
        alert("Las contraseñas no coinciden");
        return;
    }

    let url = 'api/usuarios/registrar',
        frm = evt.target, //Objeto que dispara el evento
        xhr = new XMLHttpRequest(),
        fd = new FormData(frm);

    xhr.open('POST', url, true);
    xhr.responseType = "json";

    xhr.onload = function () {
        let res = xhr.response;
        console.log(res);
        if (res && res.RESULTADO == 'OK') {
            // localStorage['pcw_usu'] = JSON.stringify( res ); //NO TIENE QUE GUARDAR NADA EL REGISTRAR
            controlarAcceso();

            mensajeModal('Hacer registro', 'YOU HAVE BEEN REGISTERED SUCCESSFULLY', function () {
                console.log('LOGIN');
                window.location.href = './login.html';
            }, function () {
                console.log('CLOSE');
                dialogo.close();
                dialogo.remove();
            });
        }
    }

    xhr.send(fd);

}

function verContraseña(btn) {
    let input = btn.parentElement.querySelector('input');

    if (input.type === 'password') {
        input.type = 'text';
    } else {
        input.type = 'password';
    }
}


*/
