import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-text-block',
  templateUrl: './text-block.component.html',
  styleUrls: ['./text-block.component.css']
})
export class TextBlockComponent implements OnInit {
  @Input()image:string;
  @Input()text:string
  @Input()align:string;
  constructor() { }

  ngOnInit(): void {
  }

}
