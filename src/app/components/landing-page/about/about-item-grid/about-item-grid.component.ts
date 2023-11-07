import { Component } from '@angular/core';
import { AboutItemComponent } from '../about-item/about-item.component';

@Component({
  selector: 'app-about-item-grid',
  templateUrl: './about-item-grid.component.html',
  styleUrls: ['./about-item-grid.component.css'],
})
export class AboutItemGridComponent {
  titles: string[] = [`Scan Securely`, ` Select Scenes`, `Last Looks`];
  images: string[] = [
    `../../../../../assets/icons/bot-about-images/scan-bot.jpg`,
    `../../../../../assets/icons/bot-about-images/select-bot.jpg`,
    `../../../../../assets/icons/bot-about-images/happy-bot.jpg`,
  ];
  content: string[] = [
    `Your script is scanned, returned, and instantly deleted. We're backed by Google for added peace of mind. 
    <br>
    Nothing is saved — ever.`,
    `  We make your sides.
    <br>
    Need a cover page? Upload it. 
    <br>
    Watermarks? No problem. 
    <br>Everything you need.

    Easy.`,
    `Secure in-browser editing to confirm your sides.  
    <br>
    Your Download is encrypted.
    <br>Any record of your sides are deleted.
    <br>
   And nothing is saved — ever.
`,
  ];
}
