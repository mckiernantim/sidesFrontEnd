import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectApiService, ProjectSummary } from '../../../services/project/project-api.service';

/**
 * PostLoginChoiceComponent — `/start` route.
 *
 * Spec 029 research D1 realignment: the upload screen ("/") is now the
 * single source of truth for the Upload-new-script / Use-saved-project
 * choice (`shouldShowUploadEntryToggle`, contracts/upload-entry-ui.md §1).
 * A second, long-lived "Upload vs Saved" chooser here would compete with
 * that toggle (forbidden by contracts/upload-entry-ui.md §3), so this is now
 * a thin auto-redirecting splash: it briefly checks whether the user has any
 * saved projects, then immediately navigates to "/" with `?entry=saved` or
 * `?entry=upload` so the upload-screen toggle opens in the right mode. A
 * `GET /project/user` failure NEVER traps the user — it still redirects to
 * "/" (defaulting to upload mode).
 *
 * `AuthComponent.routeAfterSignIn` no longer routes here directly (it goes
 * straight to "/"); this route is kept only for any existing direct links /
 * bookmarks to `/start` so they still land somewhere useful.
 */
@Component({
  selector: 'app-post-login-choice',
  templateUrl: './post-login-choice.component.html',
  styleUrls: ['./post-login-choice.component.css'],
  standalone: false,
})
export class PostLoginChoiceComponent implements OnInit {
  isLoading = true;
  hasProjects = false;
  projects: ProjectSummary[] = [];
  loadError = false;

  constructor(
    private projectApi: ProjectApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.projectApi.listProjects().subscribe({
      next: (response) => {
        this.projects = response.projects || [];
        this.hasProjects = this.projects.length > 0;
        this.isLoading = false;
        this.redirect();
      },
      error: () => {
        // Fail safe: redirect to the upload screen's default (upload) mode.
        this.projects = [];
        this.hasProjects = false;
        this.loadError = true;
        this.isLoading = false;
        this.redirect();
      },
    });
  }

  /** Thin splash → immediately hands off to the upload-screen toggle (research D1). */
  private redirect(): void {
    this.router.navigate(['/'], { queryParams: { entry: this.hasProjects ? 'saved' : 'upload' } });
  }

  uploadScript(): void {
    this.router.navigate(['/'], { queryParams: { entry: 'upload' } });
  }

  continueWithSavedProject(): void {
    this.router.navigate(['/my-projects']);
  }
}
