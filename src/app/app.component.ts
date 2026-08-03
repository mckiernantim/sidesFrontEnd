import { Component, OnDestroy, OnInit, isDevMode } from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from '@angular/fire/auth';
import { AuthService } from './services/auth/auth.service';
import { getConfig } from '../environments/environment';
import { ListedAccessState } from './components/listed-access-gate/listed-access-gate.component';

/** Must match environment.prod.ts — never gate real production hosts. */
function isHostedDevStagingHostname(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return (
    h === 'scriptthing-dev.web.app' || h === 'scriptthing-dev.firebaseapp.com'
  );
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'side-ways';
  listedAccessGateActive = false;
  accessState: ListedAccessState = 'loading';

  private sub: Subscription | null = null;
  private evalGen = 0;

  constructor(private authService: AuthService) {
    // Belt + suspenders: config flag AND hostname must both say DEV staging.
    const configWantsGate = !!getConfig(!isDevMode()).listedAccessGateActive;
    this.listedAccessGateActive = configWantsGate && isHostedDevStagingHostname();
  }

  ngOnInit(): void {
    if (!this.listedAccessGateActive) {
      this.accessState = 'allowed';
      return;
    }

    this.sub = this.authService.user$.subscribe((user) => {
      const gen = ++this.evalGen;
      void this.evaluateAccess(user, gen);
    });
  }

  private async evaluateAccess(user: User | null, gen: number): Promise<void> {
    this.accessState = 'loading';

    if (!user) {
      if (gen === this.evalGen) this.accessState = 'need-signin';
      return;
    }

    const allowed = await this.authService.ensureListedAccess(user);
    if (gen === this.evalGen) {
      this.accessState = allowed ? 'allowed' : 'denied';
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get showApp(): boolean {
    return !this.listedAccessGateActive || this.accessState === 'allowed';
  }
}
