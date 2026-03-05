import { Component, inject } from '@angular/core';
import { UploadModalService } from '../../services/upload-modal.service';
import { LoginPopupService } from '../../services/login-popup.service';

@Component({
    selector: 'app-upload-button',
    templateUrl: './upload-button.html',
    styleUrl: './upload-button.scss',
    standalone: true
})
export class UploadButton {
    isHovering: boolean = false;
    private uploadModalService = inject(UploadModalService);
    private loginPopupService = inject(LoginPopupService);

// #region UPLOAD ACTIONS

    openModal() {
        const token = localStorage.getItem('access_token');
        if (!token) {
            this.loginPopupService.open();
            return;
        }
        this.uploadModalService.openModal();
    }

// #endregion
// #region UI INTERACTIONS

    onMouseEnter() {
        this.isHovering = true;
    }

    onMouseLeave() {
        this.isHovering = false;
    }
// #endregion
}
