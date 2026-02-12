# Upload Art Form Component

Componente modal reutilizable para subir obras de arte. Puede ser usado en múltiples páginas de la aplicación.

## Uso

### 1. Importar el componente

En el componente donde quieras usar el modal:

```typescript
import { UploadArtForm } from '@app/shared/components/upload-art-form/upload-art-form';
import { UploadArtModalService } from '@app/shared/services/upload-art-modal.service';

@Component({
  selector: 'app-mi-pagina',
  imports: [UploadArtForm, ...],
  templateUrl: './mi-pagina.html',
  standalone: true,
})
export class MiPagina {
  constructor(private uploadArtModalService: UploadArtModalService) {}
}
```

### 2. Agregar el componente al template

```html
<!-- En tu página, agrega el componente -->
<app-upload-art-form #uploadFormModal></app-upload-art-form>

<!-- Botón para abrir el modal -->
<button class="btn btn-primary" (click)="abrirModalSubir()">
  <i class="bi bi-plus"></i> Subir Obra
</button>
```

### 3. Agregar el método para abrir el modal

```typescript
export class MiPagina {
  @ViewChild('uploadFormModal') uploadFormModal!: UploadArtForm;

  constructor(private uploadArtModalService: UploadArtModalService) {}

  abrirModalSubir() {
    this.uploadFormModal.abrirModal();
  }
}
```

## Características

- ✅ Modal reutilizable en múltiples páginas
- ✅ Validación de formulario integrada
- ✅ Carga y vista previa de imágenes
- ✅ Selección múltiple de géneros (máximo 3)
- ✅ Integración con API de géneros
- ✅ Estado de carga mientras se sube
- ✅ Manejo automático de errores

## Servicio UploadArtModalService

Proporciona métodos para controlar el estado del modal:

```typescript
// Abrir modal
this.uploadArtModalService.abrirModal();

// Cerrar modal
this.uploadArtModalService.cerrarModal();

// Verificar si está abierto
const estaAbierto = this.uploadArtModalService.estaAbierto();

// Suscribirse a cambios
this.uploadArtModalService.mostrarModal$.subscribe(abierto => {
  console.log('Modal está abierto:', abierto);
});
```

## Validaciones

- **Título**: Obligatorio, 3-200 caracteres
- **Descripción**: Opcional, máximo 500 caracteres
- **Imagen**: Obligatoria, formatos jpg/jpeg/png/gif/webp/bmp, máximo 10MB
- **Géneros**: Obligatorio seleccionar al menos 1, máximo 3

## Endpoint API

- `GET /api/genres/` - Obtener lista de géneros
- `POST /api/artworks/create/` - Crear/subir obra (requiere autenticación Bearer)

## Notas

- Requiere token de autenticación en localStorage como `access_token`
- El usuario actual debe estar guardado en localStorage como `user` (JSON)
- Usa Bootstrap para estilos
- Compatible con Angular 18+
