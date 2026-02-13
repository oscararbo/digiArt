# DigiArt Frontend

Frontend Angular 20 para la plataforma de compartición de obras de arte digitales DigiArt. Interfaz moderna y responsiva con búsqueda avanzada, sistema de likes interactivo y carga de obras.

## Características Implementadas

- ✅ Autenticación por email con login/registro
- ✅ Validación de username en tiempo real
- ✅ Página de inicio con secciones deslizables (destacadas, recientes, por género)
- ✅ Modal expandible mostrando 30 obras en grid 3 columnas
- ✅ Búsqueda avanzada con filtros por género
- ✅ Ordenamiento por reciente/populares
- ✅ Sistema de likes interactivo con contador actualizado
- ✅ Botón flotante "+" animado para subir obras
- ✅ Formulario de carga con validación de imagen
- ✅ Selección de géneros (máx 3) con búsqueda
- ✅ Previsualización de imagen antes de subir
- ✅ Autenticación con JWT tokens en localStorage
- ✅ Diseño responsivo con Bootstrap 5

## Instalación y Setup

### 1. Instalar dependencias

```bash
cd Front
npm install
```

### 2. Ejecutar servidor de desarrollo

```bash
ng serve
```

La aplicación estará disponible en `http://localhost:4200/`

## Estructura del Proyecto

```
Front/
├── src/
│   ├── index.html
│   ├── main.ts
│   ├── styles.scss
│   ├── app/
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   ├── app.ts
│   │   ├── constants/
│   │   ├── core/
│   │   ├── features/
│   │   │   └── home/
│   │   │       ├── home.ts
│   │   │       ├── home.html
│   │   │       └── home.scss
│   │   ├── layouts/
│   │   └── shared/
│   │       ├── components/
│   │       │   ├── art-card/
│   │       │   ├── upload-art-form/
│   │       │   └── upload-button/
│   │       └── services/
│   │           └── upload-modal.service.ts
│   └── assets/
│       └── images/
├── public/
├── angular.json
├── package.json
└── tsconfig.json
```

## Componentes Principales

### Home Component

Página principal que muestra:
- **Barra de búsqueda:** Búsqueda en tiempo real de obras
- **Filtros de género:** Tags seleccionables para filtrar por categoría
- **Opciones de ordenamiento:** Ordenar por reciente o populares
- **Secciones deslizables:** Obras destacadas, recientes y por género
- **Grid modal:** Al hacer clic en "Ver más", muestra 30 obras en grid 3 columnas
- **Sistema de likes:** Junto a cada obra, botón para dar/quitar like con contador

### Upload Button Component

Botón circular flotante en esquina inferior derecha:
- **Reposo:** Círculo de 60px con ícono "+"
- **Al pasar el mouse:** Se expande hacia la izquierda con "Subir obra"
- **Al hacer clic:** Abre modal de carga
- **Animación:** Suave expansion con transición CSS

### Upload Art Form Component

Modal para cargar una nueva obra:
- **Título:** 3-200 caracteres
- **Descripción:** TextArea
- **Géneros:** Búsqueda y selección (máx 3)
- **Imagen:** Carga con previsualización
- **Validación:** En cliente y servidor

### Upload Modal Service

Servicio de estado global para controlar visibilidad del modal usando RxJS BehaviorSubject.

## Autenticación

Usa JWT tokens almacenados en localStorage:
- Token se envía en header `Authorization: Bearer {token}`
- Incluye login y registro
- Validación de email y username

## Validaciones

### Cliente
- Email: formato válido
- Username: alfanuméricos, guiones y guiones bajos
- Contraseña: mínimo 6 caracteres con dígito
- Imagen: validación de extensión y tamaño
- Título: 3-200 caracteres
- Géneros: máximo 3 seleccionables

### Servidor
Todas las validaciones se repiten en el backend.

## Scripts npm

```bash
npm start      # Ejecutar servidor de desarrollo
npm run build  # Compilar para producción
npm test       # Ejecutar tests unitarios
npm run lint   # Ejecutar linter
```

## Configuración Angular

- **Versión:** Angular 20.3.13
- **Componentes:** Standalone
- **Forms:** Reactive Forms
- **HTTP:** Fetch API
- **Estado:** RxJS Observables
- **Estilos:** SCSS + Bootstrap 5

## Próximas Mejoras

- [ ] Página de detalle de obra con comentarios
- [ ] Perfil de usuario con galería
- [ ] Sistema de comentarios y respuestas
- [ ] Sistema de seguimiento de artistas
- [ ] Feed personalizado
- [ ] Notificaciones en tiempo real
- [ ] Compartir en redes sociales
- [ ] Búsqueda full-text avanzada
- [ ] Modo oscuro
- [ ] Internacionalización (i18n)
