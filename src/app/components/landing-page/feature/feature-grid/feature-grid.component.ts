import { Component } from '@angular/core';
import { FeatureCardComponent } from '../feature-card/feature-card.component';

@Component({
  selector: 'app-feature-grid',
  templateUrl: './feature-grid.component.html',
  styleUrls: ['./feature-grid.component.css'],
})
export class FeatureGridComponent {
  titles: string[] = [`Production`, `Casting`, `StudentFilms`];
  content: string[] = [
    `With Sides-Ways you can get set-ready sides, both Bigs and Smalls, complete with call-sheet, in a matter of minutes  <strong>with no subsrcription fees, and no accounts to sign up for</strong>.
   <br>Save time, save money, and get back on set.`,
    `With Sides-ways you can effortlessly upload your script and handpick the scenes required for auditions, edit the final documents quickly in the browser, even watermark the text. 
   <br>
      Save time, stay organized, and focus on finding the perfect talent for your project with ease.`,

    `   Broke film student? <br>
    Looking for a way to elevate your set? <br>
    Pro documents for your set  for about $5.00
    <br> We got your back.  Go make your movie.`,
  ];
}
