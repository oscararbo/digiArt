# DigiArt Backend

Backend Django RESTful para la plataforma de compartición de obras de arte digitales DigiArt. Sistema completo de autenticación, gestión de obras, géneros y sistema de likes.

## Características Implementadas

- ✅ Autenticación por email con validación de dominio
- ✅ Registro de usuarios con username único
- ✅ Login con tokens JWT (acceso 60min, refresh 1 día)
- ✅ Sistema de carga de obras de arte con validación de imagen
- ✅ Categorización de obras por géneros (M2M, máx 3 por obra)
- ✅ Sistema de likes con seguimiento por fecha
- ✅ Endpoints de obras destacadas (por likes últimos 7 días)
- ✅ Endpoints de obras recientes
- ✅ Filtrado de obras por género
- ✅ CORS habilitado para desarrollo con Angular
- ✅ Admin panel integrado de Django

## Instalación y Setup

### 1. Crear entorno virtual

```bash
python -m venv venv
venv\Scripts\activate  # En Windows
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Realizar migraciones

```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Crear superusuario

```bash
python manage.py createsuperuser
```

### 5. Cargar datos iniciales (géneros)

```bash
python manage.py shell
```

Dentro del shell:

```python
from Artworks.models import Genre

genres = [
    'Pintura', 'Fotografía', 'Escultura', 'Ilustración',
    'Diseño Gráfico', 'Arte Digital', 'Grabado', 'Cerámica',
    'Danza', 'Música', 'Poesía', 'Literatura',
    'Cine', 'Teatro', 'Arquitectura', 'Moda'
]

for genre_name in genres:
    Genre.objects.get_or_create(
        nombre=genre_name,
        defaults={'descripcion': f'Obras de {genre_name}'}
    )

exit()
```

### 6. Ejecutar servidor

```bash
python manage.py runserver
```

El servidor estará disponible en `http://localhost:8000/`

## Endpoints Disponibles

### Autenticación (Users App)

#### Login
```
POST /api/auth/login/
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "MiPassword123"
}

Response 200:
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "username": "usuario",
    "nombre": "Juan",
    "apellidos": "Pérez"
  }
}
```

#### Registro
```
POST /api/auth/register/
Content-Type: application/json

{
  "email": "nuevo@example.com",
  "username": "nuevo_usuario",
  "password": "MiPassword123",
  "password_repeat": "MiPassword123",
  "nombre": "Juan",
  "apellidos": "Pérez"
}

Response 201:
{
  "success": true,
  "message": "Registro exitoso. Puedes iniciar sesión ahora.",
  "user": {
    "id": 1,
    "email": "nuevo@example.com",
    "username": "nuevo_usuario"
  }
}
```

#### Verificar disponibilidad de username
```
GET /api/auth/check-username/?username=nuevo_usuario

Response 200:
{
  "available": true
}
```

#### Verificar disponibilidad de email
```
GET /api/auth/check-email/?email=nuevo@example.com

Response 200:
{
  "available": true
}
```

### Géneros (Artworks App)

#### Buscar/Listar géneros
```
GET /api/genres/?search=pintura
Authorization: Bearer {access_token}

Response 200:
{
  "count": 16,
  "results": [
    {
      "id": 1,
      "nombre": "Pintura",
      "descripcion": "Obras de Pintura",
      "fecha_creacion": "2026-02-13T10:00:00Z"
    }
  ]
}
```

### Obras de Arte (Artworks App)

#### Crear obra (autenticado)
```
POST /api/artworks/create/
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

{
  "titulo": "Mi primera obra",
  "descripcion": "Una descripción interesante",
  "generos": [1, 2, 3],
  "imagen": <archivo.jpg>
}

Response 201:
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "titulo": "Mi primera obra",
  "descripcion": "Una descripción interesante",
  "autor": {
    "id": 1,
    "email": "usuario@example.com",
    "username": "usuario"
  },
  "generos": [
    {"id": 1, "nombre": "Pintura"},
    {"id": 2, "nombre": "Fotografía"}
  ],
  "imageUrl": "http://localhost:8000/media/artworks/image.jpg",
  "vistas": 0,
  "likes": 0,
  "fecha_creacion": "2026-02-13T10:00:00Z"
}
```

#### Listar todas las obras
```
GET /api/artworks/?user=usuario
Authorization: Bearer {access_token}

Response 200:
{
  "count": 10,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "titulo": "Mi primera obra",
      "autor": {"username": "usuario"},
      "imageUrl": "http://localhost:8000/media/artworks/image.jpg",
      "likes": 5,
      "vistas": 120
    }
  ]
}
```

