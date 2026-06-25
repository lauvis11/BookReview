# 📚 BookReview

> Una plataforma moderna e interactiva para los amantes de la lectura. Descubre, califica, comenta y haz seguimiento de tus libros favoritos con el poder de un asistente de Inteligencia Artificial integrado.

![Licencia MIT](https://img.shields.io/badge/License-MIT-green.svg)
![React](https://img.shields.io/badge/React-19.0-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-Express-success.svg)

---

## 📖 Acerca del Proyecto

**BookReview** es mucho más que un catálogo de libros. Es una aplicación full-stack diseñada para ofrecer una experiencia inmersiva a los lectores. Permite a los usuarios llevar un registro detallado de sus hábitos de lectura, interactuar con una comunidad a través de reseñas y calificaciones, y obtener recomendaciones y análisis profundos de libros gracias a un asistente virtual potenciado por la IA de Google Gemini.

## Características Principales

*   🤖 **Asistente de Inteligencia Artificial:** Integración nativa con Google Generative AI (Gemini) para conversar sobre libros, pedir recomendaciones basadas en tus gustos, o solicitar resúmenes de obras.
*   🔒 **Autenticación Robusta:** Sistema de registro e inicio de sesión seguro protegido con JWT (JSON Web Tokens) y contraseñas encriptadas (Bcrypt).
*   📚 **Seguimiento Personalizado:**
    *   ❤️ Agrega libros a tu lista de favoritos.
    *   📊 Cambia el estado de lectura (ej. *Por leer, Leyendo, Completado*).
    *   ⭐ Califica y deja tus propias reseñas y comentarios.
*   👤 **Perfiles de Usuario:** Administra tu perfil, visualiza tu progreso y colecciones personales.
*   🛡️ **Seguridad y Rendimiento de API:** Backend protegido contra ataques de fuerza bruta usando limitación de peticiones (Rate Limiting) y cabeceras seguras con Helmet.

## 💻 Stack Tecnológico

El proyecto está dividido en dos partes principales y utiliza tecnologías modernas para garantizar escalabilidad y rendimiento:

### Frontend (Cliente)
*   **React 19:** Biblioteca principal para la interfaz de usuario.
*   **Vite:** Herramienta de compilación ultrarrápida.
*   **TailwindCSS 4:** Framework de CSS utilitario para un diseño moderno y responsivo.
*   **React Router DOM:** Manejo de rutas y navegación.
*   **Lucide React:** Iconografía elegante y consistente.

### Backend (Servidor)
*   **Node.js & Express:** Entorno de ejecución y framework web rápido y minimalista.
*   **MySQL2:** Base de datos relacional para persistencia de datos segura.
*   **Google Generative AI:** SDK para las funciones del asistente virtual.
*   **Seguridad:** `jsonwebtoken` (Auth), `bcrypt` (Hashing), `helmet` (Cabeceras HTTP), `express-rate-limit` (Prevención de abusos).

## 🚀 Instalación y Ejecución Local

Sigue estos pasos para levantar el proyecto en tu máquina local:

### 1. Clonar el repositorio
```bash
git clone https://tu-repositorio.git
cd BookReview
```

### 2. Configuración del Backend
```bash
cd Backend
npm install
```
*   Crea un archivo `.env` en la carpeta `Backend` con tus variables de entorno (Conexión a MySQL, Clave Secreta JWT, API Key de Google Gemini, etc.).
*   Inicia el servidor de desarrollo:
```bash
npm run dev:1
```

### 3. Configuración del Frontend
```bash
cd ../FrontEnd
npm install
```
*   Inicia la aplicación de React:
```bash
npm run dev
```

## 📡 Estructura de la API

La API RESTful está estructurada en las siguientes rutas principales (la documentacion de cada endpoint esta en el archivo api.http):
*   `/auth` - Autenticación y registro de usuarios.
*   `/books` - CRUD general de libros y valoraciones.
*   `/user` - Gestión de perfil de usuario.
*   `/ai` - Interacción con el asistente de inteligencia artificial.
*   `/status` - Gestión de los estados de lectura.
*   `/book` - Gestión de comentarios específicos.

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](https://choosealicense.com/licenses/mit/).
