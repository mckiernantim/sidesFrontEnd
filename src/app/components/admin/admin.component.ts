import { Component, OnInit } from '@angular/core';
import { UploadService } from './../../services/upload/upload.service';
import { FeedbackTicket } from '../../types/feedbackTicket';
import { Observable, Subscription } from 'rxjs';
import { MatCard } from '@angular/material/card';
import { Router } from '@angular/router';
import { FeedbackService } from '../../services/feedback/feedback.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  Feedback$: Observable<FeedbackTicket[]>;
  badTix: any;
  upload: UploadService;
  selected: FeedbackTicket;
  tickets: Subscription;
  allTickets: FeedbackTicket[];
  displayedTickets: FeedbackTicket[];
  constructor(
    public feedback: FeedbackService,
    public router: Router,
    public dialog: MatDialog
  ) {
    // This IS the data stream completely - mroe complex than just data
    this.Feedback$ = this.feedback.$feedback;
    // this IS thea actual json DATA we need
    this.tickets = this.Feedback$.subscribe((data) => {
      this.selected = data[0];
      this.allTickets = data.sort((a, b) => {
        const timestampA = new Date(a.date).getTime();
        const timestampB = new Date(b.date).getTime();
        return timestampA - timestampB;
      });
      this.displayedTickets = this.allTickets;
    });
  }

  ngOnInit() {}

  filterTickets(val = null) {
    this.displayedTickets = val
      ? this.allTickets.filter((ticket) => {
          ticket.category === val;
        })
      : this.allTickets;
  }
  selectNewTicket(event) {
    this.selected = event;
    console.log(event, 'parent is triggering');
  }
  updateSelectedTicket(event) {
    alert('update');
    console.log(event);
    // this.feedback.updateTicket()
  }

  createTicket(ticket: FeedbackTicket): void {
    // Add the new ticket to the database
    this.upload._db
      .collection('feedbackTickets')
      .add(ticket)
      .then(() => {
        // Show success message and redirect to the admin page
        alert('Ticket created successfully!');
        this.router.navigate(['/admin']);
      })
      .catch((error) => {
        // Show error message
        console.error('Error creating ticket: ', error);
        alert(
          'An error occurred while creating the ticket. Please try again later.'
        );
      });
  }
  updateTicket(ticket: FeedbackTicket): void {
    // Update the ticket in the database
    this.upload._db
      .collection('feedbackTickets')
      .doc(ticket.id)
      .update(ticket)
      .then(() => {
        // Show success message and redirect to the admin page
        alert('Ticket updated successfully!');
        this.router.navigate(['/admin']);
      })
      .catch((error) => {
        // Show error message
        console.error('Error updating ticket: ', error);
        alert(
          'An error occurred while updating the ticket. Please try again later.'
        );
      });
  }

  deleteSelectedTicket(event): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: `Are you sure you want to delete ticket ${event.title} from ${event.email}?`,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'confirm') {
        this.feedback.deleteTicket(event.id);
      }
    });
  }
}
