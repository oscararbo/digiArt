import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UploadModalService } from '../../services/upload-modal.service';
import { LoginPopupService } from '../../services/login-popup.service';
import { genresSignal, artworksSignal } from '../../../features/home/home';
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
    selectedFile: File | null = null;
    
    extensionesPermitidas = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    tamanioMaximoMB = 10;
    
    private modalSubscription: Subscription | null = null;
    private formBuilder = inject(FormBuilder);
    private uploadModalService = inject(UploadModalService);
    private loginPopupService = inject(LoginPopupService);

    constructor() {
        this.uploadForm = this.formBuilder.group({
            titulo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
            descripcion: ['', [Validators.maxLength(500)]],
            imagen: ['', Validators.required],
            buscarGenero: [''],
        });
    }
    
    /**
     * On component initialization, fetch the current user and available genres from the backend. 
     * It also subscribes to the upload modal state to show or hide the modal accordingly.
     * @returns
     */
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

    /**
     * On component destruction, unsubscribe from the modal state observable to prevent memory leaks.
     * @returns
     */
    ngOnDestroy() {
        if (this.modalSubscription) {
            this.modalSubscription.unsubscribe();
        }
    }

    /**
     * Fetch the current user's information from localStorage. This is used to associate the uploaded artwork with the user.
     * @returns
     */
    obtenerUsuario() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            this.usuarioActual = JSON.parse(userStr);
        }
    }

    /**
     * Fetch the list of available genres from the backend API. 
     * It filters the genres to include only those related to visual arts and stores them in the component state for use in the genre selection dropdown.
     * @returns
     */
    async cargarGeneros() {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/genres/');
            const data = await response.json();
            
            if (data.success) {
                // Filtrar solo artes visuales
                const generosVisuales = this.filtrarGenerosVisuales(data.genres);
                this.generosDisponibles = generosVisuales;
                this.generosFiltrados = generosVisuales;
                // Update shared signal
                genresSignal.set(generosVisuales);
            }
        } catch (error) {
            console.error('Error cargando géneros:', error);
        }
    }

    /**
     * Filter the list of genres to include only those that are relevant to visual arts.
     * @param generos 
     * @returns 
     */
    filtrarGenerosVisuales(generos: any[]): any[] {
        const generosVisuales = ['Pintura', 'Fotografía', 'Ilustración', 'Diseño Gráfico', 'Arte Digital', 'Grabado', 'Cerámica', 'Escultura', 'Arquitectura'];
        return generos.filter(genero => generosVisuales.includes(genero.nombre));
    }

    /**
     * Filter the available genres based on the user's input in the genre search field. 
     * It updates the list of filtered genres and controls the visibility of the genre dropdown.
     * @param termino
     * @returns
     */
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

    /**
     * Handle the selection of a genre from the dropdown. 
     * It adds the selected genre to the list of selected genres, clears the search field, and hides the dropdown.
     * @returns
     */
    seleccionarGenero(genero: Genre) {
        if (this.generosSeleccionados.length < 3 && !this.generosSeleccionados.find(g => g.id === genero.id)) {
            this.generosSeleccionados.push(genero);
            this.uploadForm.get('buscarGenero')?.setValue('');
            this.mostrarListaGeneros = false;
            this.generosFiltrados = this.generosDisponibles;
        }
    }

    /**
     * Remove a genre from the list of selected genres. 
     * It updates the state to reflect the change and allows the user to select a different genre if desired.
     * @param generoId
     * @returns
     */
    removerGenero(generoId: number) {
        this.generosSeleccionados = this.generosSeleccionados.filter(g => g.id !== generoId);
    }

    /**
     * Check if a genre is currently selected.
     * This is used to prevent duplicate selections and to manage the state of the genre selection dropdown.
     * @param generoId
     * @returns
     */
    isGeneroSeleccionado(generoId: number): boolean {
        return this.generosSeleccionados.some(g => g.id === generoId);
    }

    /**
     * Close the upload modal and reset the form state. 
     * It also hides any error messages and resets the image preview and selected file.
     * @returns
     */
    cerrarModal() {
        this.mostrarErrores = false;
        this.uploadModalService.cerrarModal();
    }

    /**
     * Handle the selection of an image file for upload. 
     * It validates the file's extension and size, generates a preview of the image, and updates the form state accordingly.
     * @returns
     */
    onImagenSelected(event: any) {
        const file = event.target.files[0];
        
        if (!file) return;

        // Validate extension
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext || !this.extensionesPermitidas.includes(ext)) {
            alert(`Extensión no permitida. Usa: ${this.extensionesPermitidas.join(', ')}`);
            return;
        }

        // Validate size
        if (file.size > this.tamanioMaximoMB * 1024 * 1024) {
            alert(`La imagen no puede exceder ${this.tamanioMaximoMB}MB`);
            return;
        }

        // Save selected file
        this.selectedFile = file;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.imagenPreview = e.target?.result as string;
        };
        reader.readAsDataURL(file);
        
        // Mark the form control as touched to trigger validation messages if needed
        this.uploadForm.get('imagen')?.markAsTouched();
        this.uploadForm.get('imagen')?.updateValueAndValidity();
    }

    /**
     * Handle the submission of the upload form. 
     * It performs client-side validation, constructs a FormData object with the form values and selected file, and sends it to the backend API to create a new artwork.
     * It also manages the loading state and displays appropriate success or error messages based on the API response.
     * @returns
     */
    async subirObra() {
        this.mostrarErrores = true;

        if (this.uploadForm.invalid) {
            alert('Por favor completa los campos obligatorios');
            return;
        }

        if (!this.selectedFile) {
            alert('Selecciona una imagen');
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
            formData.append('imagen', this.selectedFile);
            
            // Add selected genres as multiple entries in the FormData
            this.generosSeleccionados.forEach(g => {
                formData.append('generos', g.id.toString());
            });

            const token = localStorage.getItem('access_token');

            if (!token) {
                // Open login pop-up if user is not authenticated
                this.loginPopupService.open();
                this.cargando = false;
                return;
            }

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
                const errorMsg = data.error || data.errors?.titulo?.[0] || `Error: ${response.status}`;
                alert('Error: ' + errorMsg);
                return;
            }
            
            // If the upload is successful, add the new artwork to the shared signal so that it appears in the home page without needing to refresh.
            try {
                const created = data.artwork ?? data;
                if (created) {
                    artworksSignal.update(list => [created, ...list]);
                }
            } catch (e) {}

            // Clear form and reset state
            this.uploadForm.reset();
            this.generosSeleccionados = [];
            this.imagenPreview = null;
            this.selectedFile = null;
            this.mostrarErrores = false;

            // Close modal after successful upload
            this.cerrarModal();
            
        } catch (error) {
            console.error('Error en la solicitud:', error);
            alert('Error de conexión. Verifica que el servidor esté corriendo en http://127.0.0.1:8000');
        } finally {
            this.cargando = false;
        }
    }
}
