import { Component, Input, OnInit, Optional, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';


type ServerError = {
  message:string;
  code:number;
}
interface ModalData {
  title:string,
  dialogOption:string,
  selected?:string[],
  error?:ServerError
}
@Component({
  selector: 'app-spinning-bot',
  templateUrl: './spinning-bot.component.html',
  styleUrls: ['./spinning-bot.component.css']
}) 


export class SpinningBotComponent implements OnInit {
  title:string
  dialogOption:string
  error:ServerError
  constructor(@Optional() 
  @Inject(MAT_DIALOG_DATA) public data: ModalData) {
    if (data) {
      const { title, dialogOption, error } = data;
      console.log(error)
      this.title = title;
      this.dialogOption = dialogOption;
      this.error = error
    }
  }

  ngOnInit(): void {
  }
}
