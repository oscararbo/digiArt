import { Component, Input, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-collapsible-sidebar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './collapsible-section.html',
    styleUrls: ['./collapsible-section.scss']
})
export class CollapsibleSidebar {
    @Input() position: 'left' | 'right' = 'left';
    @Input() title: string = '';
    @Input() icon: string = '';
    @Input() expandedSignal!: WritableSignal<boolean>;
    @Input() hasBottomActions: boolean = false;
    @Input() sidebarClass: string = '';
    @Input() overlay: boolean = true;

// #region STATE HELPERS

    sidebarClasses() {
        const overlayClass = this.overlay ? 'overlay-sidebar' : 'inline-sidebar';
        return `collapsible-sidebar ${overlayClass} ${this.position}-sidebar ${this.sidebarClass}`.trim();
    }

    isExpanded() {
        return this.expandedSignal();
    }

    toggle() {
        this.expandedSignal.set(!this.isExpanded());
    }
// #endregion
}
