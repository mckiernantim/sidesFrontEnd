import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FeedbackTicket } from 'src/app/types/feedbackTicket';
import { MatCard } from '@angular/material/card';


@Component({
  selector: 'app-admin-side-bar',
  templateUrl: './admin-side-bar.component.html',
  styleUrls: ['./admin-side-bar.component.css']
})
export class AdminSideBarComponent {
  @Input() tickets: FeedbackTicket[];
  @Output() handleClick = new EventEmitter();

  selectNewTicket(ticket) {
    this.handleClick.emit(ticket)
  }
}
