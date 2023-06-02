import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DualDialogComponent } from './dual-dialog.component';
import 'jasmine'

describe('DualDialogComponent', () => {
  let component: DualDialogComponent;
  let fixture: ComponentFixture<DualDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DualDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DualDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
