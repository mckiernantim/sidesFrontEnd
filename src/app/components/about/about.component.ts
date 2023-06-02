import { Component, OnInit } from '@angular/core';
import { Blurb, blurbs } from './aboutText';
@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {

  constructor() { 
    
  }
    blurbs:Blurb[] = blurbs
  ngOnInit(): void {
  }

}
