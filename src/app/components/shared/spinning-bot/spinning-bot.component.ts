import { Component, Input, OnInit, Optional, Inject, ChangeDetectorRef } from '@angular/core';



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
    styleUrls: ['./spinning-bot.component.css'],
    standalone: false
}) 


export class SpinningBotComponent implements OnInit {
  title:string
  dialogOption:string
  paymentMsg:string = "Building sides for: "
  response:any
  modalData: ModalData
  error?:ServerError
 

  ngOnInit(): void {}
}

  


   

