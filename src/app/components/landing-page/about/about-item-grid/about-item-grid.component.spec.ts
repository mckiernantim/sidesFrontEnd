import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutItemGridComponent } from './about-item-grid.component';

describe('AboutItemGridComponent', () => {
  let component: AboutItemGridComponent;
  let fixture: ComponentFixture<AboutItemGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AboutItemGridComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AboutItemGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
