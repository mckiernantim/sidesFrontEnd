import { Component, Input } from '@angular/core';

export interface Scene {
  number: number;
  title: string;
}

@Component({
  selector: 'app-checkout',
  template: `
    <section>
      <div>
        <h2>{{ title }}</h2>
      </div>
      <ng-container *ngFor="let scene of scenes">
        <p>scene number: {{ scene.number }} - {{ scene.title }}</p>
      </ng-container>
    </section>
  `,
  styleUrls: ['./checkout.component.css']
})

export class CheckoutComponent {
  @Input() title: string;
  @Input() scenes: Scene[];
}
