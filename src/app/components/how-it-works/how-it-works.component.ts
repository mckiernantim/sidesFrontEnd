import { Component } from '@angular/core';
import { fadeInOutAnimation } from '../../animations/animations';

@Component({
  selector: 'app-how-it-works',
  templateUrl: './how-it-works.component.html',
  styleUrls: ['./how-it-works.component.css'],
  animations: [fadeInOutAnimation],
  standalone: false
})
export class HowItWorksComponent {
  steps: { title: string; body: string }[] = [
    {
      title: 'Upload Your Script',
      body: 'Upload a PDF - preferably Final Draft or Celx format. Our system scans it, removes any sensitive IP information, and routes you to scene selection.'
    },
    {
      title: 'Select Your Scenes',
      body: 'Choose any scenes you want to shoot that day from a filterable list. Search by location, page number, or any other criteria to quickly find what you need.'
    },
    {
      title: 'Last Looks & Customization',
      body: 'Proof and edit your document before submitting. Need a callsheet? Upload it. Add watermarks - we\'ve got you covered. Something seem off? We offer full editing of your sides before generation.'
    },
    {
      title: 'Get Your Sides & Go',
      body: 'Get your professionally formatted sides and head to set. Your document is automatically deleted 10 minutes after completion or as soon as you request. That\'s it!'
    }
  ];
} 