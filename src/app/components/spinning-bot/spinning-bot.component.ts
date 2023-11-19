import { Component, Input, OnInit, Inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-spinning-bot',
  templateUrl: './spinning-bot.component.html',
  styleUrls: ['./spinning-bot.component.css']
})
export class SpinningBotComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public title: string ){

  }

  ngOnInit(): void {
    console.log(this.title)
  }

}
