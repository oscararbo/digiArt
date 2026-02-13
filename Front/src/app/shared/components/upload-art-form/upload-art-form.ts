import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UploadModalService } from '../../services/upload-modal.service';
import { Subscription } from 'rxjs';

interface Genre {
    id: number;
    nombre: string;
    descripcion: string;
}

interface User {
    id: number;
    email: string;
    username: string;
    nombre: string;
    apellidos: string;
}

@Component({
    selector: 'app-upload-art-form',
    imports: [ReactiveFormsModule, CommonModule, FormsModule],
    templateUrl: './upload-art-form.html',
    styleUrl: './upload-art-form.scss',
    standalone: true,
})
export class UploadArtForm implements OnInit, OnDestroy {
    uploadForm: FormGroup;
    cargando: boolean = false;
    mostrarErrores: boolean = false;
    mostrarModal: boolean = false;
    
    generosDisponibles: Genre[] = [];
    generosFiltrados: Genre[] = [];
    generosSeleccionados: Genre[] = [];
    mostrarListaGeneros: boolean = false;
    buscandoGeneros: boolean = false;
    
    imagenPreview: string | null = null;
    usuarioActual: User | null = null;
    
    extensionesPermitidas = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    tamanioMaximoMB = 10;
    
    private modalSubscription: Subscription | null = null;
    private formBuilder = inject(FormBuilder);
    private uploadModalService = inject(UploadModalService);

    constructor() {
        this.uploadForm = this.formBuilder.group({
            titulo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
            descripcion: ['', [Validators.maxLength(500)]],
            imagen: ['', Validators.required],
            buscarGenero: [''],
        });
    }

    ngOnInit() {
        this.obtenerUsuario();
        this.cargarGeneros();
        
        // Suscribirse al observable del modal
        this.modalSubscription = this.uploadModalService.modalAbierto.subscribe(
            (abierto: boolean) => {
                this.mostrarModal = abierto;
                if (abierto) {
                    document.body.style.overflow = 'hidden';
                } else {
                    document.body.style.overflow = 'auto';
                }
            }
        );
    }

    ngOnDestroy() {
        if (this.modalSubscription) {
            this.modalSubscription.unsubscribe();
        }
    }

    obtenerUsuario() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            this.usuarioActual = JSON.parse(userStr);
        }
    }

    async cargarGeneros() {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/genres/');
            const data = await response.json();
            
            if (data.success) {
                // Filtrar solo artes visuales
                const generosVisuales = this.filtrarGenerosVisuales(data.genres);
                this.generosDisponibles = generosVisuales;
                this.generosFiltrados = generosVisuales;
            }
        } catch (error) {
            console.error('Error cargando géneros:', error);
        }
    }

    filtrarGenerosVisuales(generos: any[]): any[] {
        const generosVisuales = ['Pintura', 'Fotografía', 'Ilustración', 'Diseño Gráfico', 'Arte Digital', 'Grabado', 'Cerámica', 'Escultura', 'Arquitectura'];
        return generos.filter(genero => generosVisuales.includes(genero.nombre));
    }

    buscarGeneros(termino: string) {
        termino = termino.trim().toLowerCase();
        
        if (!termino) {
            this.generosFiltrados = this.generosDisponibles;
            this.mostrarListaGeneros = false;
            return;
        }

        this.buscandoGeneros = true;
        this.generosFiltrados = this.generosDisponibles.filter(g =>
            g.nombre.toLowerCase().includes(termino)
        );
        this.mostrarListaGeneros = true;
        this.buscandoGeneros = false;
    }

    seleccionarGenero(genero: Genre) {
        if (this.generosSeleccionados.length < 3 && !this.generosSeleccionados.find(g => g.id === genero.id)) {
            this.generosSeleccionados.push(genero);
            this.uploadForm.get('buscarGenero')?.setValue('');
            this.mostrarListaGeneros = false;
            this.generosFiltrados = this.generosDisponibles;
        }
    }

    removerGenero(generoId: number) {
        this.generosSeleccionados = this.generosSeleccionados.filter(g => g.id !== generoId);
    }

    isGeneroSeleccionado(generoId: number): boolean {
        return this.generosSeleccionados.some(g => g.id === generoId);
    }

    cerrarModal() {
        this.mostrarErrores = false;
        this.uploadModalService.cerrarModal();
    }

    onImagenSelected(event: any) {
        const file = event.target.files[0];
        
        if (!file) return;

        // Validar extensión
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext || !this.extensionesPermitidas.includes(ext)) {
            alert(`Extensión no permitida. Usa: ${this.extensionesPermitidas.join(', ')}`);
            this.uploadForm.get('imagen')?.setValue('');
            return;
        }

        // Validar tamaño
        if (file.size > this.tamanioMaximoMB * 1024 * 1024) {
            alert(`La imagen no puede exceder ${this.tamanioMaximoMB}MB`);
            this.uploadForm.get('imagen')?.setValue('');
            return;
        }

        this.uploadForm.get('imagen')?.setValue(file);
    }

    async subirObra() {
        this.mostrarErrores = true;

        if (this.uploadForm.invalid) {
            alert('Por favor completa los campos obligatorios');
            return;
        }

        if (this.generosSeleccionados.length === 0) {
            alert('Selecciona al menos un género');
            return;
        }

        if (!this.usuarioActual) {
            alert('Debes estar autenticado para subir una obra');
            return;
        }

        this.cargando = true;

        try {
            const formData = new FormData();
            formData.append('titulo', this.uploadForm.get('titulo')?.value);
            formData.append('descripcion', this.uploadForm.get('descripcion')?.value || '');
            formData.append('imagen', this.uploadForm.get('imagen')?.value);
            
            // Agregar géneros
            this.generosSeleccionados.forEach(g => {
                formData.append('generos', g.id.toString());
            });

            const token = localStorage.getItem('access_token');

            const response = await fetch('http://127.0.0.1:8000/api/artworks/create/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Errores del servidor:', data);
                const errorMsg = data.error || data.errors?.titulo?.[0] || 'Error desconocido';
                alert('Error: ' + errorMsg);
                return;
            }

            console.log('Obra subida exitosamente:', data);
            alert('¡Obra subida exitosamente!');
            
            // Limpiar formulario
            this.uploadForm.reset();
            this.generosSeleccionados = [];
            this.imagenPreview = null;
            this.mostrarErrores = false;

            // Cerrar modal
            this.cerrarModal();
            
        } catch (error) {
            console.error('Error en la solicitud:', error);
            alert('Error de conexión. Verifica que el servidor esté corriendo en http://127.0.0.1:8000');
        } finally {
            this.cargando = false;
        }
    }
}