#### Obtener detalle de obra
```
GET /api/artworks/{id}/
Authorization: Bearer {access_token}

Response 200:
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "titulo": "Mi primera obra",
  "descripcion": "Una descripción interesante",
  "autor": {"username": "usuario"},
  "generos": [{"id": 1, "nombre": "Pintura"}],
  "imageUrl": "http://localhost:8000/media/artworks/image.jpg",
  "vistas": 120,
  "likes": 5,
  "fecha_creacion": "2026-02-13T10:00:00Z"
}
```

#### Obras destacadas (últimos 7 días)
```
GET /api/artworks/featured/?limit=10
Authorization: Bearer {access_token}

Response 200: Lista de obras ordenadas por likes en últimos 7 días
```

#### Obras recientes
```
GET /api/artworks/recent/?limit=10
Authorization: Bearer {access_token}

Response 200: Lista de obras más recientes
```

#### Obras por género
```
GET /api/artworks/genre/{genre_id}/?limit=10
Authorization: Bearer {access_token}

Response 200: Lista de obras del género especificado
```

#### Eliminar obra (solo autor)
```
DELETE /api/artworks/{id}/delete/
Authorization: Bearer {access_token}

Response 204: Obra eliminada
```

### Sistema de Likes

#### Toggle Like/Unlike
```
POST /api/artworks/{id}/like/
Authorization: Bearer {access_token}

Response 200:
{
  "liked": true,
  "likes": 10
}
```

#### Verificar si está likeada
```
GET /api/artworks/{id}/check-like/
Authorization: Bearer {access_token}

Response 200:
{
  "liked": true,
  "likes": 10
}
```

#### Obtener contador de likes
```
GET /api/artworks/{id}/likes/
Authorization: Bearer {access_token}

Response 200:
{
  "likes": 10
}
```

## Validaciones

### Usuario
- Email: válido y único, dominios bloqueados (.ru, .xyz, .io)
- Username: único, solo alfanuméricos, guiones y guiones bajos
- Contraseña: mínimo 6 caracteres con al menos un dígito

### Obra de Arte
- Título: 3-200 caracteres
- Imagen: máx 10MB, formatos permitidos (jpg, jpeg, png, gif, webp, bmp)
- Géneros: máximo 3 por obra

## Estructura del Proyecto

```
Back/
├── manage.py
├── requirements.txt
├── db.sqlite3
├── Tienda/
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── Users/
│   ├── models/
│   │   └── users_model.py (CustomUser with email auth)
│   ├── views/
│   │   ├── login_view.py
│   │   ├── register_view.py
│   │   └── users_view.py
│   ├── serializers/
│   │   ├── login_serializer.py
│   │   └── register_serializer.py
│   └── admin/
│       └── users_admin.py
└── Artworks/
    ├── models/
    │   ├── artwork_model.py (UUID PK, M2M genres)
    │   ├── genre_model.py
    │   └── like_model.py
    ├── views/
    │   ├── artwork_view.py (CRUD + Featured + Recent + ByGenre)
    │   └── like_view.py (Toggle + Check + Count)
    ├── serializers/
    │   └── artwork_serializer.py (with imageUrl)
    └── admin/
        ├── artwork_admin.py
        ├── genre_admin.py
        └── like_admin.py
```

## Variables de Configuración (.env)

```
SECRET_KEY=tu_clave_secreta_super_segura_aqui_2024
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:4200
```

## Panel de Administración

Acceder a: `http://localhost:8000/admin/`

- Gestionar usuarios
- Crear/editar géneros
- Moderar obras de arte
- Ver estadísticas de likes

## Notas Importantes

- El modelo de usuario personalizado utiliza email como USERNAME_FIELD
- Se utiliza JWT (JSON Web Tokens) para autenticación
- CORS está habilitado para desarrollo (cambiar en producción)
- Las imágenes se almacenan en `/assets/media/artworks/`
- Todos los endpoints protegidos requieren token JWT en header: `Authorization: Bearer {token}`

## Próximas Mejoras

- [ ] Refresh token endpoint
- [ ] Endpoint para obtener perfil del usuario actual
- [ ] Sistema de comentarios en obras
- [ ] Sistema de seguimiento de artistas
- [ ] Feed personalizado
- [ ] Notificaciones en tiempo real
- [ ] Búsqueda full-text
- [ ] Filtros avanzados de búsqueda
