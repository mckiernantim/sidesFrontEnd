import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LastLooksComponent } from './last-looks.component';

describe('LastLooksComponent', () => {
  let component: LastLooksComponent;
  let fixture: ComponentFixture<LastLooksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LastLooksComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LastLooksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
