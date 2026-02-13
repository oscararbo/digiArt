import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UploadModalService {
    private modalAbierto$ = new BehaviorSubject<boolean>(false);
    public modalAbierto = this.modalAbierto$.asObservable();

    constructor() {}

    abrirModal() {
        this.modalAbierto$.next(true);
    }

    cerrarModal() {
        this.modalAbierto$.next(false);
    }

    toggle() {
        this.modalAbierto$.next(!this.modalAbierto$.value);
    }

    obtenerEstado(): boolean {
        return this.modalAbierto$.value;
    }
}
