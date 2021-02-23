import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { UploadService } from './../upload.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  $download:Observable<any>
  constructor(public upload:UploadService, public router:Router) { }
  file:string
  data:any;
  ngOnInit(): void {
    this.file = localStorage.getItem("name")
  }
  getSheet(){
  
  this.upload.getFile(this.file).subscribe(data =>{ 
    var url = window.URL.createObjectURL(data);
        window.open(url);
    this.router.navigate([""])
        }
  )
}
      
}


