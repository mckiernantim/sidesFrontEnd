import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddWatermarkComponent } from './add-watermark.component';
import { EventEmitter } from '@angular/core';

describe('AddWatermarkComponent', () => {
  let component: AddWatermarkComponent;
  let fixture: ComponentFixture<AddWatermarkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddWatermarkComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddWatermarkComponent);
    component = fixture.componentInstance;
    component.waterMarkUpdate = new EventEmitter<string>();
    component.addWaterMark = () => {}
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit watermark value', () => {
    const emitSpy = jest.spyOn(component.waterMarkUpdate, 'emit');
    const testWatermark = 'Test Watermark';

    component.waterMark = testWatermark;
    component.emitValue();

    expect(emitSpy).toHaveBeenCalledWith(testWatermark);
  });

  it('should toggle displayWaterMark', () => {
    component.displayWaterMark = false;

    component.toggleDisplayWaterMark();

    expect(component.displayWaterMark).toBeTruthy();

    component.toggleDisplayWaterMark();

    expect(component.displayWaterMark).toBeFalsy();
  });

  it('should initialize waterMark as null', () => {
    expect(component.waterMark).toBeNull();
  });

  it('should initialize displayWaterMark as undefined', () => {
    expect(component.displayWaterMark).toBeUndefined();
  });

  it('should have an addWaterMark function defined', () => {
    expect(typeof component.addWaterMark).toEqual('function');
  });
});
