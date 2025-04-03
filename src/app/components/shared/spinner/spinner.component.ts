import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  template: `
    <div class="flex justify-center items-center">
      <img 
        [src]="imagePath" 
        [alt]="altText" 
        class="w-24 h-24 animate-spin"
        [ngStyle]="{'animation-duration': speed + 's'}"
      >
    </div>
  `,
  standalone: false
})
export class SpinnerComponent {
  @Input() imagePath: string = 'assets/icons/logoBot.png';
  @Input() altText: string = 'Loading...';
  @Input() speed: number = 3; // Animation duration in seconds
} 