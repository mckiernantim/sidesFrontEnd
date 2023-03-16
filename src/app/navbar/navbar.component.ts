import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  options: any[] = []
  @ViewChild('homeButton') homeButton: ElementRef;
  constructor( public auth: AuthService) {
    this.options = [{
      text: "Home",
    selected: true
    }, {
      text: "About",
    selected: false    }, {
      text: "Donate",
    selected: false
    }];
    this.homeButton

  }
  toggleHidden(num) {
    // this.options[num] = this.toggle(this.options[num])
  }

  toggle(target){
    return target.selected ? false : true
  }
  ngOnInit(): void {

  }

}
