import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UploadModalService } from '../../services/upload-modal.service';
import { LoginPopupService } from '../../services/login-popup.service';
import { genresSignal, artworksSignal } from '../../../features/home/home';
import { UserService } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthGuard } from '../../../core/guards/auth.guard';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface Genre {
    id: number;
    name: string;
    description: string;
}

interface User {
    id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
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
    isLoading: boolean = false;
    showErrors: boolean = false;
    isModalVisible: boolean = false;
    
    availableGenres: Genre[] = [];
    filteredGenres: Genre[] = [];
    selectedGenres: Genre[] = [];
    isGenreListVisible: boolean = false;
    isSearchingGenres: boolean = false;
    
    imagePreview: string | null = null;
    currentUser: User | null = null;
    selectedFile: File | null = null;
    
    allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    maxSizeMb = 10;
    
    private modalSubscription: Subscription | null = null;
    private formBuilder = inject(FormBuilder);
    private uploadModalService = inject(UploadModalService);
    private loginPopupService = inject(LoginPopupService);
    private userService = inject(UserService);
    private http = inject(HttpClient);
    private notificationService = inject(NotificationService);
    private authGuard = inject(AuthGuard);

    constructor() {
        this.uploadForm = this.formBuilder.group({
            title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
            description: ['', [Validators.maxLength(500)]],
            image: ['', Validators.required],
            searchGenre: [''],
        });
    }
    
    /**
     * On component initialization, fetch the current user and available genres from the backend. 
     * It also subscribes to the upload modal state to show or hide the modal accordingly.
     * @returns
     */
    ngOnInit() {
        this.loadCurrentUser();
        this.loadGenres();
        
        // Subscribe to the modal observable so the UI stays in sync.
        this.modalSubscription = this.uploadModalService.isModalOpen$.subscribe(
            (isOpen: boolean) => {
                this.isModalVisible = isOpen;
                if (isOpen) {
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
    loadCurrentUser() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            this.currentUser = JSON.parse(userStr);
        }
    }

    /**
     * Fetch the list of available genres from the backend API. 
     * It filters the genres to include only those related to visual arts and stores them in the component state for use in the genre selection dropdown.
     * @returns
     */
    async loadGenres() {
        try {
            const data = await firstValueFrom(this.http.get<any>('http://127.0.0.1:8000/api/genres/'));
            if (data?.success) {
                const visualGenres = this.filterVisualGenres(data.genres);
                this.availableGenres = visualGenres;
                this.filteredGenres = visualGenres;
                genresSignal.set(visualGenres);
            }
        } catch (error) {
            this.notificationService.showError('Error al cargar los gÃ©neros. Por favor intenta de nuevo.');
        }
    }

    /**
     * Filter the list of genres to include only those that are relevant to visual arts.
    * @param genres 
     * @returns 
     */
    filterVisualGenres(genres: any[]): any[] {
        const visualGenres = ['Pintura', 'FotografÃ­a', 'IlustraciÃ³n', 'DiseÃ±o GrÃ¡fico', 'Arte Digital', 'Grabado', 'CerÃ¡mica', 'Escultura', 'Arquitectura'];
        return genres.filter((genre) => visualGenres.includes(genre.name));
    }

    /**
     * Filter the available genres based on the user's input in the genre search field. 
     * It updates the list of filtered genres and controls the visibility of the genre dropdown.
     * @param termino
     * @returns
     */
    filterGenres(term: string) {
        term = term.trim().toLowerCase();
        
        if (!term) {
            this.filteredGenres = this.availableGenres;
            this.isGenreListVisible = false;
            return;
        }

        this.isSearchingGenres = true;
        this.filteredGenres = this.availableGenres.filter(g =>
            g.name.toLowerCase().includes(term)
        );
        this.isGenreListVisible = true;
        this.isSearchingGenres = false;
    }

    /**
     * Handle the selection of a genre from the dropdown. 
     * It adds the selected genre to the list of selected genres, clears the search field, and hides the dropdown.
     * @returns
     */
    selectGenre(genre: Genre) {
        if (this.selectedGenres.length < 3 && !this.selectedGenres.find(g => g.id === genre.id)) {
            this.selectedGenres.push(genre);
            this.uploadForm.get('searchGenre')?.setValue('');
            this.isGenreListVisible = false;
            this.filteredGenres = this.availableGenres;
        }
    }

    /**
     * Remove a genre from the list of selected genres. 
     * It updates the state to reflect the change and allows the user to select a different genre if desired.
     * @param genreId
     * @returns
     */
    removeGenre(genreId: number) {
        this.selectedGenres = this.selectedGenres.filter(g => g.id !== genreId);
    }

    /**
     * Check if a genre is currently selected.
     * This is used to prevent duplicate selections and to manage the state of the genre selection dropdown.
     * @param genreId
     * @returns
     */
    isGenreSelected(genreId: number): boolean {
        return this.selectedGenres.some(g => g.id === genreId);
    }

    /**
     * Close the upload modal and reset the form state. 
     * It also hides any error messages and resets the image preview and selected file.
     * @returns
     */
    closeModal() {
        this.showErrors = false;
        this.uploadModalService.closeModal();
    }

    /**
     * Handle the selection of an image file for upload. 
     * It validates the file's extension and size, generates a preview of the image, and updates the form state accordingly.
     * @returns
     */
    onImageSelected(event: any) {
        const file = event.target.files[0];
        
        if (!file) return;

        // Validate extension
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext || !this.allowedExtensions.includes(ext)) {
            this.notificationService.showError(`ExtensiÃ³n no permitida. Usa: ${this.allowedExtensions.join(', ')}`);
            return;
        }

        // Validate size
        if (file.size > this.maxSizeMb * 1024 * 1024) {
            this.notificationService.showError(`La imagen no puede exceder ${this.maxSizeMb}MB`);
            return;
        }

        // Save selected file
        this.selectedFile = file;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.imagePreview = e.target?.result as string;
        };
        reader.readAsDataURL(file);
        
        // Mark the form control as touched to trigger validation messages if needed
        this.uploadForm.get('image')?.markAsTouched();
        this.uploadForm.get('image')?.updateValueAndValidity();
    }

