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

/**
 * Regression tests for watermarks disappearing after a scene reorder or on the
 * transition into Last Looks.
 *
 * Root cause: watermarkPages() stamped watermarkData onto the page objects but
 * never recorded the watermark on the service. processPdf() rebuilds the page
 * objects from scratch, and its re-apply step is gated on `this.watermark`, so
 * the gate was always false and the stamp was silently dropped.
 */
describe('PdfService — watermark persistence across document rebuilds', () => {
  let service: PdfService;

  const makePages = () => [
    [{ index: 0, category: 'scene-header' }, { index: 1, category: 'dialog' }],
    [{ index: 2, category: 'action' }],
  ];

  beforeEach(() => {
    const mockUpload: Partial<UploadService> = {};
    const mockUndo = {
      setPdfService: jest.fn(),
      reset$: new Subject<void>(),
      reset: jest.fn(),
      recordDocumentReorderChange: jest.fn(),
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

  it('records the watermark on the service so a rebuild can re-apply it', () => {
    service.watermarkPages('JANE DOE', makePages());

    expect(service.watermark).toBe('JANE DOE');
  });

  it('records the casting director alongside the watermark', () => {
    service.watermarkPages('JANE DOE', makePages(), 'Casting by Sam');

    expect(service.watermark).toBe('JANE DOE');
    expect(service.watermarkCastingDirector).toBe('Casting by Sam');
  });

  it('treats a blank casting director as absent', () => {
    service.watermarkPages('JANE DOE', makePages(), '   ');

    expect(service.watermarkCastingDirector).toBeNull();
  });

  it('stamps watermarkData onto the first line of every page', () => {
    const doc = makePages();

    service.watermarkPages('JANE DOE', doc);

    doc.forEach((page) => {
      const stamped = (page[0] as any).watermarkData;
      expect(stamped.actorName).toBe('JANE DOE');
      expect(stamped.isActive).toBe(true);
    });
  });

  it('THE BUG: a freshly rebuilt document re-acquires the watermark', () => {
    // Watermark the document the user is looking at.
    service.watermarkPages('JANE DOE', makePages(), 'Casting by Sam');

    // processPdf discards the old page objects and builds new ones.
    const rebuilt = makePages();
    expect((rebuilt[0][0] as any).watermarkData).toBeUndefined();

    // The re-apply step in processPdf is gated on this.watermark.
    expect(service.watermark).toBeTruthy();
    service.watermarkPages(
      service.watermark as string,
      rebuilt,
      service.watermarkCastingDirector || undefined
    );

    rebuilt.forEach((page) => {
      const stamped = (page[0] as any).watermarkData;
      expect(stamped.actorName).toBe('JANE DOE');
      expect(stamped.castingDirector).toBe('Casting by Sam');
      expect(stamped.isActive).toBe(true);
    });
  });

  it('clears the recorded watermark on removal so rebuilds stay clean', () => {
    const doc = makePages();
    service.watermarkPages('JANE DOE', doc, 'Casting by Sam');

    service.removeWatermark(doc);

    expect(service.watermark).toBeNull();
    expect(service.watermarkCastingDirector).toBeNull();
    doc.forEach((page) => {
      expect((page[0] as any).watermarkData).toBeNull();
    });
  });

  it('clears the recorded watermark when document state is reset', () => {
    service.watermarkPages('JANE DOE', makePages(), 'Casting by Sam');

    service.resetDocumentState();

    expect(service.watermark).toBeNull();
    expect(service.watermarkCastingDirector).toBeNull();
  });
});

/**
 * Regression tests for a callsheet added before Last Looks disappearing, and for
 * the restored callsheet page not carrying the active watermark.
 *
 * Root cause: processPdf assigns `this.finalDocument.data = reorderedPages`,
 * discarding the callsheet page that insertCallsheetAtStart had unshifted onto
 * the previous array.
 */
describe('PdfService — callsheet persistence across document rebuilds', () => {
  let service: PdfService;

  const makePages = () => [
    [{ index: 0, category: 'scene-header' }, { index: 1, category: 'dialog' }],
    [{ index: 2, category: 'action' }],
  ];

  const rebuild = () => {
    // Stand in for processPdf replacing the page objects wholesale.
    service.finalDocument.data = makePages();
    (service as any).restoreAttachmentsAfterRebuild();
  };

  beforeEach(() => {
    const mockUpload: Partial<UploadService> = {};
    const mockUndo = {
      setPdfService: jest.fn(),
      reset$: new Subject<void>(),
      reset: jest.fn(),
      recordDocumentReorderChange: jest.fn(),
    } as unknown as Partial<UndoService>;

    TestBed.configureTestingModule({
      providers: [
        PdfService,
        { provide: UploadService, useValue: mockUpload },
        { provide: UndoService, useValue: mockUndo },
      ],
    });

    service = TestBed.inject(PdfService);
    service.finalDocument = { data: makePages() };
  });

  it('inserts the callsheet as the first page', () => {
    service.insertCallsheetAtStart('/previews/callsheet.png');

    expect(service.hasCallsheet()).toBe(true);
    expect(service.finalDocument.data[0][0].imagePath).toBe('/previews/callsheet.png');
  });

  it('remembers the callsheet preview url so a rebuild can restore it', () => {
    service.insertCallsheetAtStart('/previews/callsheet.png');

    expect(service.callsheetPreviewUrl).toBe('/previews/callsheet.png');
  });

  it('THE BUG: a callsheet added before Last Looks survives the rebuild', () => {
    service.insertCallsheetAtStart('/previews/callsheet.png');

    rebuild();

    expect(service.hasCallsheet()).toBe(true);
    expect(service.finalDocument.data[0][0].imagePath).toBe('/previews/callsheet.png');
  });

  it('THE BUG: the restored callsheet carries the active watermark', () => {
    service.insertCallsheetAtStart('/previews/callsheet.png');
    service.watermarkPages('JANE DOE', service.finalDocument.data, 'Casting by Sam');

    rebuild();

    const callsheetLine = service.finalDocument.data[0][0];
    expect(callsheetLine.type).toBe('callsheet');
    expect(callsheetLine.watermarkData.actorName).toBe('JANE DOE');
    expect(callsheetLine.watermarkData.castingDirector).toBe('Casting by Sam');
  });

  it('stamps the watermark onto the callsheet when it is added first', () => {
    service.insertCallsheetAtStart('/previews/callsheet.png');

    service.watermarkPages('JANE DOE', service.finalDocument.data);

    expect(service.finalDocument.data[0][0].watermarkData.actorName).toBe('JANE DOE');
  });

  it('carries the watermark onto a callsheet added after the watermark', () => {
    service.watermarkPages('JANE DOE', service.finalDocument.data);

    service.insertCallsheetAtStart('/previews/callsheet.png');

    expect(service.finalDocument.data[0][0].watermarkData.actorName).toBe('JANE DOE');
  });

  it('does not duplicate the callsheet when a rebuild already kept one', () => {
    service.insertCallsheetAtStart('/previews/callsheet.png');

    (service as any).restoreAttachmentsAfterRebuild();

    const callsheetPages = service.finalDocument.data.filter(
      (page: any[]) => page?.[0]?.type === 'callsheet'
    );
    expect(callsheetPages.length).toBe(1);
  });

  it('does not resurrect a callsheet the user removed', () => {
    service.insertCallsheetAtStart('/previews/callsheet.png');
    service.removeCallsheetFromStart();

    expect(service.callsheetPreviewUrl).toBeNull();

    rebuild();

    expect(service.hasCallsheet()).toBe(false);
  });

  it('clears the remembered callsheet when document state is reset', () => {
    service.insertCallsheetAtStart('/previews/callsheet.png');

    service.resetDocumentState();

    expect(service.callsheetPreviewUrl).toBeNull();
  });
});

/**
 * Regression tests for shared-page doubling on scene reorder.
 *
 * When scene 7 ends on the same physical page scene 8 begins, and the user
 * reorders so 8 comes first:
 *   1. Scene 7 lines on the shared page become visible:false (no longer a continuation)
 *   2. A doubled copy of that page is inserted with scene 7 visible / scene 8 hidden
 */
describe('PdfService — reorderScenes page doubling', () => {
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



    // ── helpers ──────────────────────────────────────────────────────────────

    /** Minimal line factory */
    function makeLine(overrides: Partial<any> = {}): any {
      return {
        index: 0,
        text: '',
        category: 'dialog',
        sceneNumberText: '',
        sceneIndex: 0,
        page: 0,
        visible: 'true',
        cont: 'hideCont',
        end: 'hideEnd',
        bar: 'hideBar',
        xPos: 0,
        yPos: 0,
        docPageIndex: 0,
        docPageLineIndex: 0,
        ...overrides,
      };
    }

    /** Scene-header line factory */
    function makeHeader(sceneNumberText: string, index: number, firstLine: number, lastLine: number, visible = 'true'): any {
      return makeLine({ category: 'scene-header', sceneNumberText, index, visible });
    }

    /** Seed service.finalDocument and finalDocReady so reorderScenes can run */
    function seedDocument(pages: any[][]): void {
      service.finalDocument = { data: pages };
      service.finalDocReady = true;
    }

    // ── Case A (classic): scene starts on a shared page ─────────────────────

    describe('Case A — scene starts on shared page', () => {
      /**
       * Layout:
       *   page0: scene-A header (visible) | scene-B header (visible)
       *   page1: scene-B content only
       *
       * New order: [sceneB, sceneA]
       * Expected: [doubled-page0 (B visible, A hidden), page1, page0 (A visible, B hidden)]
       */
      let page0: any[];
      let page1: any[];

      beforeEach(() => {
        page0 = [
          makeHeader('A', 10, 10, 15, 'true'),
          makeLine({ index: 11, sceneNumberText: 'A', text: 'Scene A line', visible: 'true' }),
          makeHeader('B', 12, 12, 20, 'true'),
          makeLine({ index: 13, sceneNumberText: 'B', text: 'Scene B opening', visible: 'true' }),
        ];
        page1 = [
          makeLine({ index: 14, sceneNumberText: '', text: 'Scene B body', visible: 'true' }),
          makeLine({ index: 15, sceneNumberText: '', text: 'Scene B end',  visible: 'true' }),
        ];
        seedDocument([page0, page1]);
      });

      it('produces 3 pages total', () => {
        service.reorderScenes([
          { sceneNumberText: 'B', firstLine: 12, lastLine: 20 },
          { sceneNumberText: 'A', firstLine: 10, lastLine: 15 },
        ]);
        expect(service.finalDocument.data.length).toBe(3);
      });

      it('first page is the doubled copy with scene B visible and scene A hidden', () => {
        service.reorderScenes([
          { sceneNumberText: 'B', firstLine: 12, lastLine: 20 },
          { sceneNumberText: 'A', firstLine: 10, lastLine: 15 },
        ]);
        const [first] = service.finalDocument.data;
        const bHeader = first.find((l: any) => l.category === 'scene-header' && l.sceneNumberText === 'B');
        const aHeader = first.find((l: any) => l.category === 'scene-header' && l.sceneNumberText === 'A');
        expect(bHeader?.visible).toBe('true');
        expect(aHeader?.visible).toBe('false');
        expect(first[0].isDoubledPage).toBe(true);
      });

      it('doubled page is placed BEFORE scene B own pages (case A)', () => {
        service.reorderScenes([
          { sceneNumberText: 'B', firstLine: 12, lastLine: 20 },
          { sceneNumberText: 'A', firstLine: 10, lastLine: 15 },
        ]);
        const [first, second] = service.finalDocument.data;
        // First page is the doubled copy (has isDoubledPage flag)
        expect(first[0].isDoubledPage).toBe(true);
        // Second page is scene B's own continuation page (no isDoubledPage)
        expect(second[0].isDoubledPage).toBeUndefined();
      });
    });

    // ── Case B (continuation): scene continues/ends on shared page ────────────

    describe('Case B — scene continues / ends on a shared page (the reported bug)', () => {
      /**
       * Mirrors the real data from the bug report:
       *   page0 (original p35): scene-58 header (hidden) | scene-59 header (visible) |
       *                         scene-59 body | scene-59 last-line (CONTINUE at bottom)
       *   page1 (original p36): scene-59 CONTINUE-TOP line | scene-59 body |
       *                         scene-59 end | scene-61 header (visible)
       *
       * New order: [scene61, scene59]
       * Expected:
       *   [0] page1  — scene 61 visible, scene 59 HIDDEN (original slot)
       *   [1] page0  — scene 59 visible, scene 58 hidden (scene 59's own page)
       *   [2] doubled page1 — scene 59 continuation VISIBLE, scene 61 hidden (case B)
       */
      let page0: any[];   // p35 equivalent
      let page1: any[];   // p36 equivalent

      beforeEach(() => {
        // p35: 58 ends (hidden header), 59 starts (visible header) + body ending with CONTINUE
        page0 = [
          makeHeader('58', 1355, 1300, 1354, 'false'),
          makeLine({ index: 1354, sceneNumberText: '58', text: '58 last line', visible: 'true' }),
          makeHeader('59', 1356, 1356, 1394, 'true'),
          makeLine({ index: 1357, sceneNumberText: '', text: '59 body line', visible: 'true' }),
          makeLine({ index: 1367, sceneNumberText: '59', text: '(bitter)', visible: 'true', cont: 'CONTINUE' }),
        ];

        // p36: 59 continuation (CONTINUE-TOP), 59 ends, then 61 header + body
        page1 = [
          makeLine({ index: 1371, sceneNumberText: '59', text: 'INMATE (CONTD)', visible: 'true', cont: 'CONTINUE-TOP' }),
          makeLine({ index: 1380, sceneNumberText: '', text: '59 dialog', visible: 'true' }),
          makeLine({ index: 1394, sceneNumberText: '59', text: 'last 59 line', visible: 'true', end: 'END', isSceneEnd: true }),
          makeHeader('61', 1396, 1396, 1403, 'true'),
          makeLine({ index: 1397, sceneNumberText: '', text: '61 description', visible: 'true' }),
        ];

        seedDocument([page0, page1]);
      });

      it('produces 3 pages after reorder [61, 59]', () => {
        service.reorderScenes([
          { sceneNumberText: '61', firstLine: 1396, lastLine: 1403 },
          { sceneNumberText: '59', firstLine: 1356, lastLine: 1394 },
        ]);
        expect(service.finalDocument.data.length).toBe(3);
      });

      it('first page shows scene 61 visible and hides scene 59 continuation lines', () => {
        service.reorderScenes([
          { sceneNumberText: '61', firstLine: 1396, lastLine: 1403 },
          { sceneNumberText: '59', firstLine: 1356, lastLine: 1394 },
        ]);
        const first = service.finalDocument.data[0];
        const contTopLine = first.find((l: any) => l.index === 1371);
        const header61 = first.find((l: any) => l.category === 'scene-header' && l.sceneNumberText === '61');
        expect(header61?.visible).toBe('true');
        if (contTopLine) {
          expect(contTopLine.visible).toBe('false');
        }
      });

      it('second page is scene 59 OWN page (its start)', () => {
        service.reorderScenes([
          { sceneNumberText: '61', firstLine: 1396, lastLine: 1403 },
          { sceneNumberText: '59', firstLine: 1356, lastLine: 1394 },
        ]);
        const second = service.finalDocument.data[1];
        const header59 = second.find((l: any) => l.category === 'scene-header' && l.sceneNumberText === '59');
        expect(header59?.visible).toBe('true');
        expect(second[0].isDoubledPage).toBeUndefined();
      });

      it('third page is the doubled copy (case B) — placed AFTER scene 59 own pages', () => {
        service.reorderScenes([
          { sceneNumberText: '61', firstLine: 1396, lastLine: 1403 },
          { sceneNumberText: '59', firstLine: 1356, lastLine: 1394 },
        ]);
        const third = service.finalDocument.data[2];
        expect(third[0].isDoubledPage).toBe(true);
      });

      it('doubled page shows scene 59 continuation visible and scene 61 content hidden', () => {
        service.reorderScenes([
          { sceneNumberText: '61', firstLine: 1396, lastLine: 1403 },
          { sceneNumberText: '59', firstLine: 1356, lastLine: 1394 },
        ]);
        const third = service.finalDocument.data[2];
        const contTop = third.find((l: any) => l.index === 1371);
        const header61 = third.find((l: any) => l.category === 'scene-header' && l.sceneNumberText === '61');
        const desc61 = third.find((l: any) => l.index === 1397);
        expect(contTop?.visible).toBe('true');
        expect(header61?.visible).toBe('false');
        if (desc61) expect(desc61.visible).toBe('false');
      });

      it('doubled page clears bar/end/cont markers on hidden (other-scene) lines', () => {
        // Give scene 61's header a bar and an end marker to verify they get cleared
        const header61Line = page1.find((l: any) => l.category === 'scene-header' && l.sceneNumberText === '61');
        header61Line.bar = 'bar';
        header61Line.end = 'END';
        header61Line.cont = 'CONTINUE';
        seedDocument([page0, page1]);

        service.reorderScenes([
          { sceneNumberText: '61', firstLine: 1396, lastLine: 1403 },
          { sceneNumberText: '59', firstLine: 1356, lastLine: 1394 },
        ]);

        const third = service.finalDocument.data[2];
        const cloned61Header = third.find(
          (l: any) => l.category === 'scene-header' && l.sceneNumberText === '61'
        );
        expect(cloned61Header?.visible).toBe('false');
        expect(cloned61Header?.bar).toBe('hideBar');
        expect(cloned61Header?.end).toBe('hideEnd');
        expect(cloned61Header?.cont).toBe('hideCont');
      });

      it('docPageIndex values are re-stamped sequentially (0, 1, 2)', () => {
        service.reorderScenes([
          { sceneNumberText: '61', firstLine: 1396, lastLine: 1403 },
          { sceneNumberText: '59', firstLine: 1356, lastLine: 1394 },
        ]);
        service.finalDocument.data.forEach((page: any[], idx: number) => {
          page.forEach((line: any) => {
            expect(line.docPageIndex).toBe(idx);
          });
        });
      });
    });


    // ── User scenario: scene 7 ends where scene 8 begins, reorder to [8, 7] ─

    describe('Case B — scene 7/8 shared page reordered to [8, 7]', () => {
      let sharedPage: any[];
      let scene7StartPage: any[];

      function makeLine(overrides: Partial<any> = {}): any {
        return {
          index: 0, text: '', category: 'dialog', sceneNumberText: '',
          sceneIndex: 0, page: 0, visible: 'true', cont: 'hideCont',
          end: 'hideEnd', bar: 'hideBar', xPos: 0, yPos: 0,
          docPageIndex: 0, docPageLineIndex: 0, ...overrides,
        };
      }
      function makeHeader(sceneNumberText: string, index: number, visible = 'true'): any {
        return makeLine({ category: 'scene-header', sceneNumberText, index, visible });
      }

      beforeEach(() => {
        // Scene 7 starts on its own page
        scene7StartPage = [
          makeHeader('7', 70),
          makeLine({ index: 71, sceneNumberText: '7', text: '7 body', visible: 'true' }),
          makeLine({ index: 75, sceneNumberText: '7', text: '7 continues', visible: 'true', cont: 'CONTINUE' }),
        ];
        // Shared page: scene 7 ends, scene 8 begins
        sharedPage = [
          makeLine({ index: 80, sceneNumberText: '7', text: '7 tail', visible: 'true', cont: 'CONTINUE-TOP' }),
          makeLine({ index: 84, sceneNumberText: '7', text: '7 last', visible: 'true', end: 'END' }),
          makeHeader('8', 85),
          makeLine({ index: 86, sceneNumberText: '8', text: '8 opening', visible: 'true' }),
        ];
        service.finalDocument = { data: [scene7StartPage, sharedPage] };
        service.finalDocReady = true;
      });

      it('produces 3 pages when reordered to [8, 7]', () => {
        service.reorderScenes([
          { sceneNumberText: '8', firstLine: 85, lastLine: 90 },
          { sceneNumberText: '7', firstLine: 70, lastLine: 84 },
        ]);
        expect(service.finalDocument.data.length).toBe(3);
      });

      it('hides scene 7 lines on the shared page claimed by scene 8', () => {
        service.reorderScenes([
          { sceneNumberText: '8', firstLine: 85, lastLine: 90 },
          { sceneNumberText: '7', firstLine: 70, lastLine: 84 },
        ]);
        const first = service.finalDocument.data[0];
        const header8 = first.find((l: any) => l.category === 'scene-header' && l.sceneNumberText === '8');
        const scene7Lines = first.filter((l: any) => l.sceneNumberText === '7');
        expect(header8?.visible).toBe('true');
        expect(scene7Lines.length).toBeGreaterThan(0);
        scene7Lines.forEach((l: any) => expect(l.visible).toBe('false'));
      });

      it('inserts a doubled page after scene 7 own pages with only scene 7 visible', () => {
        service.reorderScenes([
          { sceneNumberText: '8', firstLine: 85, lastLine: 90 },
          { sceneNumberText: '7', firstLine: 70, lastLine: 84 },
        ]);
        // [0] shared (8 visible, 7 hidden), [1] scene7 start, [2] doubled shared (7 visible, 8 hidden)
        const doubled = service.finalDocument.data[2];
        expect(doubled[0].isDoubledPage).toBe(true);
        const scene7Lines = doubled.filter((l: any) => l.sceneNumberText === '7');
        const scene8Lines = doubled.filter((l: any) => l.sceneNumberText === '8');
        scene7Lines.forEach((l: any) => expect(l.visible).toBe('true'));
        scene8Lines.forEach((l: any) => expect(l.visible).toBe('false'));
      });
    });

    // ── cleanupContinueMarkers ─────────────────────────────────────────────

    describe('cleanupContinueMarkers', () => {

      it('keeps CONTINUE-TOP when previous page has a matching CONTINUE', () => {
        const pages = [
          [makeLine({ sceneNumberText: '59', cont: 'CONTINUE', visible: 'true' })],
          [makeLine({ sceneNumberText: '59', cont: 'CONTINUE-TOP', visible: 'true' })],
        ];
        service.cleanupContinueMarkers(pages);
        expect(pages[1][0].cont).toBe('CONTINUE-TOP');
      });

      it('clears CONTINUE-TOP when no previous page has a matching CONTINUE', () => {
        const pages = [
          [makeLine({ sceneNumberText: '61', cont: 'hideCont', visible: 'true' })],
          [makeLine({ sceneNumberText: '59', cont: 'CONTINUE-TOP', visible: 'true' })],
        ];
        service.cleanupContinueMarkers(pages);
        expect(pages[1][0].cont).toBe('hideCont');
      });

      it('clears CONTINUE-TOP when it is the first page (no previous page)', () => {
        const pages = [
          [makeLine({ sceneNumberText: '59', cont: 'CONTINUE-TOP', visible: 'true' })],
        ];
        service.cleanupContinueMarkers(pages);
        expect(pages[0][0].cont).toBe('hideCont');
      });

      it('keeps CONTINUE when next page has a matching CONTINUE-TOP', () => {
        const pages = [
          [makeLine({ sceneNumberText: '59', cont: 'CONTINUE', visible: 'true' })],
          [makeLine({ sceneNumberText: '59', cont: 'CONTINUE-TOP', visible: 'true' })],
        ];
        service.cleanupContinueMarkers(pages);
        expect(pages[0][0].cont).toBe('CONTINUE');
      });

      it('clears CONTINUE when next page has no matching CONTINUE-TOP', () => {
        const pages = [
          [makeLine({ sceneNumberText: '59', cont: 'CONTINUE', visible: 'true' })],
          [makeLine({ sceneNumberText: '61', cont: 'hideCont', visible: 'true' })],
        ];
        service.cleanupContinueMarkers(pages);
        expect(pages[0][0].cont).toBe('hideCont');
      });

      it('clears CONTINUE when it is the last page (no next page)', () => {
        const pages = [
          [makeLine({ sceneNumberText: '59', cont: 'CONTINUE', visible: 'true' })],
        ];
        service.cleanupContinueMarkers(pages);
        expect(pages[0][0].cont).toBe('hideCont');
      });

      it('does not touch invisible lines', () => {
        const pages = [
          [makeLine({ sceneNumberText: '59', cont: 'CONTINUE-TOP', visible: 'false' })],
        ];
        service.cleanupContinueMarkers(pages);
        // Should NOT be cleared because the line is invisible
        expect(pages[0][0].cont).toBe('CONTINUE-TOP');
      });

      it('clears stale CONTINUE-TOP on doubled case-B page when scene is placed first', () => {
        // Simulate: doubled page with CONTINUE-TOP placed first (nothing before it)
        const pages = [
          [
            makeLine({ index: 1371, sceneNumberText: '59', cont: 'CONTINUE-TOP', visible: 'true' }),
            makeLine({ index: 1394, sceneNumberText: '59', visible: 'true' }),
          ],
          [
            makeHeader('61', 1396, 1396, 1403),
          ],
        ];
        service.cleanupContinueMarkers(pages);
        expect(pages[0][0].cont).toBe('hideCont');
      });

      it('after reorder [61,59], CONTINUE-TOP on doubled page is preserved (59 own page precedes it)', () => {
        const page0 = [
          makeHeader('58', 1355, 1300, 1354, 'false'),
          makeHeader('59', 1356, 1356, 1394, 'true'),
          makeLine({ index: 1367, sceneNumberText: '59', cont: 'CONTINUE', visible: 'true' }),
        ];
        const page1 = [
          makeLine({ index: 1371, sceneNumberText: '59', cont: 'CONTINUE-TOP', visible: 'true' }),
          makeLine({ index: 1394, sceneNumberText: '59', visible: 'true', end: 'END', isSceneEnd: true }),
          makeHeader('61', 1396, 1396, 1403, 'true'),
        ];
        seedDocument([page0, page1]);

        service.reorderScenes([
          { sceneNumberText: '61', firstLine: 1396, lastLine: 1403 },
          { sceneNumberText: '59', firstLine: 1356, lastLine: 1394 },
        ]);

        // Doubled page is page index 2; its CONTINUE-TOP should still be active
        // because page index 1 (scene 59 own page) ends with CONTINUE for scene 59.
        const doubledPage = service.finalDocument.data[2];
        const contTopLine = doubledPage.find((l: any) => l.cont === 'CONTINUE-TOP' && l.sceneNumberText === '59');
        expect(contTopLine).toBeDefined();
        expect(contTopLine.cont).toBe('CONTINUE-TOP');
      });
    });
  
});
