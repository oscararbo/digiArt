import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UploadArtModalService {
    private mostrarModalSubject = new BehaviorSubject<boolean>(false);
    public mostrarModal$: Observable<boolean> = this.mostrarModalSubject.asObservable();

    abrirModal() {
        this.mostrarModalSubject.next(true);
    }

    cerrarModal() {
        this.mostrarModalSubject.next(false);
    }

    estaAbierto(): boolean {
        return this.mostrarModalSubject.value;
    }
}
