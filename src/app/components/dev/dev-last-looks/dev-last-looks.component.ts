import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { PdfService } from 'src/app/services/pdf/pdf.service';

interface LayoutMetric {
  label: string;
  selector: string;
  clientWidth: number;
  scrollWidth: number;
  overflow: number;
}

/**
 * Dev-only harness for the Last Looks view.
 *
 * The production route into Last Looks requires upload -> scan -> classify -> scene
 * select, which makes layout work slow to iterate on. This seeds PdfService with
 * synthetic (non-copyrighted) classified pages and renders the real
 * <app-last-looks> inside the same wrapper markup dashboard-right uses, so layout
 * bugs reproduce faithfully.
 *
 * Route: /dev/last-looks (registered only when environment.production is false)
 */
@Component({
  selector: 'app-dev-last-looks',
  templateUrl: './dev-last-looks.component.html',
  styleUrls: ['./dev-last-looks.component.css'],
  standalone: false
})
export class DevLastLooksComponent implements OnInit, OnDestroy {
  ready = false;
  editState = false;
  showSidePanel = true;
  showOutlines = false;
  pageCount = 4;
  loadedFrom = 'synthetic';

  metrics: LayoutMetric[] = [];
  viewportWidth = 0;
  devicePixelRatio = 1;
  pageScale: number | null = null;

  private measureTimer: any;

  constructor(private pdf: PdfService, private cdRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.seed(this.buildSyntheticDocument(this.pageCount));
    this.measureTimer = setInterval(() => this.measure(), 500);
  }

  ngOnDestroy(): void {
    clearInterval(this.measureTimer);
  }

  reload(): void {
    this.ready = false;
    this.cdRef.detectChanges();
    this.seed(this.buildSyntheticDocument(this.pageCount));
  }

