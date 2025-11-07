import { Component, isDevMode } from '@angular/core';
import { getConfig } from '../../../../environments/environment';

@Component({
    selector: 'app-nav',
    templateUrl: './nav.component.html',
    styleUrls: ['./nav.component.css'],
    standalone: false
})
export class NavComponent {
  maintenanceMode = false;

  constructor() {
    const config = getConfig(!isDevMode());
    this.maintenanceMode = !!config.maintenanceMode;
  }
}
