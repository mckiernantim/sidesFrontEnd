import { Component, EventEmitter, Output, Input} from '@angular/core';

export interface WatermarkData {
  actorName: string;
  castingDirector?: string;
}

@Component({
    selector: 'app-add-watermark',
    templateUrl: './add-watermark.component.html',
    styleUrls: ['./add-watermark.component.css'],
    standalone: false
})
export class AddWatermarkComponent {
  displayWaterMark: boolean = false;
  waterMark: string = null;
  castingDirector: string = null;
  addWaterMark: Function;
  @Input() hasWatermark: boolean = false;
  @Input() showCastingDirector: boolean = false; // Show casting director input when in casting mode
  @Output() waterMarkUpdate = new EventEmitter<string | WatermarkData>();
  @Output() waterMarkRemove = new EventEmitter<void>();

  emitValue() {
    // Emit the watermark value (null if empty)
    const watermarkValue = this.waterMark && this.waterMark.trim() ? this.waterMark.trim() : null;
    
    // If casting director is provided, emit an object with both values
    if (this.showCastingDirector && this.castingDirector && this.castingDirector.trim()) {
      const data: WatermarkData = {
        actorName: watermarkValue,
        castingDirector: this.castingDirector.trim()
      };
      this.waterMarkUpdate.emit(data as any);
    } else {
      this.waterMarkUpdate.emit(watermarkValue);
    }
  }

  removeWatermark() {
    this.waterMark = null;
    this.castingDirector = null;
    this.waterMarkRemove.emit();
  }

  toggleDisplayWaterMark() {
    this.displayWaterMark = !this.displayWaterMark;
  }
}


