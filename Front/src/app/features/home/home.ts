import { Component, OnInit, effect, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArtCard } from '../../shared/components/art-card/art-card';
import { UploadButton } from '../../shared/components/upload-button/upload-button';
import { UploadArtForm } from '../../shared/components/upload-art-form/upload-art-form';
import { LoginPopupService } from '../../shared/services/login-popup.service';

// Simple shared signals for genres and artworks
export const genresSignal = signal<any[]>([]);
export const artworksSignal = signal<any[]>([]);

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

interface HomeSection {
    titulo: string;
    tipo: 'destacadas' | 'recientes' | 'genero';
    genreId?: number;
    genreNombre?: string;
    obras: Artwork[];
    cargando: boolean;
    error: string | null;
}

@Component({
    selector: 'app-home',
    templateUrl: './home.html',
    styleUrl: './home.scss',
    standalone: true,
    imports: [CommonModule, ArtCard, UploadButton, UploadArtForm, FormsModule]
})
export class Home implements OnInit {
    private loginPopupService = inject(LoginPopupService);
    
    secciones = signal<HomeSection[]>([]);
    todasGeneros = signal<any[]>([]);
    usuarioActual: any = null;
    
    // State for search and filters
    searchSectionCollapsed: boolean = false;
    
    // Search and filter state
    busquedaTermino: string = '';
    generoSeleccionado: number | null = null;
    ordenarPor: 'reciente' | 'populares' = 'reciente';
    resultadosBusqueda: Artwork[] = [];
    mostrandoBusqueda: boolean = false;
    cargandoBusqueda: boolean = false;
    
    // Modal
    modalActiva: boolean = false;
    modalSeccion: HomeSection | null = null;
    obrasPaginadas: Artwork[] = [];
    pagina: number = 0;
    obrasPorPagina: number = 30;

    constructor() {
        // Efects to react to global state changes in genres and artworks, ensuring that the home page updates accordingly when there are changes in these global states.
        effect(() => {
            const g = genresSignal();
            if (g) {
                this.todasGeneros.set(g);
            }
        });

        effect(() => {
            const a = artworksSignal();
            // If there's a newly added artwork signal, try to insert it locally into relevant sections
            if (a && a.length > 0) {
                const latestRaw = a[0];
                try {
                    const mapped = this.mapearObras([latestRaw])[0];
                    
                    // Use update() to ensure proper reactivity and create new references
                    this.secciones.update(currentSecciones => {
                        // Create a new array with updated sections to trigger Angular change detection
                        return currentSecciones.map(sec => {
                            if (sec.tipo === 'recientes') {
                                // Check if artwork already exists
                                if (!sec.obras.find(o => o.id === mapped.id)) {
                                    return {
                                        ...sec,
                                        obras: [mapped, ...sec.obras]
                                    };
                                }
                                return sec;
                            }
                            
                            if (sec.tipo === 'genero' && mapped.generos_nombres && sec.genreNombre && mapped.generos_nombres.includes(sec.genreNombre)) {
                                // Check if artwork already exists
                                if (!sec.obras.find(o => o.id === mapped.id)) {
                                    return {
                                        ...sec,
                                        obras: [mapped, ...sec.obras]
                                    };
                                }
                            }
                            
                            return sec;
                        });
                    });
                } catch (err) {
                    // If mapping fails, we can ignore and rely on manual refresh
                    console.error('Error inserting artwork:', err);
                }
            }
        });
    }

    // On component initialization, load user data, genres, and sections to display on the home page.
    ngOnInit() {
        this.cargarDatos();
    }

