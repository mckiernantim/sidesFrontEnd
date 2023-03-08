import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { AdminSideBarComponent } from './admin-side-bar.component';
import { FeedbackTicket } from 'src/app/feedback/feedbackTicket';

describe('AdminSideBarComponent', () => {
  let component: AdminSideBarComponent;
  let fixture: ComponentFixture<AdminSideBarComponent>;
  let debugElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminSideBarComponent ],
      imports: [ MatCardModule ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminSideBarComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a card for each ticket', () => {
    const tickets: FeedbackTicket[] = [
      { id: 1, name: 'Ticket 1', description: 'Description 1', status: 'Not handled' },
      { id: 2, name: 'Ticket 2', description: 'Description 2', status: 'Not handled' },
      { id: 3, name: 'Ticket 3', description: 'Description 3', status: 'Not handled' }
    ];
    component.tickets = tickets;
    fixture.detectChanges();
    const cards = debugElement.queryAll(By.directive(MatCard));
    expect(cards.length).toBe(tickets.length);
  });

  it('should emit a click event when a card is clicked', () => {
    const ticket: FeedbackTicket = { id: 1, name: 'Ticket 1', description: 'Description 1', status: 'Not handled' };
    spyOn(component.handleClick, 'emit');
    component.selectNewTicket(ticket);
    expect(component.handleClick.emit).toHaveBeenCalledWith(ticket);
  });
});
