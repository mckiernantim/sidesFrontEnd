import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FeedbackTicket } from '../../..//types/feedbackTicket';



@Component({
  selector: 'app-admin-main',
  templateUrl: './admin-main.component.html',
  styleUrls: ['./admin-main.component.css']
})
export class AdminMainComponent {
  @Input() selected:FeedbackTicket;
  @Output() updateSelected = new EventEmitter();
  @Output() deleteSelected = new EventEmitter();
  updatedText: string;

  updateSelectedTicket(val) {
    this.updateSelected.emit(val)
  }
  deleteSelectedTicket(val) {
   
    this.deleteSelected.emit(val)
  }

}
