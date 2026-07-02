import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { PdfService } from './pdf.service';
import { UploadService } from '../upload/upload.service';
import { UndoService } from '../edit/undo.service';

/**
 * Regression tests for the Last Looks "phantom page + stray CONTINUE bar" bug.
 *
 * Root cause (confirmed against real revision scripts via
 * scan-classify-service/scripts/dump-scene-boundaries.js): a scene's recorded
 * last line is page metadata (page number / revision-colour label / version
 * stamp) sitting on the NEXT page. getLastPage() used to strip only a trailing
 * run of `draft-color-text`, so an interleaved `page-number` stopped the walk
 * and pushed `lastPage` onto the next page — rendering an extra page and a
 * stray "CONTINUE N" bar.
 *
 * Fixture indices mirror the real data: array position === `line.index`
 * (getLastPage indexes `this.allLines` by the line's index).
 */
describe('PdfService — scene boundary / trailing page metadata (Last Looks bar bug)', () => {
  let service: PdfService;

  beforeEach(() => {
    const mockUpload: Partial<UploadService> = {};
    const mockUndo: Partial<UndoService> = {
      setPdfService: jest.fn(),
      reset$: new Subject<void>(),
    } as unknown as Partial<UndoService>;

    TestBed.configureTestingModule({
      providers: [
        PdfService,
        { provide: UploadService, useValue: mockUpload },
        { provide: UndoService, useValue: mockUndo },
      ],
    });

    service = TestBed.inject(PdfService);
  });

  describe('isTrailingPageMetadata', () => {
    const isMeta = (line: any) => (service as any).isTrailingPageMetadata(line);

    it('flags every page-metadata category', () => {
      expect(isMeta({ category: 'draft-color-text' })).toBe(true);
      expect(isMeta({ category: 'version' })).toBe(true);
      expect(isMeta({ category: 'page-number' })).toBe(true);
      expect(isMeta({ category: 'page-number-hidden' })).toBe(true);
    });

    it('flags any line carrying a non-empty draftColorText label (revision colour folded into a page-number)', () => {
      expect(isMeta({ category: 'page-number', draftColorText: 'BLUE 6/19/25' })).toBe(true);
      // even an otherwise-content category is metadata if it is purely a revision label
      expect(isMeta({ category: 'dialog', draftColorText: 'PINK 3/1/25' })).toBe(true);
    });

    it('does NOT flag real scene content', () => {
      expect(isMeta({ category: 'dialog' })).toBe(false);
      expect(isMeta({ category: 'description' })).toBe(false);
      expect(isMeta({ category: 'first-description' })).toBe(false);
      expect(isMeta({ category: 'character' })).toBe(false);
      expect(isMeta({ category: 'scene-header' })).toBe(false);
      // a whitespace-only draftColorText label on content does not make it metadata
      expect(isMeta({ category: 'dialog', draftColorText: '   ' })).toBe(false);
      expect(isMeta(null)).toBe(false);
      expect(isMeta(undefined)).toBe(false);
    });
  });

  describe('getLastPage', () => {
    it('THE BUG: draft-color-text interleaved with a page-number on the next page does NOT extend the scene', () => {
      // Scene 11 content ends on page 4; page 5 opens with a revision-colour
      // label and a page number, then scene 12 begins. This is the exact
      // SCRIPT TWISTER scenario.
      service.allLines = [
        { index: 0, category: 'scene-header', page: 4 }, // scene 11 header
        { index: 1, category: 'dialog', page: 4 }, // last real content (page 4)
        { index: 2, category: 'draft-color-text', page: 5 }, // revision label, top of page 5
        { index: 3, category: 'page-number', page: 5 }, // page number on page 5
        { index: 4, category: 'scene-header', page: 5 }, // scene 12 header (next)
      ];
      // setLastLines() would set lastLine = next.index - 1 = 3 (the page-number)
      const scene = { firstLine: 0, lastLine: 3 };

      expect(service.getLastPage(scene)).toBe(4);
    });

    it('REGRESSION: a standalone trailing draft-color-text still resolves to the content page', () => {
      service.allLines = [
        { index: 0, category: 'scene-header', page: 4 },
        { index: 1, category: 'dialog', page: 4 },
        { index: 2, category: 'draft-color-text', page: 5 },
        { index: 3, category: 'scene-header', page: 5 },
      ];
      expect(service.getLastPage({ firstLine: 0, lastLine: 2 })).toBe(4);
    });

    it('strips a trailing page-number (the most common spill on non-revision scripts)', () => {
      service.allLines = [
        { index: 0, category: 'scene-header', page: 8 },
        { index: 1, category: 'first-description', page: 8 },
        { index: 2, category: 'page-number', page: 9 },
        { index: 3, category: 'scene-header', page: 9 },
      ];
      expect(service.getLastPage({ firstLine: 0, lastLine: 2 })).toBe(8);
    });

    it('strips a trailing version (date-only revision) stamp', () => {
      service.allLines = [
        { index: 0, category: 'scene-header', page: 12 },
        { index: 1, category: 'dialog', page: 12 },
        { index: 2, category: 'version', page: 13 },
        { index: 3, category: 'scene-header', page: 13 },
      ];
      expect(service.getLastPage({ firstLine: 0, lastLine: 2 })).toBe(12);
    });

    it('strips a page-number carrying a draftColorText label', () => {
      service.allLines = [
        { index: 0, category: 'scene-header', page: 4 },
        { index: 1, category: 'dialog', page: 4 },
        { index: 2, category: 'page-number', page: 5, draftColorText: 'BLUE 6/19/25 5.' },
        { index: 3, category: 'scene-header', page: 5 },
      ];
      expect(service.getLastPage({ firstLine: 0, lastLine: 2 })).toBe(4);
    });

    it('does NOT over-strip: a scene with real content on the next page keeps that page', () => {
      // page number at the top of page 5, then genuine dialogue on page 5 —
      // the scene truly continues, so lastPage must stay 5.
      service.allLines = [
        { index: 0, category: 'scene-header', page: 4 },
        { index: 1, category: 'dialog', page: 4 },
        { index: 2, category: 'page-number', page: 5 },
        { index: 3, category: 'dialog', page: 5 }, // real content on page 5
        { index: 4, category: 'scene-header', page: 6 },
      ];
      expect(service.getLastPage({ firstLine: 0, lastLine: 3 })).toBe(5);
    });

    it('never walks past firstLine', () => {
      service.allLines = [
        { index: 0, category: 'scene-header', page: 1 },
        { index: 1, category: 'page-number', page: 2 },
      ];
      // Entire range is the header + metadata; must not run off the start.
      expect(service.getLastPage({ firstLine: 0, lastLine: 1 })).toBe(1);
    });
  });

  describe('handleLastLineOfScene', () => {
    it('places the END bar on the last real content line when the scene ends on page metadata', () => {
      const merged: any[] = [
        { index: 0, category: 'scene-header', yPos: 10 },
        { index: 1, category: 'dialog', yPos: 100 }, // real last content
        { index: 2, category: 'page-number', yPos: 750 }, // recorded lastLine
      ];
      const line = { lastLine: 2, sceneNumberText: '11' };

      service.handleLastLineOfScene(line, merged, 0);

      expect(merged[1].end).toBe('END');
      expect(merged[1].sceneNumberText).toBe('11');
      expect(merged[2].end).toBeUndefined(); // END must NOT sit on the page number
    });

    it('relocates END off a trailing version stamp too', () => {
      const merged: any[] = [
        { index: 0, category: 'scene-header', yPos: 10 },
        { index: 1, category: 'description', yPos: 200 },
        { index: 2, category: 'version', yPos: 760 },
      ];
      const line = { lastLine: 2, sceneNumberText: '7' };

      service.handleLastLineOfScene(line, merged, 0);

      expect(merged[1].end).toBe('END');
      expect(merged[2].end).toBeUndefined();
    });

    it('keeps END on the line itself when the scene ends on real content', () => {
      const merged: any[] = [
        { index: 0, category: 'scene-header', yPos: 10 },
        { index: 1, category: 'dialog', yPos: 300 },
      ];
      const line = { lastLine: 1, sceneNumberText: '3' };

      service.handleLastLineOfScene(line, merged, 0);

      expect(merged[1].end).toBe('END');
    });
  });
});
