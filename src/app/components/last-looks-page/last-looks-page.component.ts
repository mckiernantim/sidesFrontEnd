import { Component } from '@angular/core';
import { Input } from '@angular/core';
@Component({
  selector: 'app-last-looks-page',
  templateUrl: './last-looks-page.component.html',
  styleUrls: ['./last-looks-page.component.css']
})
export class LastLooksPageComponent {
  @Input() page: any;
}
