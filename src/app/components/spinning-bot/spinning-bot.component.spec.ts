import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpinningBotComponent } from './spinning-bot.component';

describe('SpinningBotComponent', () => {
  let component: SpinningBotComponent;
  let fixture: ComponentFixture<SpinningBotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SpinningBotComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SpinningBotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
