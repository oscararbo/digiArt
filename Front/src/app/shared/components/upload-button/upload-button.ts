import { Component, inject } from '@angular/core';
import { UploadModalService } from '../../services/upload-modal.service';

@Component({
    selector: 'app-upload-button',
    templateUrl: './upload-button.html',
    styleUrl: './upload-button.scss',
    standalone: true
})
export class UploadButton {
    isHovering: boolean = false;
    private uploadModalService = inject(UploadModalService);

    abrirModal() {
        this.uploadModalService.abrirModal();
    }

    onMouseEnter() {
        this.isHovering = true;
    }

    onMouseLeave() {
        this.isHovering = false;
    }
}
