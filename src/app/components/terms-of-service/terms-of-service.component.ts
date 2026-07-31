import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-terms-of-service',
  templateUrl: './terms-of-service.component.html',
  styleUrls: ['./terms-of-service.component.css'],
  standalone: false
})
export class TermsOfServiceComponent implements OnInit {
  lastUpdated = 'April 23, 2026';
  ngOnInit(): void {}
}
