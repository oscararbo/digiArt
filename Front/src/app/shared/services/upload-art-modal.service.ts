import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UploadArtModalService {
    private isModalOpenSubject = new BehaviorSubject<boolean>(false);
    public isModalOpen$: Observable<boolean> = this.isModalOpenSubject.asObservable();

    openModal() {
        this.isModalOpenSubject.next(true);
    }

    closeModal() {
        this.isModalOpenSubject.next(false);
    }

    isOpen(): boolean {
        return this.isModalOpenSubject.value;
    }
}
