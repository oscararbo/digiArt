import { Component, OnInit, effect, signal, inject } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ArtCard } from '../../shared/components/art-card/art-card';
import { UploadButton } from '../../shared/components/upload-button/upload-button';
import { UploadArtForm } from '../../shared/components/upload-art-form/upload-art-form';
import { NotificationService } from '../../core/services/notification.service';

// Shared signals for genres and artworks
export const genresSignal = signal<any[]>([]);
export const artworksSignal = signal<any[]>([]);

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

interface HomeSection {
    title: string;
    type: 'featured' | 'recent' | 'genre';
    genreId?: number;
    genreName?: string;
    artworks: Artwork[];
    isLoading: boolean;
    error: string | null;
}

@Component({
    selector: 'app-home',
    templateUrl: './home.html',
    styleUrl: './home.scss',
    standalone: true,
    imports: [CommonModule, NgIf, NgFor, ArtCard, UploadButton, UploadArtForm, FormsModule, RouterLink]
})
export class Home implements OnInit {
    private notificationService = inject(NotificationService);
    
    // Signals
    sections = signal<HomeSection[]>([]);
    allGenres = signal<any[]>([]);
    currentUser: any = null;
    
    // Search and filter state
    searchTerm: string = '';
    selectedGenreId: number | null = null;
    sortBy: 'recent' | 'popular' = 'recent';
    searchResults = signal<Artwork[]>([]);
    isSearching: boolean = false;
    isSearchLoading: boolean = false;
    isSearchSectionCollapsed: boolean = false;
    
    // Modal state
    private _isModalOpen = signal<boolean>(false);
    private _modalSection = signal<HomeSection | null>(null);
    pagedArtworks = signal<Artwork[]>([]);
    artworksPerPage: number = 30;

    constructor() {
        // Keep home sections in sync with shared genre/artwork signals.
        effect(() => {
            const g = genresSignal();
            if (g) {
                this.allGenres.set(g);
            }
        });

        effect(() => {
            const a = artworksSignal();
            // If artworksSignal changes, try to apply updates to existing artworks across sections
            if (a && a.length > 0) {
                try {
                    // For each updated artwork in the global signal, update matching entries in sections or insert if new
                    const updates = a.map(raw => this.mapArtworks([raw])[0]);

                    this.sections.update(currentSections => {
                        return currentSections.map(section => {
                            const newArtworks = section.artworks.map(artwork => {
                                const updated = updates.find(u => String(u.id) === String(artwork.id));
                                return updated ? updated : artwork;
                            });

                            // Also insert any new artworks into recientes or genre sections
                            const toInsert: Artwork[] = [];
                            for (const upd of updates) {
                                const exists = newArtworks.find(existing => String(existing.id) === String(upd.id));
                                if (!exists) {
                                    if (section.type === 'recent') {
                                        toInsert.push(upd);
                                    } else if (section.type === 'genre' && upd.genreNames && section.genreName && upd.genreNames.includes(section.genreName)) {
                                        toInsert.push(upd);
                                    }
                                }
                            }

                            // Prepend new inserts but avoid duplicates
                            const merged = toInsert.length > 0 ? [...toInsert, ...newArtworks] : newArtworks;
                            return { ...section, artworks: merged };
                        });
                    });
                    // Also update search results and modal paginated list so they reflect artwork updates
                    try {
                        this.searchResults.update(list => list.map(o => {
                            const upd = updates.find(u => String(u.id) === String(o.id));
                            return upd ? upd : o;
                        }));
                    } catch (e) {}

                    try {
                        this.pagedArtworks.update(list => list.map(o => {
                            const upd = updates.find(u => String(u.id) === String(o.id));
                            return upd ? upd : o;
                        }));
                    } catch (e) {}
                } catch (err) {
                    this.notificationService.showError('Error al actualizar obras. Por favor recarga la pÃ¡gina.');
                }
            }
        });
    }

    // On component initialization, load user data, genres, and sections to display on the home page.
    // Getter/Setter para modal open state
    get isModalOpen(): boolean {
        return this._isModalOpen();
    }

    set isModalOpen(value: boolean) {
        this._isModalOpen.set(value);
    }

    // Getter/Setter para modal section
    get modalSection(): HomeSection | null {
        return this._modalSection();
    }

    set modalSection(value: HomeSection | null) {
        this._modalSection.set(value);
    }

    ngOnInit() {
        this.loadData();
    }

// #region LIFECYCLE AND INITIALIZATION

    /**
     * Load initial data when component initializes
     */
    loadData() {
        this.loadCurrentUser();
        this.loadGenres();
        this.loadSections();
    }

