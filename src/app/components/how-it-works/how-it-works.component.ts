import { Component } from '@angular/core';
import { fadeInOutAnimation } from '../../animations/animations';

@Component({
  selector: 'app-how-it-works',
  templateUrl: './how-it-works.component.html',
  styleUrls: ['./how-it-works.component.css'],
  animations: [fadeInOutAnimation],
  standalone: false
})
export class HowItWorksComponent {
  // Simple component with no complex logic
} 