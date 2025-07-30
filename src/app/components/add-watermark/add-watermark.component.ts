import { Component, EventEmitter, Output} from '@angular/core';

@Component({
    selector: 'app-add-watermark',
    templateUrl: './add-watermark.component.html',
    styleUrls: ['./add-watermark.component.css'],
    standalone: false
})
export class AddWatermarkComponent {
  displayWaterMark: boolean = false;
  waterMark: string = null;
  addWaterMark: Function;
  @Output() waterMarkUpdate = new EventEmitter<string>();
  @Output() waterMarkRemove = new EventEmitter<void>();

  emitValue() {
    // Emit the watermark value (null if empty)
    const watermarkValue = this.waterMark && this.waterMark.trim() ? this.waterMark.trim() : null;
    this.waterMarkUpdate.emit(watermarkValue);
  }

  removeWatermark() {
    this.waterMark = null;
    this.waterMarkRemove.emit();
  }

  toggleDisplayWaterMark() {
    this.displayWaterMark = !this.displayWaterMark;
  }
}


