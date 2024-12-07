import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [],
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.css'
})
export class PaymentSuccessComponent implements OnInit {
 
  ngOnInit() {
    window.close()
  }
}
