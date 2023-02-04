import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FeedbackTicket } from 'src/app/feedback/feedbackTicket';


@Component({
  selector: 'app-admin-main',
  templateUrl: './admin-main.component.html',
  styleUrls: ['./admin-main.component.css']
})
export class AdminMainComponent {
  @Input() selected:FeedbackTicket;
  @Output() updateSelected = new EventEmitter();


  updateSelectedTicket(val) {
    this.updateSelected.emit(val)
  }
  
}
