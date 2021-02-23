import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DualDialogComponent } from './dual-dialog.component';

describe('DualDialogComponent', () => {
  let component: DualDialogComponent;
  let fixture: ComponentFixture<DualDialogComponent>;

  beforeEach(async(() => {
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
