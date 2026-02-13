import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArtCard } from '../../shared/components/art-card/art-card';
import { UploadButton } from '../../shared/components/upload-button/upload-button';
import { UploadArtForm } from '../../shared/components/upload-art-form/upload-art-form';

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
    secciones: HomeSection[] = [];
    todasGeneros: any[] = [];
    usuarioActual: any = null;
    
    // Estado de la sección de búsqueda
    searchSectionCollapsed: boolean = false;
    
    // Búsqueda y filtros
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

    constructor() {}

    ngOnInit() {
        this.cargarDatos();
    }

    cargarDatos(){
        this.obtenerUsuario();
        this.cargarGeneros();
        this.cargarSecciones();
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
                this.todasGeneros = this.filtrarGenerosVisuales(data.genres);
            }
        } catch (error) {
            console.error('Error cargando géneros:', error);
        }
    }

    filtrarGenerosVisuales(generos: any[]): any[] {
        const generosVisuales = ['Pintura', 'Fotografía', 'Ilustración', 'Diseño Gráfico', 'Arte Digital', 'Grabado', 'Cerámica', 'Escultura', 'Arquitectura'];
        return generos.filter(genero => generosVisuales.includes(genero.nombre));
    }

    async cargarSecciones() {
        // Obras destacadas
        const destacadas = await this.cargarObrasDestacadas();
        if (destacadas) {
            this.secciones.push(destacadas);
        }

        // Obras recientes
        const recientes = await this.cargarObrasRecientes();
        if (recientes) {
            this.secciones.push(recientes);
        }

        // Obras por género
        for (const genero of this.todasGeneros) {
            const obrasPorGenero = await this.cargarObrasPorGenero(genero.id, genero.nombre);
            if (obrasPorGenero) {
                this.secciones.push(obrasPorGenero);
            }
        }
    }

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

    cerrarModal() {
        this.modalActiva = false;
        this.modalSeccion = null;
        this.obrasPaginadas = [];
        // Recargar secciones para reflejar posibles cambios (ej. nuevo arte subido)
        this.cargarDatos();
    }

    async realizarBusqueda() {
        if (this.busquedaTermino.trim() === '' && this.generoSeleccionado === null) {
            this.mostrandoBusqueda = false;
            return;
        }

        this.cargandoBusqueda = true;
        this.mostrandoBusqueda = true;

        try {
            let url = 'http://127.0.0.1:8000/api/artworks/';
            
            // Aplicar filtros
            if (this.generoSeleccionado !== null && this.generoSeleccionado !== 0) {
                url = `http://127.0.0.1:8000/api/artworks/genre/${this.generoSeleccionado}/?limit=100`;
            } else {
                url += '?limit=100';
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                let obras = this.mapearObras(data.artworks);

                // Filtrar por término de búsqueda
                if (this.busquedaTermino.trim()) {
                    const termino = this.busquedaTermino.toLowerCase();
                    obras = obras.filter(obra => 
                        obra.titulo.toLowerCase().includes(termino) ||
                        obra.descripcion.toLowerCase().includes(termino) ||
                        obra.autor_username.toLowerCase().includes(termino) ||
                        obra.generos_nombres.some(g => g.toLowerCase().includes(termino))
                    );
                }

                // Ordenar
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

    limpiarBusqueda() {
        this.busquedaTermino = '';
        this.generoSeleccionado = null;
        this.mostrandoBusqueda = false;
        this.resultadosBusqueda = [];
    }

    cambiarGeneroFiltro(generoId: number) {
        this.generoSeleccionado = this.generoSeleccionado === generoId ? null : generoId;
        this.realizarBusqueda();
    }

    cambiarOrden(orden: 'reciente' | 'populares') {
        this.ordenarPor = orden;
        if (this.mostrandoBusqueda) {
            this.realizarBusqueda();
        }
    }

    toggleSearchSection() {
        this.searchSectionCollapsed = !this.searchSectionCollapsed;
    }

    async toggleLike(obra: Artwork) {
        if (!this.usuarioActual) {
            alert('Debes iniciar sesión para dar likes');
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
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

    get contarObrasPorFila(): number {
        return 3;
    }

    get filasObrasModal(): number {
        return Math.ceil(this.obrasPaginadas.length / this.contarObrasPorFila);
    }
}
