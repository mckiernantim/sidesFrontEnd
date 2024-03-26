import { Component,Input } from '@angular/core';

@Component({
  selector: 'app-feature-card',
  templateUrl: './feature-card.component.html',
  styleUrls: ['./feature-card.component.css']
})
export class FeatureCardComponent {
  @Input()align:string;
  @Input()title:string;
  @Input()content:string;
  @Input()tagLine:string;
  

}

