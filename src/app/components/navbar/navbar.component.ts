import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { TokenService } from 'src/app/services/token/token.service';
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  options: any[] = []
  countdown:number = -Infinity;
  @ViewChild('homeButton') homeButton: ElementRef;
  constructor( public auth: AuthService, public token:TokenService) {
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
    this.token.getCountdown().subscribe(countdown => this.countdown = countdown)
  } 

}
