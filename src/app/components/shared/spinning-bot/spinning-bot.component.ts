import { Component, Input, OnInit, Optional, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

interface ModalData {
  title:string,
  dialogOption:string
}
@Component({
  selector: 'app-spinning-bot',
  templateUrl: './spinning-bot.component.html',
  styleUrls: ['./spinning-bot.component.css']
}) 

export class SpinningBotComponent implements OnInit {
  title:string
  dialogOption:string
  constructor(@Optional() 
  @Inject(MAT_DIALOG_DATA) public data: any) {
    if (data) {
      console.log(data)
      const { title, dialogOption } = data
      this.title = title;
      this.dialogOption = dialogOption
    }
    console.log(data)
  }

  ngOnInit(): void {
    console.log(this.title);
  }
}
