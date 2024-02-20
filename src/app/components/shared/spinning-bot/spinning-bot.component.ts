import { Component, Input, OnInit, Optional, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-spinning-bot',
  templateUrl: './spinning-bot.component.html',
  styleUrls: ['./spinning-bot.component.css']
})
export class SpinningBotComponent implements OnInit {
  @Input() title: string;

  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public injectedTitle: string) {
    if (injectedTitle) {
      this.title = injectedTitle;
    }
  }

  ngOnInit(): void {
    console.log(this.title);
  }
}
