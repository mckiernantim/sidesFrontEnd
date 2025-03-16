import { Component, Input, OnInit, Optional, Inject, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';


type ServerError = {
  message:string;
  code:number;
  type:string;
}
interface ModalData {
  title:string,
  dialogOption:string,
  selected?:string[],
  response?:any,
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
  paymentMsg:string = "Building sides for: "
  response:any
  error?:ServerError
  constructor(@Optional() 
  @Inject(MAT_DIALOG_DATA) public data: ModalData, public cd:ChangeDetectorRef) {
    if (data) {
      const { title, dialogOption, response } = data;
      this.paymentMsg += title
      this.title = title;
      this.dialogOption = dialogOption; 
  
      this.error = response?.error || { message:"Unknown server error", code : 500 }
      
      setTimeout(() => {
        this.paymentMsg = `Rerouting to payment - sit tight`;
        this.cd.detectChanges()
      }, 1200);
      
    }
  }

  ngOnInit(): void {}
}

  


   

