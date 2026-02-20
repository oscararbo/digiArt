import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UploadModalService {
    private isModalOpenSubject = new BehaviorSubject<boolean>(false);
    public isModalOpen$ = this.isModalOpenSubject.asObservable();

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
