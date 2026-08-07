import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProjectResolveGuard } from './project-resolve.guard';
import { ProjectService } from '../services/project/project.service';
import { ProjectApiError } from '../services/project/project-api.service';

describe('ProjectResolveGuard', () => {
  let guard: ProjectResolveGuard;
  let mockProjectService: { openProject: jest.Mock };
  let mockRouter: { navigate: jest.Mock };

  const makeRoute = (id: string | null): ActivatedRouteSnapshot =>
    ({ paramMap: convertToParamMap(id ? { id } : {}) } as ActivatedRouteSnapshot);

  beforeEach(() => {
    mockProjectService = { openProject: jest.fn() };
    mockRouter = { navigate: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        ProjectResolveGuard,
        { provide: ProjectService, useValue: mockProjectService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    guard = TestBed.inject(ProjectResolveGuard);
  });

  it('hydrates the project via ProjectService then navigates to /dashboard, blocking /project/:id activation', (done) => {
    mockProjectService.openProject.mockReturnValue(of({ project: { id: 'proj-1' }, content: {} }));

    (guard.canActivate(makeRoute('proj-1'), {} as any) as any).subscribe((result: boolean) => {
      expect(mockProjectService.openProject).toHaveBeenCalledWith('proj-1');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
      expect(result).toBe(false);
      done();
    });
  });

  it('redirects to /profile without calling openProject when the route has no id', (done) => {
    (guard.canActivate(makeRoute(null), {} as any) as any).subscribe((result: boolean) => {
      expect(mockProjectService.openProject).not.toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile']);
      expect(result).toBe(false);
      done();
    });
  });

  it('redirects to /profile with the CONTENT_MISSING error code and re-upload target on a 410', (done) => {
    const apiError = new ProjectApiError('CONTENT_MISSING', 'Content missing', 410);
    mockProjectService.openProject.mockReturnValue(throwError(() => apiError));

    (guard.canActivate(makeRoute('proj-missing'), {} as any) as any).subscribe((result: boolean) => {
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile'], {
        queryParams: { projectError: 'CONTENT_MISSING', projectId: 'proj-missing' },
      });
      done();
    });
  });

  it('redirects to /profile with an UNKNOWN error code for untyped errors', (done) => {
    mockProjectService.openProject.mockReturnValue(throwError(() => new Error('boom')));

    (guard.canActivate(makeRoute('proj-2'), {} as any) as any).subscribe((result: boolean) => {
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile'], {
        queryParams: { projectError: 'UNKNOWN', projectId: 'proj-2' },
      });
      done();
    });
  });

  it('redirects to /profile with FORBIDDEN when the project belongs to another user', (done) => {
    const apiError = new ProjectApiError('FORBIDDEN', 'You do not have permission.', 403);
    mockProjectService.openProject.mockReturnValue(throwError(() => apiError));

    (guard.canActivate(makeRoute('proj-not-mine'), {} as any) as any).subscribe((result: boolean) => {
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile'], {
        queryParams: { projectError: 'FORBIDDEN', projectId: 'proj-not-mine' },
      });
      done();
    });
  });
});
