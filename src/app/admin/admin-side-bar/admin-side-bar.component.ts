import { Component, Input } from '@angular/core';
import { FeedbackTicket } from 'src/app/feedback/feedbackTicket';

@Component({
  selector: 'app-admin-side-bar',
  templateUrl: './admin-side-bar.component.html',
  styleUrls: ['./admin-side-bar.component.css']
})
export class AdminSideBarComponent {
  @Input() tickets: FeedbackTicket[];
}
