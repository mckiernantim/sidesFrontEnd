import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-testimonial-item',
    templateUrl: './testimonial-item.component.html',
    styleUrls: ['./testimonial-item.component.css'],
    standalone: false
})
export class TestimonialItemComponent {
  @Input()film:string;
  @Input()poster:string;
}
