# Bellaveste Spain — Wardrobe Manager App

Aplicación de armario personal de moda, orientada a móviles. Permite registrarse, iniciar sesión y gestionar outfits con foto, talla, color y temporada, organizados por categorías.

> 🌐 **API pública desplegada en Railway:**
> **`https://ua-2026-production.up.railway.app`**
> Funciona para todos los compañeros sin necesidad de correr nada localmente.

---

## 🗂️ Estructura del proyecto

```
bellaveste/
├── backend/          ← API REST (Node.js + Express + MongoDB)
│   ├── server.js
│   ├── seed.js       ← Datos iniciales (ejecutar una vez)
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── uploads/
└── frontend/         ← App móvil (HTML + CSS + JS puro)
```

---

## ⚙️ Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- Cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas) (cloud gratuito)
- [MongoDB Compass](https://www.mongodb.com/products/compass) *(opcional, para visualizar la base de datos)*

---

## 🚀 Instalación y puesta en marcha

### 1. Clonar el repositorio

```bash
git clone https://github.com/jsg133-tech/UA-2026.git
cd UA-2026/bellaveste/backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` dentro de `bellaveste/backend/` con el siguiente contenido:

```env
PORT=3000
MONGO_URI=mongodb+srv://<usuario>:<contraseña>@bellaveste.gkyehhv.mongodb.net/bellaveste?retryWrites=true&w=majority&appName=BELLAVESTE
JWT_SECRET=bellaveste_secret_key_2024
```

> ⚠️ **Pide la contraseña del cluster a Juan (jsg133).** El archivo `.env` no está en el repo por seguridad.

### 4. Arrancar el servidor

```bash
node server.js
```

Deberías ver:
```
✅ MongoDB connected
🚀 Server running on http://localhost:3000
```

### 5. (Opcional) Cargar datos de ejemplo

Solo es necesario ejecutarlo **una vez**. Crea un usuario demo con outfits de muestra:

```bash
node seed.js
```

Credenciales del usuario demo:
- **Email:** `demo@bellaveste.com`
- **Contraseña:** `bellaveste2024`

---

## 🧭 Conectar MongoDB Compass al cluster

MongoDB Compass te permite ver y editar la base de datos visualmente.

### Pasos:

1. **Descarga e instala** [MongoDB Compass](https://www.mongodb.com/products/compass)

2. Abre Compass y haz clic en **"New Connection"**

3. En el campo de conexión, pega la URI del cluster (pídela a Juan):
   ```
   mongodb+srv://<usuario>:<contraseña>@bellaveste.gkyehhv.mongodb.net/
   ```

4. Haz clic en **"Connect"**

5. Verás la base de datos **`bellaveste`** con las colecciones:
   - `users` — Usuarios registrados
   - `categories` — Categorías de armario
   - `outfits` — Outfits con sus datos

> 💡 **Tip:** En Compass puedes explorar, editar y borrar documentos sin escribir código.

---

## 📡 Endpoints de la API

Base URL: `https://ua-2026-production.up.railway.app`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/register` | ❌ | Registro de usuario |
| POST | `/api/auth/login` | ❌ | Login, devuelve JWT |
| GET | `/api/auth/me` | ✅ | Info del usuario actual |
| GET | `/api/outfits` | ✅ | Todos los outfits del usuario |
| GET | `/api/outfits?category=ELEGANT` | ✅ | Outfits filtrados |
| POST | `/api/outfits` | ✅ | Crear outfit (con imagen) |
| PUT | `/api/outfits/:id` | ✅ | Editar outfit |
| DELETE | `/api/outfits/:id` | ✅ | Eliminar outfit |
| GET | `/api/categories` | ✅ | Categorías del usuario |
| POST | `/api/categories` | ✅ | Crear categoría |
| DELETE | `/api/categories/:id` | ✅ | Eliminar categoría |

> Las rutas con ✅ requieren el header: `Authorization: Bearer <token>`

---

## 🎨 Stack tecnológico

- **Backend:** Node.js · Express · Mongoose
- **Base de datos:** MongoDB Atlas
- **Auth:** JWT + bcryptjs
- **Upload de imágenes:** Multer
- **Frontend:** HTML · CSS · JavaScript puro (mobile-first)
