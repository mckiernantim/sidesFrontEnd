import { Component, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'app-add-watermark',
  templateUrl: './add-watermark.component.html',
  styleUrls: ['./add-watermark.component.css']
})
export class AddWatermarkComponent {
  displayWaterMark: boolean;
  waterMark:string = null;
  addWaterMark: Function;
  @Output() waterMarkUpdate = new EventEmitter<string>();

  emitValue() {
    // get data from inpit';
    this.waterMarkUpdate.emit(this.waterMark);
  }
  toggleDisplayWaterMark () {
    this.displayWaterMark = !this.displayWaterMark;
  }
}


