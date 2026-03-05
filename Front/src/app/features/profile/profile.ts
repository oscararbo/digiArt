import { Component, OnInit, inject, signal, Signal, effect, ViewEncapsulation } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ArtCard } from '../../shared/components/art-card/art-card';
import { UploadButton } from '../../shared/components/upload-button/upload-button';
import { UploadArtForm } from '../../shared/components/upload-art-form/upload-art-form';
import { BackButtonComponent } from '../../shared/components/back-button/back-button';
import { CollapsibleSidebar } from '../../shared/components/collapsible-section/collapsible-section';
import { ArtworkStatsDisplayComponent } from '../../shared/components/artwork-stats-display/artwork-stats-display';
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
    imports: [CommonModule, NgIf, NgFor, ArtCard, UploadButton, UploadArtForm, FormsModule, BackButtonComponent, CollapsibleSidebar, ArtworkStatsDisplayComponent],
    encapsulation: ViewEncapsulation.None
})
export class Profile implements OnInit {
    private userService = inject(UserService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private logoutService = inject(LogoutService);

    // User data
// #region USER DATA

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

// #endregion
// #region ARTWORKS

    likedArtworks = signal<Artwork[]>([]);
    personalArtworks = signal<Artwork[]>([]);

// #endregion
// #region SECTION STATE

    isFavoritesExpanded = signal<boolean>(true);
    isPersonalExpanded = signal<boolean>(true);
    sidebarExpanded = signal<boolean>(true);

// #endregion
// #region SEARCH AND FILTER

    favoritesSearchTerm = signal<string>('');
    personalSearchTerm = signal<string>('');

    constructor() {
        effect(() => {
            const artworks = this.userService.userLikedArtworks();
            this.likedArtworks.set(this.mapArtworks(artworks));
        });

        effect(() => {
            const artworks = this.userService.userPersonalArtworks();
            this.personalArtworks.set(this.mapArtworks(artworks));
        });
    }

    ngOnInit() {
        // Get current user ID from localStorage
        let currentUserId: string | null = null;
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                currentUserId = user?.id;
            } catch (e) {
                console.error('Error parsing user:', e);
            }
        }

        // Get ID from route params
        this.route.params.subscribe((params) => {
            const routeUserId = params['id'];
            
            // Validate that user can only see their own profile
            if (routeUserId && currentUserId && String(routeUserId) !== String(currentUserId)) {
                // Redirect to user's own profile
                this.router.navigate(['/profile', currentUserId]);
                return;
            }

            if (routeUserId && currentUserId) {
                this.loadUserProfile(currentUserId);
            }
        });

        // If no ID in params, use current user from service
        if (!this.userProfile() && this.userService.userProfile()) {
            this.userProfile.set(this.userService.userProfile());
            this.loadUserData();
        }
    }

    /**
     * Load user profile by user ID
     */
    async loadUserProfile(userId: string) {
        const profile = await this.userService.getUserProfileById(userId);
        if (profile) {
            this.userProfile.set(profile);
            
            // Check if this is the current user (should always be true due to validation above)
            const currentUser = this.userService.userProfile();
            this.isCurrentUser.set(currentUser?.id === parseInt(userId));
            
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
            viewCount: artwork.viewCount ?? artwork.view_count ?? artwork.views ?? 0,
            likeCount: artwork.likeCount ?? artwork.like_count ?? artwork.likes ?? 0,
            createdAt: artwork.created_at || ''
        }));
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
            this.profileMessage.set('Por favor selecciona un nombre de usuario vÃ¡lido');
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

// #endregion
// #region GRID HELPERS

    /**
     * Get liked artworks grouped by rows
     */
    get likedArtworksRows(): Artwork[][] {
        const cols = !this.sidebarExpanded() ? 6 : 4;
        const rows: Artwork[][] = [];
        const filtered = this.filteredLikedArtworks;

        for (let i = 0; i < filtered.length; i += cols) {
            rows.push(filtered.slice(i, i + cols));
        }

        return rows;
    }

    /**
     * Get personal artworks grouped by rows
     */
    get personalArtworksRows(): Artwork[][] {
        const cols = !this.sidebarExpanded() ? 6 : 4;
        const rows: Artwork[][] = [];
        const filtered = this.filteredPersonalArtworks;

        for (let i = 0; i < filtered.length; i += cols) {
            rows.push(filtered.slice(i, i + cols));
        }

        return rows;
    }

// #endregion
// #region UI TOGGLES

    /**
     * Toggle sidebar collapsed state
     */
    toggleSidebarCollapsed() {
        this.sidebarExpanded.update(v => !v);
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
// #endregion
}
