import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthModalService } from '../../services/auth-modal/auth-modal.service';

@Component({
  selector: 'app-auth-modal',
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.css'],
  standalone: false,
})
export class AuthModalComponent implements OnInit, OnDestroy {
  isOpen = false;
  private sub: Subscription | null = null;

  constructor(private authModalService: AuthModalService) {}

  ngOnInit(): void {
    this.sub = this.authModalService.isOpen$.subscribe(open => {
      this.isOpen = open;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  close(): void {
    this.authModalService.close();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('auth-modal__backdrop')) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.close();
    }
  }
}
