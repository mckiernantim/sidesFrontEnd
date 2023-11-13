import { Component, Input, Output,EventEmitter } from '@angular/core';

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

  @Input() data:toolTipOption[];
  @Output() toolTipButton: EventEmitter<string> = new EventEmitter<string>(); 

}
