import { Component, OnInit, inject, signal, Signal, effect } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ArtCard } from '../../shared/components/art-card/art-card';
import { UploadButton } from '../../shared/components/upload-button/upload-button';
import { UploadArtForm } from '../../shared/components/upload-art-form/upload-art-form';
import { UserService, UserProfile } from '../../core/services/user.service';

interface Artwork {
    id: string;
    titulo: string;
    descripcion: string;
    autor_username: string;
    imageUrl: string;
    generos_nombres: string[];
    vistas: number;
    likes: number;
    fecha_creacion: string;
}

@Component({
    selector: 'app-profile',
    templateUrl: './profile.html',
    styleUrl: './profile.scss',
    standalone: true,
    imports: [CommonModule, NgIf, NgFor, ArtCard, UploadButton, UploadArtForm, FormsModule]
})
export class Profile implements OnInit {
    private userService = inject(UserService);
    private route = inject(ActivatedRoute);

    // User data
    userProfile = signal<UserProfile | null>(null);
    isCurrentUser = signal<boolean>(false);
    isEditingProfile = signal<boolean>(false);
    editingUsername = signal<string>('');
    editingDescription = signal<string>('');
    usernameExists = signal<boolean>(false);
    checkingUsername = signal<boolean>(false);

    // Artworks
    likedArtworks = signal<Artwork[]>([]);
    personalArtworks = signal<Artwork[]>([]);

    // Section state
    favoritesExpanded = signal<boolean>(true);
    personalExpanded = signal<boolean>(true);
    sidebarCollapsed = signal<boolean>(false);

    // Search/filter
    favoritesSearchTerm = signal<string>('');
    personalSearchTerm = signal<string>('');

    constructor() {
        // Monitor service signals for real-time updates using effects
        effect(() => {
            const artworks = this.userService.userLikedArtworks();
            this.likedArtworks.set(this.mapArtworks(artworks));
        });
        
        effect(() => {
            const artworks = this.userService.userPersonalArtworks();
            this.personalArtworks.set(this.mapArtworks(artworks));
        });

        // Also monitor the global personal artworks signal for uploads from profile
        // The component reacts to the UserService signals directly (no global signals file)
    }

    ngOnInit() {
        // Get username from route params or use current user
        this.route.queryParams.subscribe(async (params) => {
            const username = params['username'] || this.userService.userProfile()?.username;
            
            if (username) {
                await this.loadUserProfile(username);
            }
        });

        // If no username in params, use current user from service
        if (!this.userProfile() && this.userService.userProfile()) {
            this.userProfile.set(this.userService.userProfile());
            this.loadUserData();
        }
    }

    /**
     * Load user profile by username
     */
    async loadUserProfile(username: string) {
        const profile = await this.userService.getUserProfile(username);
        if (profile) {
            this.userProfile.set(profile);
            
            // Check if this is the current user
            const currentUser = this.userService.userProfile();
            this.isCurrentUser.set(currentUser?.username === username);
            
            await this.loadUserData();
        }
    }

    /**
     * Load user's liked and personal artworks
     */
    async loadUserData() {
        const userId = this.userProfile()?.id;
        if (userId) {
            await this.userService.getUserLikedArtworks(userId);
            await this.userService.getUserPersonalArtworks(userId);
        }
    }

    /**
     * Map raw artwork data to Artwork interface
     */
    mapArtworks(artworks: any[]): Artwork[] {
        return artworks.map(artwork => ({
            id: artwork.id || '',
            titulo: artwork.titulo || '',
            descripcion: artwork.descripcion || '',
            autor_username: artwork.autor_username || '',
            imageUrl: artwork.imageUrl || '',
            generos_nombres: artwork.generos_nombres || [],
            vistas: artwork.vistas || 0,
            likes: artwork.likes || 0,
            fecha_creacion: artwork.fecha_creacion || ''
        }));
    }

    /**
     * Start editing profile
     */
    startEditingProfile() {
        if (!this.isCurrentUser()) return;
        
        const profile = this.userProfile();
        if (profile) {
            this.editingUsername.set(profile.username);
            this.editingDescription.set(profile.descripcion || '');
            this.isEditingProfile.set(true);
        }
    }

    /**
     * Cancel profile editing
     */
    cancelEditingProfile() {
        this.isEditingProfile.set(false);
        this.usernameExists.set(false);
        this.checkingUsername.set(false);
    }

    /**
     * Check if username exists (when different from current)
     */
    async checkUsername() {
        const profile = this.userProfile();
        const newUsername = this.editingUsername();
        
        if (!profile || newUsername === profile.username) {
            this.usernameExists.set(false);
            return;
        }

        this.checkingUsername.set(true);
        const exists = await this.userService.checkUsernameExists(newUsername);
        this.usernameExists.set(exists);
        this.checkingUsername.set(false);
    }

    /**
     * Save profile changes
     */
    async saveProfileChanges() {
        if (this.usernameExists() || this.editingUsername().trim().length === 0) {
            alert('Por favor selecciona un nombre de usuario válido');
            return;
        }

        const updates = {
            username: this.editingUsername(),
            descripcion: this.editingDescription()
        };

        const success = await this.userService.updateUserProfile(updates);
        if (success) {
            this.isEditingProfile.set(false);
            alert('Perfil actualizado exitosamente');
        } else {
            alert('Error al actualizar el perfil');
        }
    }

    /**
     * Filter liked artworks
     */
    get filteredLikedArtworks(): Artwork[] {
        const term = this.favoritesSearchTerm().toLowerCase();
        return this.likedArtworks().filter(artwork =>
            (artwork?.titulo || '').toLowerCase().includes(term) ||
            (artwork?.autor_username || '').toLowerCase().includes(term) ||
            (artwork?.generos_nombres || []).some((g: any) => (g || '').toLowerCase().includes(term))
        );
    }

    /**
     * Filter personal artworks
     */
    get filteredPersonalArtworks(): Artwork[] {
        const term = this.personalSearchTerm().toLowerCase();
        return this.personalArtworks().filter(artwork =>
            (artwork?.titulo || '').toLowerCase().includes(term) ||
            (artwork?.autor_username || '').toLowerCase().includes(term) ||
            (artwork?.generos_nombres || []).some((g: any) => (g || '').toLowerCase().includes(term))
        );
    }

    /**
     * Get artworks grouped in rows of 4 (or 6 if sidebar is collapsed)
     */
    get likedArtworksRows(): Artwork[][] {
        const cols = this.sidebarCollapsed() ? 6 : 4;
        const rows: Artwork[][] = [];
        const filtered = this.filteredLikedArtworks;
        
        for (let i = 0; i < filtered.length; i += cols) {
            rows.push(filtered.slice(i, i + cols));
        }
        return rows;
    }

    /**
     * Get artworks grouped in rows of 4 (or 6 if sidebar is collapsed)
     */
    get personalArtworksRows(): Artwork[][] {
        const cols = this.sidebarCollapsed() ? 6 : 4;
        const rows: Artwork[][] = [];
        const filtered = this.filteredPersonalArtworks;
        
        for (let i = 0; i < filtered.length; i += cols) {
            rows.push(filtered.slice(i, i + cols));
        }
        return rows;
    }

    /**
     * Toggle sidebar collapsed state
     */
    toggleSidebarCollapsed() {
        this.sidebarCollapsed.update(v => !v);
    }

    /**
     * Toggle favorites section
     */
    toggleFavorites() {
        this.favoritesExpanded.update(v => !v);
    }

    /**
     * Toggle personal section
     */
    togglePersonal() {
        this.personalExpanded.update(v => !v);
    }
}
