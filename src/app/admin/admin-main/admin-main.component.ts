import { Component, Input, Output } from '@angular/core';
import { FeedbackTicket } from 'src/app/feedback/feedbackTicket';
import { EventEmitter } from 'stream';

@Component({
  selector: 'app-admin-main',
  templateUrl: './admin-main.component.html',
  styleUrls: ['./admin-main.component.css']
})
export class AdminMainComponent {
  @Input() selected:FeedbackTicket;
  @Output() updateSelected = new EventEmitter();


  updateSelectedTicket(updatedValue) {

    this.updateSelected.emit(updatedValue)
  }
}
