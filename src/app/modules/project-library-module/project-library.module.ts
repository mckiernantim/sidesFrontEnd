import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { PostLoginChoiceComponent } from '../../components/project-library/post-login-choice/post-login-choice.component';
import { MyProjectsComponent } from '../../components/project-library/my-projects/my-projects.component';

import { ProjectApiService } from '../../services/project/project-api.service';
import { ProjectService } from '../../services/project/project.service';
import { ProjectLibraryService } from '../../services/project/project-library.service';

/**
 * ProjectLibraryModule — Declares components for spec 028 US1's post-login
 * choice and My Projects library (mirrors modules/schedule-module/schedule.module.ts;
 * standalone: false throughout).
 *
 * Components:
 * - PostLoginChoiceComponent: `/start` — Upload Script vs. Continue with Saved Project
 * - MyProjectsComponent: `/my-projects` — minimal saved-project list (Phase B/C),
 *   enhanced into full CRUD in Phase 6 (US4) without moving files
 *
 * Services:
 * - ProjectApiService / ProjectService / ProjectLibraryService: already
 *   `providedIn: 'root'` (027 Phase 4 / 028 US3 T043); listed here for
 *   discoverability only, not re-provided.
 */
@NgModule({
  declarations: [PostLoginChoiceComponent, MyProjectsComponent],
  imports: [CommonModule, RouterModule, FormsModule],
  exports: [PostLoginChoiceComponent, MyProjectsComponent],
  providers: [ProjectApiService, ProjectService, ProjectLibraryService],
})
export class ProjectLibraryModule {}