    /**
     * Load current user information from localStorage
     */
    loadCurrentUser() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            this.currentUser = JSON.parse(userStr);
        }
    }

    /**
     * Load visual arts genres from backend API
     */
    async loadGenres() {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/genres/');
            const data = await response.json();
            if (data.success) {
                // Filter genres to include only visual arts genres for the home page and search filters
                const filtered = this.filterVisualGenres(data.genres);
                this.allGenres.set(filtered);
            }
        } catch (error) {
            this.notificationService.showError('Error al cargar los gÃ©neros. Por favor intenta de nuevo.');
        }
    }

    /**
     * Filter the list of genres to include only those that are considered visual arts.
     * This ensures the home page and search filters only display relevant genres.
     * @param genres
     * @returns
     */
    filterVisualGenres(genres: any[]): any[] {
        const visualGenres = ['Pintura', 'Fotografía', 'Ilustración', 'Diseño Gráfico', 'Arte Digital', 'Grabado', 'Cerámica', 'Escultura', 'Arquitectura'];
        return genres.filter((genre) => visualGenres.includes(genre.name));
    }

    /**
     * Load the different sections of artworks to be displayed on the home page, including featured artworks, recent artworks, and artworks by genre. 
     * This function makes multiple API calls to retrieve the necessary data for each section and populates the component's state accordingly.
     * @returns
     */
    async loadSections() {
        // Reset sections before loading to avoid duplicates when reloading
        const nextSections: HomeSection[] = [];

        // Top 10 artworks
        const featured = await this.loadFeaturedArtworks();
        if (featured) {
            nextSections.push(featured);
        }

        // Recent artworks
        const recent = await this.loadRecentArtworks();
        if (recent) {
            nextSections.push(recent);
        }

        // Artworks by genre (only for genres that have artworks)
        for (const genre of this.allGenres()) {
            const byGenre = await this.loadArtworksByGenre(genre.id, genre.name);
            if (byGenre) {
                nextSections.push(byGenre);
            }
        }

        // Update signal with all new sections
        this.sections.set(nextSections);
    }

    /**
    * Load the top featured artworks from the backend API and return a HomeSection object to be displayed on the home page.
    * This function populates the featured section with relevant data.
     * @returns 
     */
    async loadFeaturedArtworks(): Promise<HomeSection | null> {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/artworks/featured/?limit=10');
            const data = await response.json();

            if (data.success) {
                return {
                    title: 'Obras Destacadas',
                    type: 'featured',
                    artworks: this.mapArtworks(data.artworks),
                    isLoading: false,
                    error: null
                };
            }
        } catch (error) {
            this.notificationService.showError('Error al cargar obras destacadas. Por favor intenta de nuevo.');
        }
        return null;
    }

    /**
    * Load the most recent artworks from the backend API and return a HomeSection object to be displayed on the home page.
    * This function populates the recent section with relevant data.
     * @returns 
     */
    async loadRecentArtworks(): Promise<HomeSection | null> {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/artworks/recent/?limit=10');
            const data = await response.json();

            if (data.success) {
                return {
                    title: 'Novedades',
                    type: 'recent',
                    artworks: this.mapArtworks(data.artworks),
                    isLoading: false,
                    error: null
                };
            }
        } catch (error) {
            this.notificationService.showError('Error al cargar novedades. Por favor intenta de nuevo.');
        }
        return null;
    }

    /**
    * Load artworks for a specific genre from the backend API and return a HomeSection object to be displayed on the home page.
    * This function populates per-genre sections with relevant data.
     * @param genreId
    * @param genreName
     * @returns 
     */
    async loadArtworksByGenre(genreId: number, genreName: string): Promise<HomeSection | null> {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/artworks/genre/${genreId}/?limit=10`);
            const data = await response.json();

            if (data.success && data.artworks.length > 0) {
                return {
                    title: `Estilo: ${genreName}`,
                    type: 'genre',
                    genreId: genreId,
                    genreName: genreName,
                    artworks: this.mapArtworks(data.artworks),
                    isLoading: false,
                    error: null
                };
            }
        } catch (error) {
            this.notificationService.showError('Error al cargar artworks del gÃ©nero. Por favor intenta de nuevo.');
        }
        return null;
    }

    /**
     * Map the raw artwork data from the backend API to the Artwork interface used in the component. 
     * This function is used to ensure that the artwork data is in a consistent format for display and manipulation within the home page sections and modals.
     * @param artworks
     * @returns 
     */
    mapArtworks(artworks: any[]): Artwork[] {
        return artworks.map(artwork => ({
            id: artwork.id,
            title: artwork.title,
            description: artwork.description,
            authorUsername: artwork.author_username,
            imageUrl: artwork.image_url || artwork.imageUrl,
            genreNames: artwork.genre_names || [],
            viewCount: artwork.viewCount ?? artwork.view_count ?? artwork.views ?? 0,
            likeCount: artwork.likeCount ?? artwork.like_count ?? artwork.likes ?? 0,
            createdAt: artwork.created_at
        }));
    }

    /**
     * Open a modal to display a paginated list of artworks for a specific section (featured, recent, or genre). 
     * This function is called when the user clicks on the "Ver mÃ¡s" button for a section on the home page, allowing them to see more artworks related to that section.
     * @param section
     * @returns 
     */
    async openModal(section: HomeSection) {
        this.modalSection = { ...section };

        try {
            const limit = 30;
            let url = '';

            switch (section.type) {
                case 'featured':
                    url = `http://127.0.0.1:8000/api/artworks/featured/?limit=${limit}`;
                    break;
                case 'recent':
                    url = `http://127.0.0.1:8000/api/artworks/recent/?limit=${limit}`;
                    break;
                case 'genre':
                    url = `http://127.0.0.1:8000/api/artworks/genre/${section.genreId}/?limit=${limit}`;
                    break;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                this.pagedArtworks.set(this.mapArtworks(data.artworks));
                this.isModalOpen = true;
            }
        } catch (error) {
            this.notificationService.showError('Error al cargar mÃ¡s artworks. Por favor intenta de nuevo.');
        }
    }

    /**
     * Close the artwork modal and reset related state. This function is called when the user closes the modal after viewing more artworks in a section, ensuring that the component's state is cleared and ready for the next time the modal is opened.
     * @returns 
     */
    closeModal() {
        this.isModalOpen = false;
        this.modalSection = null;
        this.pagedArtworks.set([]);
        // Reload sections to update artworks data after closing modal (e.g., if user liked an artwork)
        this.loadData();
    }

