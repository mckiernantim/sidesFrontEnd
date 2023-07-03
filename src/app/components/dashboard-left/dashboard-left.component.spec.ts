import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DashboardLeftComponent } from './dashboard-left.component';

describe('DashboardLeftComponent', () => {
  let component: DashboardLeftComponent;
  let fixture: ComponentFixture<DashboardLeftComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DashboardLeftComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardLeftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