    /**
     * Handle the submission of the upload form. 
     * It performs client-side validation, constructs a FormData object with the form values and selected file, and sends it to the backend API to create a new artwork.
     * It also manages the loading state and displays appropriate success or error messages based on the API response.
     * @returns
     */
    async submitArtwork() {
        this.showErrors = true;

        // Check authentication before proceeding
        if (!this.authGuard.checkAuthentication()) {
            return;
        }

        if (this.uploadForm.invalid) {
            this.notificationService.showError('Por favor completa los campos obligatorios');
            return;
        }

        if (!this.selectedFile) {
            this.notificationService.showError('Selecciona una imagen');
            return;
        }

        if (this.selectedGenres.length === 0) {
            this.notificationService.showError('Selecciona al menos un gÃ©nero');
            return;
        }

        if (!this.currentUser) {
            this.notificationService.showError('Debes estar autenticado para subir una obra');
            return;
        }

        this.isLoading = true;

        try {
            const formData = new FormData();
            formData.append('title', this.uploadForm.get('title')?.value);
            formData.append('description', this.uploadForm.get('description')?.value || '');
            formData.append('image', this.selectedFile);
            
            // Add selected genres as multiple entries in the FormData
            this.selectedGenres.forEach(g => {
                formData.append('genres', g.id.toString());
            });

            const token = localStorage.getItem('access_token');

            if (!token) {
                this.loginPopupService.open();
                this.isLoading = false;
                return;
            }

            const headers = { 'Authorization': `Bearer ${token}` };
            const data = await firstValueFrom(this.http.post<any>('http://127.0.0.1:8000/api/artworks/create/', formData, { headers }));

            if (!data || !data.success && !data.artwork) {
                const errorMsg = data?.error || data?.errors?.title?.[0] || 'Error desconocido';
                this.notificationService.showError('Error: ' + errorMsg);
                return;
            }
            
            // If the upload is successful, add the new artwork to the shared signals so that it appears without needing to refresh.
            try {
                const created = data.artwork ?? data;
                if (created) {
                    // Update shared signals using the normalized flow
                    this.userService.updateArtworkGlobally(created);
                    try {
                        this.userService.userPersonalArtworks.update(list => [created, ...list]);
                    } catch (e) {}
                }
            } catch (e) {}

            // Clear form and reset state
            this.uploadForm.reset();
            this.selectedGenres = [];
            this.imagePreview = null;
            this.selectedFile = null;
            this.showErrors = false;

            // Close modal after successful upload
            this.closeModal();
            
        } catch (error) {
            this.notificationService.showError('Error de conexiÃ³n. Verifica que el servidor estÃ© corriendo en http://127.0.0.1:8000');
        } finally {
            this.isLoading = false;
        }
    }
}
