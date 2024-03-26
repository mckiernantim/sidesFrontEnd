import { Component, OnInit } from '@angular/core';
import { Blurb, blurbs } from './aboutText';
import { fadeInOutAnimation } from 'src/app/animations/animations';
@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css'],
  animations:[fadeInOutAnimation]
})
export class AboutComponent implements OnInit {

  constructor() { 
    
  }
    blurbs:Blurb[] = blurbs
    ngOnInit(): void {
  }

}
