import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LastLooksPageComponent } from './last-looks-page.component';

describe('LastLooksPageComponent', () => {
  let component: LastLooksPageComponent;
  let fixture: ComponentFixture<LastLooksPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LastLooksPageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LastLooksPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
