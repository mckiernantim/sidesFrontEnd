import { Component, OnInit } from '@angular/core';
import { formatCentsPrecise, getPriceCatalog } from '../../utils/founders-offer';

@Component({
  selector: 'app-terms-of-service',
  templateUrl: './terms-of-service.component.html',
  styleUrls: ['./terms-of-service.component.css'],
  standalone: false
})
export class TermsOfServiceComponent implements OnInit {
  lastUpdated = 'July 31, 2026';
  weeklyPrice = '';
  monthlyPrice = '';
  foundersWeeklyPrice = '';
  foundersMonthlyPrice = '';

  ngOnInit(): void {
    const catalog = getPriceCatalog();
    this.weeklyPrice = formatCentsPrecise(catalog.standardWeeklyCents);
    this.monthlyPrice = formatCentsPrecise(catalog.standardMonthlyCents);
    this.foundersWeeklyPrice = formatCentsPrecise(catalog.foundersWeeklyCents);
    this.foundersMonthlyPrice = formatCentsPrecise(catalog.foundersMonthlyCents);
  }
}
