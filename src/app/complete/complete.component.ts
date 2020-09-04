import { UploadService } from './../upload.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-complete',
  templateUrl: './complete.component.html',
  styleUrls: ['./complete.component.css']
})
export class CompleteComponent implements OnInit {
name:string = localStorage.getItem("name")

  constructor( public upload:UploadService) { }


  ngOnInit(): void {

this.downloadPDF()
 
  }
downloadPDF():void{

    this.upload.getPDF(this.name).subscribe(data => {
    var url = window.URL.createObjectURL(data);
    window.open(url);
})
}
}
