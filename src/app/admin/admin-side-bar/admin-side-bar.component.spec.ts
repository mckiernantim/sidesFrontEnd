import { ComponentFixture, TestBed } from '@angular/core/testing';
import 'jasmine'
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { MatCardModule, MatCard } from '@angular/material/card';
import { AdminSideBarComponent } from './admin-side-bar.component';
import { FeedbackTicket } from 'src/app/types/feedbackTicket';

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
      { id: '1', title: 'Ticket 1', text: 'text 1', handled: false, category:"stuff", date:"today" },
      { id: '2', title: 'Ticket 2', text: 'text 2', handled: false, category:"stuff", date:"today" },
      { id: '3', title: 'Ticket 3', text: 'text 3', handled: false, category:"stuff", date:"today" }
    ];
    component.tickets = tickets;
    fixture.detectChanges();
    const cards = debugElement.queryAll(By.directive(MatCard));
    expect(cards.length).toBe(tickets.length);
  });

  it('should emit a click event when a card is clicked', () => {
    const ticket: FeedbackTicket = { id: '1', title: 'Ticket 1', text: 'text 1', handled: false, category:"stuff", date:"today" };
    spyOn(component.handleClick, 'emit');
    component.selectNewTicket(ticket);
    expect(component.handleClick.emit).toHaveBeenCalledWith(ticket);
  });
});
