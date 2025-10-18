import { Component } from '@angular/core';

@Component({
    selector: 'app-about-item-grid',
    templateUrl: './about-item-grid.component.html',
    styleUrls: ['./about-item-grid.component.css'],
    standalone: false
})
export class AboutItemGridComponent {
  titles: string[] = [`Scan Securely`, ` Select Scenes`, `Last Looks`];
  images: string[] = [
    `../../../../../assets/icons/bot-about-images/scan-bot.jpg`,
    `../../../../../assets/icons/bot-about-images/select-bot.jpg`,
    `../../../../../assets/icons/bot-about-images/happy-bot.jpg`,
  ];
  content: string[] = [
    `Your script is scanned, returned, 
    <br>
    and instantly deleted from our servers. 
    <br>
    We're backed by Google for added peace of mind. 
    <br>
    Nothing is saved — ever.`,

    `Select what your shooting and we'll do the rest.
    <br>
   Need a callsheet?  Add one.  Watermarks? No problem. 
    <br>Everything you need.
    Easy.`,

    `Preview your sides before payment.  
    <br>
    Secure in browser editing for any last minute changes
    <br>
    Your Download is encrypted.
    <br>
    Everything deleted in 10 minutes - tops.
    <br>
    And nothing is saved — ever.
  `,


  ];
}