// #endregion
// #region SEARCH AND FILTERING

    /**
     * Search artworks by term and/or genre filter with optional sorting
     */
    async runSearch() {
        if (this.searchTerm.trim() === '' && this.selectedGenreId === null) {
            this.isSearching = false;
            return;
        }

        this.isSearchLoading = true;
        this.isSearching = true;

        try {
            let url = 'http://127.0.0.1:8000/api/artworks/';
            
            // Apply genre filter if selected
            if (this.selectedGenreId !== null && this.selectedGenreId !== 0) {
                url = `http://127.0.0.1:8000/api/artworks/genre/${this.selectedGenreId}/?limit=100`;
            } else {
                url += '?limit=100';
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                let artworks = this.mapArtworks(data.artworks);

                // Filter by search term if provided
                if (this.searchTerm.trim()) {
                    const term = this.searchTerm.toLowerCase();
                    artworks = artworks.filter(artwork => 
                        artwork.title.toLowerCase().includes(term) ||
                        artwork.description.toLowerCase().includes(term) ||
                        artwork.authorUsername.toLowerCase().includes(term) ||
                        artwork.genreNames.some(g => g.toLowerCase().includes(term))
                    );
                }

                // Order results
                if (this.sortBy === 'popular') {
                    artworks = artworks.sort((a, b) => b.likeCount - a.likeCount);
                } else {
                    artworks = artworks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                }

                this.searchResults.set(artworks);
            }
        } catch (error) {
            this.notificationService.showError('Error al buscar artworks. Por favor intenta de nuevo.');
        } finally {
            this.isSearchLoading = false;
        }
    }

    /** Clear the search term, reset the genre filter, and hide the search results.
     * This function resets search criteria and returns to the default home page view.
     * @returns 
     */
    clearSearch() {
        this.searchTerm = '';
        this.selectedGenreId = null;
        this.isSearching = false;
        this.searchResults.set([]);
    }

    /**
     * Change the selected genre filter for the search and trigger a new search with the updated filter.
     * This function is called when the user selects a different genre from the dropdown, allowing them to refine their search results based on the chosen genre.
     * @param genreId
     */
    setGenreFilter(genreId: number) {
        this.selectedGenreId = this.selectedGenreId === genreId ? null : genreId;
        this.runSearch();
    }

    /** 
     * Change the sorting order for the search results and trigger a new search with the updated order.
     * This function is called when the user selects a different sorting option (recent or popular) from the dropdown, allowing them to view their search results in the desired order.
     * @param orden 
     */
    setSortBy(order: 'recent' | 'popular') {
        this.sortBy = order;
        if (this.isSearching) {
            this.runSearch();
        }
    }

    // Toggle the visibility of the search and filter section on the home page.
    toggleSearchSection() {
        this.isSearchSectionCollapsed = !this.isSearchSectionCollapsed;
    }

    /**
     * Toggle search section visibility
     */

// #endregion
// #region PAGINATION HELPERS

    get itemsPerRow(): number {
        return 3;
    }

    get modalRowCount(): number {
        return Math.ceil(this.pagedArtworks().length / this.itemsPerRow);
    }
// #endregion
}
