import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-cookie-policy',
  templateUrl: './cookie-policy.component.html',
  styleUrls: ['./cookie-policy.component.css'],
  standalone: false
})
export class CookiePolicyComponent implements OnInit {
  lastUpdated = 'April 23, 2026';
  ngOnInit(): void {}
}
