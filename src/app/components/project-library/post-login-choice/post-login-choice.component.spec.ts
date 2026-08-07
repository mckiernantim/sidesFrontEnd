import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PostLoginChoiceComponent } from './post-login-choice.component';
import { ProjectApiService, ProjectSummary } from '../../../services/project/project-api.service';

function buildProject(overrides: Partial<ProjectSummary> = {}): ProjectSummary {
  return {
    id: 'proj-1',
    title: 'My Screenplay',
    originalname: 'script.pdf',
    sceneCount: 10,
    pageCount: 90,
    characterCount: 5,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
    contentBytes: 1000,
    ...overrides,
  };
}

/**
 * Spec 029 research D1 realignment: `/start` is now a thin auto-redirecting
 * splash (contracts/upload-entry-ui.md §3) — it never renders a persistent
 * Upload-vs-Saved chooser (that would compete with the upload-screen toggle),
 * it just picks `?entry=saved|upload` and immediately navigates to "/".
 */
describe('PostLoginChoiceComponent', () => {
  let component: PostLoginChoiceComponent;
  let fixture: ComponentFixture<PostLoginChoiceComponent>;
  let projectApi: jest.Mocked<ProjectApiService>;
  let router: jest.Mocked<Router>;

  async function setup(listProjectsReturn: any) {
    projectApi = {
      listProjects: jest.fn().mockReturnValue(listProjectsReturn),
    } as unknown as jest.Mocked<ProjectApiService>;

    router = { navigate: jest.fn() } as unknown as jest.Mocked<Router>;

    await TestBed.configureTestingModule({
      declarations: [PostLoginChoiceComponent],
      imports: [CommonModule],
      providers: [
        { provide: ProjectApiService, useValue: projectApi },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PostLoginChoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('never renders a persistent Upload-vs-Saved chooser (contract §3, forbidden)', async () => {
    await setup(of({ projects: [buildProject()] }));

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="upload-script-btn"]')).toBeFalsy();
    expect(compiled.querySelector('[data-testid="continue-saved-project-btn"]')).toBeFalsy();
    expect(compiled.querySelector('[data-testid="post-login-redirecting"]')).toBeTruthy();
  });

  it('redirects to /?entry=saved when the user has at least one saved project', async () => {
    await setup(of({ projects: [buildProject()] }));

    expect(component.hasProjects).toBe(true);
    expect(router.navigate).toHaveBeenCalledWith(['/'], { queryParams: { entry: 'saved' } });
  });

  it('redirects to /?entry=upload when there are zero saved projects', async () => {
    await setup(of({ projects: [] }));

    expect(component.hasProjects).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/'], { queryParams: { entry: 'upload' } });
  });

  it('falls back to /?entry=upload on a GET /project/user error, without trapping the user', async () => {
    await setup(throwError(() => new Error('network error')));

    expect(component.isLoading).toBe(false);
    expect(component.hasProjects).toBe(false);
    expect(component.loadError).toBe(true);
    expect(router.navigate).toHaveBeenCalledWith(['/'], { queryParams: { entry: 'upload' } });
  });

  it('uploadScript() navigates to /?entry=upload', async () => {
    await setup(of({ projects: [] }));

    component.uploadScript();

    expect(router.navigate).toHaveBeenCalledWith(['/'], { queryParams: { entry: 'upload' } });
  });

  it('continueWithSavedProject() navigates to /my-projects', async () => {
    await setup(of({ projects: [buildProject()] }));

    component.continueWithSavedProject();

    expect(router.navigate).toHaveBeenCalledWith(['/my-projects']);
  });
});
