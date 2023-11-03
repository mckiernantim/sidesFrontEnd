import { Component } from '@angular/core';
import { environment } from '../environments/environment';
import { NavComponent } from './components/shared/nav/nav.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'sideWays';
}
