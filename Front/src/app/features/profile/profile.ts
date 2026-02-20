import { Component, OnInit, inject, signal, Signal, effect } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ArtCard } from '../../shared/components/art-card/art-card';
import { UploadButton } from '../../shared/components/upload-button/upload-button';
import { UploadArtForm } from '../../shared/components/upload-art-form/upload-art-form';
import { UserService, UserProfile } from '../../core/services/user.service';
import { LogoutService } from '../../core/services/logout.service';

interface Artwork {
    id: string;
    title: string;
    description: string;
    authorUsername: string;
    imageUrl: string;
    genreNames: string[];
    viewCount: number;
    likeCount: number;
    createdAt: string;
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
    private router = inject(Router);
    private logoutService = inject(LogoutService);

    // User data
    userProfile = signal<UserProfile | null>(null);
    isCurrentUser = signal<boolean>(false);
    isEditingProfile = signal<boolean>(false);
    editingUsername = signal<string>('');
    editingDescription = signal<string>('');
    isUsernameTaken = signal<boolean>(false);
    isCheckingUsername = signal<boolean>(false);
    profileMessage = signal<string | null>(null);
    savingProfile = signal<boolean>(false);
    private usernameCheckTimeout: ReturnType<typeof setTimeout> | null = null;
    private pendingUsernameCheck: string | null = null;

    // Artworks
    likedArtworks = signal<Artwork[]>([]);
    personalArtworks = signal<Artwork[]>([]);

    // Section state
    isFavoritesExpanded = signal<boolean>(true);
    isPersonalExpanded = signal<boolean>(true);
    isSidebarCollapsed = signal<boolean>(false);

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
            title: artwork.title || '',
            description: artwork.description || '',
            authorUsername: artwork.author_username || artwork.author || artwork.user?.username || '',
            imageUrl: artwork.imageUrl || artwork.image_url || '',
            genreNames: artwork.genre_names || [],
            viewCount: artwork.view_count ?? 0,
            likeCount: artwork.like_count ?? 0,
            createdAt: artwork.created_at || ''
        }));
    }

    /**
     * Navigate back to home
     */
    goBack() {
        this.router.navigate(['/home']);
    }

    /**
     * Logout the current user
     */
    logout() {
        this.logoutService.logout();
    }

    /**
     * Start editing profile
     */
    startEditingProfile() {
        if (!this.isCurrentUser()) return;
        
        const profile = this.userProfile();
        if (profile) {
            this.editingUsername.set(profile.username);
            this.editingDescription.set(profile.description || '');
            this.profileMessage.set(null);
            this.isEditingProfile.set(true);
        }
    }

    /**
     * Cancel profile editing
     */
    cancelEditingProfile() {
        this.isEditingProfile.set(false);
        this.isUsernameTaken.set(false);
        this.isCheckingUsername.set(false);
        this.profileMessage.set(null);
    }

    /**
     * Check if username exists (when different from current)
     */
    async checkUsername() {
        const profile = this.userProfile();
        const newUsername = this.editingUsername().trim();
        
        if (!profile || newUsername === profile.username) {
            this.isUsernameTaken.set(false);
            return;
        }

        if (newUsername.length < 3) {
            this.isUsernameTaken.set(false);
            return;
        }
        if (this.usernameCheckTimeout) {
            clearTimeout(this.usernameCheckTimeout);
        }

        this.isCheckingUsername.set(true);
        this.pendingUsernameCheck = newUsername;
        this.usernameCheckTimeout = setTimeout(async () => {
            const exists = await this.userService.checkUsernameExists(newUsername);
            if (this.pendingUsernameCheck === newUsername) {
                this.isUsernameTaken.set(exists);
                this.isCheckingUsername.set(false);
            }
        }, 350);
    }

    /**
     * Save profile changes
     */
    async saveProfileChanges() {
        if (this.savingProfile()) {
            return;
        }
        const trimmedUsername = this.editingUsername().trim();
        if (trimmedUsername.length === 0) {
            this.profileMessage.set('Por favor selecciona un nombre de usuario válido');
            return;
        }

        if (this.usernameCheckTimeout) {
            clearTimeout(this.usernameCheckTimeout);
            this.usernameCheckTimeout = null;
        }
        this.isCheckingUsername.set(false);

        const profile = this.userProfile();
        if (profile && trimmedUsername !== profile.username) {
            this.isCheckingUsername.set(true);
            const exists = await this.userService.checkUsernameExists(trimmedUsername);
            this.isUsernameTaken.set(exists);
            this.isCheckingUsername.set(false);
            if (exists) {
                this.profileMessage.set('Este nombre de usuario ya esta en uso');
                return;
            }
        }

        if (this.isUsernameTaken()) {
            this.profileMessage.set('Este nombre de usuario ya esta en uso');
            return;
        }

        const updates = {
            username: trimmedUsername,
            description: this.editingDescription()
        };

        this.savingProfile.set(true);
        try {
            const success = await this.userService.updateUserProfile(updates);
            if (success) {
                this.userProfile.set(this.userService.userProfile());
                this.isEditingProfile.set(false);
                this.profileMessage.set('Perfil actualizado exitosamente');
            } else {
                this.profileMessage.set('Error al actualizar el perfil');
            }
        } finally {
            this.savingProfile.set(false);
        }
    }

    /**
     * Filter liked artworks
     */
    get filteredLikedArtworks(): Artwork[] {
        const term = this.favoritesSearchTerm().toLowerCase();
        return this.likedArtworks().filter(artwork =>
            (artwork?.title || '').toLowerCase().includes(term) ||
            (artwork?.authorUsername || '').toLowerCase().includes(term) ||
            (artwork?.genreNames || []).some((g: any) => (g || '').toLowerCase().includes(term))
        );
    }

    /**
     * Filter personal artworks
     */
    get filteredPersonalArtworks(): Artwork[] {
        const term = this.personalSearchTerm().toLowerCase();
        return this.personalArtworks().filter(artwork =>
            (artwork?.title || '').toLowerCase().includes(term) ||
            (artwork?.authorUsername || '').toLowerCase().includes(term) ||
            (artwork?.genreNames || []).some((g: any) => (g || '').toLowerCase().includes(term))
        );
    }

    /**
     * Get artworks grouped in rows of 4 (or 6 if sidebar is collapsed)
     */
    get likedArtworksRows(): Artwork[][] {
        const cols = this.isSidebarCollapsed() ? 6 : 4;
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
        const cols = this.isSidebarCollapsed() ? 6 : 4;
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
        this.isSidebarCollapsed.update(v => !v);
    }

    /**
     * Toggle favorites section
     */
    toggleFavorites() {
        this.isFavoritesExpanded.update(v => !v);
    }

    /**
     * Toggle personal section
     */
    togglePersonal() {
        this.isPersonalExpanded.update(v => !v);
    }
}
