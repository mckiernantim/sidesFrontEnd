import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ProjectService } from '../services/project/project.service';
import { ProjectApiError } from '../services/project/project-api.service';

/**
 * ProjectResolveGuard — hydrates a saved project (via ProjectService.openProject)
 * before the user reaches the dashboard, then redirects there explicitly.
 *
 * Runs on `project/:id` behind AuthGuard. This route's own component is never
 * actually rendered: canActivate always resolves to `false` because we issue an
 * explicit navigation ourselves (to `/dashboard` on success, or back to
 * `/profile` with an error code on failure). Neither `/dashboard` nor
 * `/project/:id` carries DocumentResetGuard, so the freshly hydrated
 * UploadService/PdfService session survives the redirect untouched.
 */
@Injectable({
  providedIn: 'root',
})
export class ProjectResolveGuard implements CanActivate {
  constructor(private projectService: ProjectService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const projectId = route.paramMap.get('id');

    if (!projectId) {
      this.router.navigate(['/profile']);
      return of(false);
    }

    return this.projectService.openProject(projectId).pipe(
      map(() => {
        this.router.navigate(['/dashboard']);
        return false;
      }),
      catchError((err: unknown) => {
        const code = err instanceof ProjectApiError ? err.code : 'UNKNOWN';
        this.router.navigate(['/profile'], {
          queryParams: { projectError: code, projectId },
        });
        return of(false);
      })
    );
  }
}
