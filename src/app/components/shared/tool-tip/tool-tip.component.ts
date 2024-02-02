import { Component, Input, Output,EventEmitter, HostListener } from '@angular/core';


interface toolTipOption  {
  title:string;
  text:string,
  ind:number
}

@Component({
  selector: 'app-tool-tip',
  templateUrl: './tool-tip.component.html',
  styleUrls: ['./tool-tip.component.css']
})

export class ToolTipComponent {
  windowWidth:number 
  constructor() {
    this.windowWidth = window.innerWidth;
  }
  @HostListener('window:resize', ['$event']) 
  onesize(event){
    this.windowWidth = event.target.windowWidth
  }
  
  @Input() data:toolTipOption[];
  @Output() buttonAction: EventEmitter<string> = new EventEmitter<string>(); 

log(str) {
 alert(str)
}
}
