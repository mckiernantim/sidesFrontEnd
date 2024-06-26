 import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { UploadService } from '../../services/upload/upload.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  $download:Observable<any>
  constructor(public upload:UploadService, public router:Router) { }
  file:string | null
  data:any;
  ngOnInit(): void {
    this.file = localStorage.getItem("name") || null
}
  getSheet() {
      this.upload.getFile(this.file).subscribe(data => {
      var url = window.URL.createObjectURL(data);
      window.open(url);
      this.router.navigate([""])
    }
  )
}

}