  /** Load a classified-document JSON (Page[][]) from disk without committing it. */
  onFixtureSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed) || !Array.isArray(parsed[0])) {
          throw new Error('Expected an array of pages, where each page is an array of lines.');
        }
        this.ready = false;
        this.cdRef.detectChanges();
        this.loadedFrom = file.name;
        this.seed(parsed);
      } catch (err: any) {
        alert(`Could not load fixture: ${err?.message || err}`);
      }
    };
    reader.readAsText(file);
  }

  toggleEditMode(): void {
    this.editState = !this.editState;
  }

  private seed(pages: any[][]): void {
    pages.forEach(page => {
      page.forEach((line, lineIndex) => {
        // PdfService normally stamps this during document assembly; the page
        // component keys all selection and drag logic off it.
        line.docPageLineIndex = lineIndex;
      });
    });

    this.pdf.finalDocument = { data: pages };
    this.ready = true;
    this.cdRef.detectChanges();
    setTimeout(() => this.measure(), 0);
  }

  /**
   * Reports client vs scroll width for every container between the dashboard
   * wrapper and the scaled page, so an overflowing ancestor is obvious instead
   * of guessed at.
   */
  measure(): void {
    this.viewportWidth = window.innerWidth;
    this.devicePixelRatio = window.devicePixelRatio;

    const targets: Array<[string, string]> = [
      ['dashboard row', '.dash-main-row'],
      ['last-looks host', '.last-looks-host'],
      ['app-last-looks', 'app-last-looks'],
      ['pager', '.ll-pager'],
      ['page-container (scroller)', '.page-container'],
      ['app-last-looks-page', 'app-last-looks-page'],
      ['stage container', '.last-looks-container'],
      ['ll-stage', '.ll-stage'],
      ['control bar', '.ll-page-rail'],
      ['page viewport', '.ll-page-viewport'],
      ['page scaler', '.ll-page-scaler']
    ];

    const next: LayoutMetric[] = [];
    for (const [label, selector] of targets) {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) continue;
      next.push({
        label,
        selector,
        clientWidth: el.clientWidth,
        scrollWidth: el.scrollWidth,
        overflow: el.scrollWidth - el.clientWidth
      });
    }
    this.metrics = next;

    const scaler = document.querySelector('.ll-page-scaler') as HTMLElement | null;
    this.pageScale = scaler ? Math.round((scaler.offsetWidth / 816) * 1000) / 1000 : null;

    this.cdRef.detectChanges();
  }

  get worstOverflow(): number {
    return this.metrics.reduce((max, m) => Math.max(max, m.overflow), 0);
  }

  // ── Synthetic document ────────────────────────────────────────────────────
  // Original filler text. Coordinates mirror real classified output: xPos/yPos
  // are PDF points measured from the bottom-left, scaled by 1.3 into CSS px by
  // last-looks' processLinesForLastLooks().

  private static readonly X = {
    sceneHeader: 108,
    description: 108,
    character: 230,
    parenthetical: 205,
    dialog: 180,
    more: 180
  };

  private buildSyntheticDocument(pageCount: number): any[][] {
    const pages: any[][] = [];
    let globalIndex = 0;
    let sceneIndex = 1;

    for (let p = 0; p < pageCount; p++) {
      const page: any[] = [];
      let y = 740;

      const push = (category: string, text: string, xPos: number, extra: any = {}) => {
        const line: any = {
          yPos: y,
          xPos,
          page: p + 1,
          text,
          index: globalIndex++,
          category,
          visible: 'true',
          bar: 'hideBar',
          end: 'hideEnd',
          cont: 'hideCont',
          ...extra
        };
        page.push(line);
        y -= 14.5;
        return line;
      };

      push('page-number', '', 60, { pageNumberText: `${p + 1}.`, visible: 'true' });

      // Two scenes per page: the first is "selected" (rendered normally), the
      // second is excluded (struck through), which is what scene select produces.
      for (const included of [true, false]) {
        const visible = included ? 'true' : 'false';
        const scene = sceneIndex++;
        const block = this.sceneBlock(scene);

        push('scene-header', block.header, DevLastLooksComponent.X.sceneHeader, {
          sceneNumberText: String(scene),
          sceneIndex: scene,
          visible,
          trueScene: 'true',
          bar: included ? 'bar' : 'hideBar',
          barY: y + 20
        });
        y -= 14.5;

        block.body.forEach(entry => {
          if (entry.kind === 'description') {
            push('description', entry.text, DevLastLooksComponent.X.description, { visible });
          } else if (entry.kind === 'character') {
            push('character', entry.text, DevLastLooksComponent.X.character, { visible });
          } else if (entry.kind === 'parenthetical') {
            push('parenthetical', entry.text, DevLastLooksComponent.X.parenthetical, { visible });
          } else {
            push('dialog', entry.text, DevLastLooksComponent.X.dialog, { visible });
          }
        });

        y -= 14.5;
      }

      pages.push(page);
    }

    return pages;
  }

  private sceneBlock(scene: number): {
    header: string;
    body: Array<{ kind: string; text: string }>;
  } {
    const locations = [
      'INT. HARBORVIEW DINER - NIGHT',
      'EXT. RAILYARD - PREDAWN',
      'INT. COUNTY RECORDS BASEMENT - DAY',
      'EXT. LIGHTHOUSE ACCESS ROAD - DUSK',
      'INT. FERRY WHEELHOUSE - CONTINUOUS',
      'EXT. ORCHARD ROW - MORNING',
      'INT. MOTEL OFFICE - LATE NIGHT',
      'EXT. QUARRY RIM - AFTERNOON'
    ];

    return {
      header: locations[(scene - 1) % locations.length],
      body: [
        { kind: 'description', text: 'Rain sheets across the windows. A radio hums somewhere behind' },
        { kind: 'description', text: 'the counter, tuned between stations.' },
        { kind: 'character', text: 'DELPHINE' },
        { kind: 'parenthetical', text: '(not looking up)' },
        { kind: 'dialog', text: "You were supposed to call before you drove out here." },
        { kind: 'character', text: 'ROY' },
        { kind: 'dialog', text: "The phone in the lot's been dead since April." },
        { kind: 'description', text: 'She slides a mug across the laminate without being asked.' },
        { kind: 'character', text: 'DELPHINE' },
        { kind: 'dialog', text: 'Then you should have written. People still do that.' },
        { kind: 'description', text: 'Headlights sweep the far wall and hold there a beat too long.' },
        { kind: 'character', text: 'ROY' },
        { kind: 'dialog', text: "That's not for us. Sit down." }
      ]
    };
  }
}