    // Load user data, genres, and sections for the home page.
    cargarDatos(){
        this.obtenerUsuario();
        this.cargarGeneros();
        this.cargarSecciones();
    }
    /**
     * Retrieve the current user's information from local storage and store it in the component's state.
     * This function is called during component initialization to ensure that user data is available for features like liking artworks or displaying user-specific content.
     * @returns
     */
    obtenerUsuario() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            this.usuarioActual = JSON.parse(userStr);
        }
    }

    /** 
     * Load the list of art genres from the backend API and filter them to include only visual arts genres. This function is called during component initialization to populate the genre filter options and to load artworks by genre on the home page.
     * @returns
     */
    async cargarGeneros() {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/genres/');
            const data = await response.json();
            if (data.success) {
                // Filter genres to include only visual arts genres for the home page and search filters
                const filtrados = this.filtrarGenerosVisuales(data.genres);
                this.todasGeneros.set(filtrados);
            }
        } catch (error) {
            console.error('Error cargando géneros:', error);
        }
    }

    /**
     * Filter the list of genres to include only those that are considered visual arts. 
     * This is used to ensure that the home page and search filters only display relevant genres for the type of artworks featured on the platform.
     * @param generos 
     * @returns 
     */
    filtrarGenerosVisuales(generos: any[]): any[] {
        const generosVisuales = ['Pintura', 'Fotografía', 'Ilustración', 'Diseño Gráfico', 'Arte Digital', 'Grabado', 'Cerámica', 'Escultura', 'Arquitectura'];
        return generos.filter(genero => generosVisuales.includes(genero.nombre));
    }

    /**
     * Load the different sections of artworks to be displayed on the home page, including featured artworks, recent artworks, and artworks by genre. 
     * This function makes multiple API calls to retrieve the necessary data for each section and populates the component's state accordingly.
     * @returns
     */
    async cargarSecciones() {
        // Reset sections before loading to avoid duplicates when reloading
        const nuevasSecciones: HomeSection[] = [];

        // Top 10 artworks
        const destacadas = await this.cargarObrasDestacadas();
        if (destacadas) {
            nuevasSecciones.push(destacadas);
        }

        // Recent artworks
        const recientes = await this.cargarObrasRecientes();
        if (recientes) {
            nuevasSecciones.push(recientes);
        }

        // Artworks by genre (only for genres that have artworks)
        for (const genero of this.todasGeneros()) {
            const obrasPorGenero = await this.cargarObrasPorGenero(genero.id, genero.nombre);
            if (obrasPorGenero) {
                nuevasSecciones.push(obrasPorGenero);
            }
        }

        // Update signal with all new sections
        this.secciones.set(nuevasSecciones);
    }

    /**
     * Load the top featured artworks from the backend API and return a HomeSection object to be displayed on the home page. 
     * This function is called during the loading of home page sections to populate the "Obras Destacadas" section with relevant data.
     * @returns 
     */
    async cargarObrasDestacadas(): Promise<HomeSection | null> {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/artworks/featured/?limit=10');
            const data = await response.json();

            if (data.success) {
                return {
                    titulo: 'Obras Destacadas',
                    tipo: 'destacadas',
                    obras: this.mapearObras(data.artworks),
                    cargando: false,
                    error: null
                };
            }
        } catch (error) {
            console.error('Error cargando obras destacadas:', error);
        }
        return null;
    }

    /**
     * Load the most recent artworks from the backend API and return a HomeSection object to be displayed on the home page. 
     * This function is called during the loading of home page sections to populate the "Novedades" section with relevant data.
     * @returns 
     */
    async cargarObrasRecientes(): Promise<HomeSection | null> {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/artworks/recent/?limit=10');
            const data = await response.json();

            if (data.success) {
                return {
                    titulo: 'Novedades',
                    tipo: 'recientes',
                    obras: this.mapearObras(data.artworks),
                    cargando: false,
                    error: null
                };
            }
        } catch (error) {
            console.error('Error cargando obras recientes:', error);
        }
        return null;
    }

    /**
     * Load artworks for a specific genre from the backend API and return a HomeSection object to be displayed on the home page. 
     * This function is called during the loading of home page sections for each genre to populate sections like "Estilo: Pintura" with relevant data.
     * @param genreId
     * @param genreNombre
     * @returns 
     */
    async cargarObrasPorGenero(genreId: number, genreNombre: string): Promise<HomeSection | null> {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/artworks/genre/${genreId}/?limit=10`);
            const data = await response.json();

            if (data.success && data.artworks.length > 0) {
                return {
                    titulo: `Estilo: ${genreNombre}`,
                    tipo: 'genero',
                    genreId: genreId,
                    genreNombre: genreNombre,
                    obras: this.mapearObras(data.artworks),
                    cargando: false,
                    error: null
                };
            }
        } catch (error) {
            console.error(`Error cargando obras del género ${genreNombre}:`, error);
        }
        return null;
    }

    /**
     * Map the raw artwork data from the backend API to the Artwork interface used in the component. 
     * This function is used to ensure that the artwork data is in a consistent format for display and manipulation within the home page sections and modals.
     * @param artworks
     * @returns 
     */
    mapearObras(artworks: any[]): Artwork[] {
        return artworks.map(artwork => ({
            id: artwork.id,
            titulo: artwork.titulo,
            descripcion: artwork.descripcion,
            autor_username: artwork.autor_username,
            imageUrl: artwork.imageUrl,
            generos_nombres: artwork.generos_nombres,
            vistas: artwork.vistas,
            likes: artwork.likes,
            fecha_creacion: artwork.fecha_creacion
        }));
    }

    /**
     * Open a modal to display a paginated list of artworks for a specific section (featured, recent, or genre). 
     * This function is called when the user clicks on the "Ver más" button for a section on the home page, allowing them to see more artworks related to that section.
     * @param seccion
     * @returns 
     */
    async abrirModal(seccion: HomeSection) {
        this.modalSeccion = { ...seccion };
        this.pagina = 0;

        try {
            const limit = 30;
            let url = '';

            switch (seccion.tipo) {
                case 'destacadas':
                    url = `http://127.0.0.1:8000/api/artworks/featured/?limit=${limit}`;
                    break;
                case 'recientes':
                    url = `http://127.0.0.1:8000/api/artworks/recent/?limit=${limit}`;
                    break;
                case 'genero':
                    url = `http://127.0.0.1:8000/api/artworks/genre/${seccion.genreId}/?limit=${limit}`;
                    break;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                this.obrasPaginadas = this.mapearObras(data.artworks);
                this.modalActiva = true;
            }
        } catch (error) {
            console.error('Error cargando obras del modal:', error);
        }
    }

    /**
     * Close the artwork modal and reset related state. This function is called when the user closes the modal after viewing more artworks in a section, ensuring that the component's state is cleared and ready for the next time the modal is opened.
     * @returns 
     */
    cerrarModal() {
        this.modalActiva = false;
        this.modalSeccion = null;
        this.obrasPaginadas = [];
        // Reload sections to update artworks data after closing modal (e.g., if user liked an artwork)
        this.cargarDatos();
    }

    /**
     * Perform a search for artworks based on the search term and selected genre filter. This function is called when the user submits a search query or changes the genre filter, allowing them to find artworks that match their criteria.
     * It also handles sorting the search results by recent or popular.
     * @returns 
     */
    async realizarBusqueda() {
        if (this.busquedaTermino.trim() === '' && this.generoSeleccionado === null) {
            this.mostrandoBusqueda = false;
            return;
        }

        this.cargandoBusqueda = true;
        this.mostrandoBusqueda = true;

        try {
            let url = 'http://127.0.0.1:8000/api/artworks/';
            
            // Aply genre filter if selected
            if (this.generoSeleccionado !== null && this.generoSeleccionado !== 0) {
                url = `http://127.0.0.1:8000/api/artworks/genre/${this.generoSeleccionado}/?limit=100`;
            } else {
                url += '?limit=100';
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                let obras = this.mapearObras(data.artworks);

                // Filter by search term if provided
                if (this.busquedaTermino.trim()) {
                    const termino = this.busquedaTermino.toLowerCase();
                    obras = obras.filter(obra => 
                        obra.titulo.toLowerCase().includes(termino) ||
                        obra.descripcion.toLowerCase().includes(termino) ||
                        obra.autor_username.toLowerCase().includes(termino) ||
                        obra.generos_nombres.some(g => g.toLowerCase().includes(termino))
                    );
                }

                // Order results
                if (this.ordenarPor === 'populares') {
                    obras = obras.sort((a, b) => b.likes - a.likes);
                } else {
                    obras = obras.sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());
                }

                this.resultadosBusqueda = obras;
            }
        } catch (error) {
            console.error('Error en búsqueda:', error);
        } finally {
            this.cargandoBusqueda = false;
        }
    }

    /** Clear the search term, reset the genre filter, and hide the search results.
     * This function is called when the user clicks on the "Limpiar búsqueda" button, allowing them to reset their search criteria and return to the default home page view.
     * @returns 
     */
    limpiarBusqueda() {
        this.busquedaTermino = '';
        this.generoSeleccionado = null;
        this.mostrandoBusqueda = false;
        this.resultadosBusqueda = [];
    }

    /**
     * Change the selected genre filter for the search and trigger a new search with the updated filter.
     * This function is called when the user selects a different genre from the dropdown, allowing them to refine their search results based on the chosen genre.
     * @param generoId 
     */
    cambiarGeneroFiltro(generoId: number) {
        this.generoSeleccionado = this.generoSeleccionado === generoId ? null : generoId;
        this.realizarBusqueda();
    }

    /** 
     * Change the sorting order for the search results and trigger a new search with the updated order.
     * This function is called when the user selects a different sorting option (recent or popular) from the dropdown, allowing them to view their search results in the desired order.
     * @param orden 
     */
    cambiarOrden(orden: 'reciente' | 'populares') {
        this.ordenarPor = orden;
        if (this.mostrandoBusqueda) {
            this.realizarBusqueda();
        }
    }

    // Toggle the visibility of the search and filter section on the home page. This function is called when the user clicks on the "Buscar obras" button, allowing them to show or hide the search and filter options for a cleaner interface when not searching.
    toggleSearchSection() {
        this.searchSectionCollapsed = !this.searchSectionCollapsed;
    }

    // Handle the like/unlike action for an artwork. This function is called when the user clicks on the like button for an artwork, allowing them to like or unlike the artwork and updating the like count accordingly.
    async toggleLike(obra: Artwork) {
        const token = localStorage.getItem('access_token');
        
        if (!token) {
            // Show login pop-up if user is not authenticated
            this.loginPopupService.open();
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/artworks/${obra.id}/like/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                obra.likes = data.likes;
            }
        } catch (error) {
            console.error('Error al dar like:', error);
        }
    }

    // Pagination logic for the modal displaying artworks in a section. This function calculates the artworks to be displayed on the current page of the modal based on the total artworks and the defined number of artworks per page.
    get contarObrasPorFila(): number {
        return 3;
    }

    // Calculate the artworks to be displayed on the current page of the modal based on pagination.
    get filasObrasModal(): number {
        return Math.ceil(this.obrasPaginadas.length / this.contarObrasPorFila);
    }
}
