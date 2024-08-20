import { Component, Input, OnInit, Optional, Inject, ChangeDetectorRef } from '@angular/core';
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
  paymentMsg:string = "Building sides for: "
  error:ServerError
  constructor(@Optional() 
  @Inject(MAT_DIALOG_DATA) public data: ModalData, public cd:ChangeDetectorRef) {
    if (data) {
      const { title, dialogOption, error } = data;
      this.paymentMsg += title
      this.title = title;
      this.dialogOption = dialogOption; 
      this.error = error || { message:"Unknown server error", code : 500 }
      
      setTimeout(() => {
        this.paymentMsg = `Rerouting to payment - sit tight`;
        this.cd.detectChanges()
      }, 1200);
      
    }
  }

  ngOnInit(): void {}
}

  


   

