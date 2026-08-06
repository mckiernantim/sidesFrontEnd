import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  SimpleChanges,
  ChangeDetectorRef,
  ViewChild,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  HostListener,
} from '@angular/core';
import { Line } from 'src/app/types/Line';
import { UploadService } from 'src/app/services/upload/upload.service';
import { StripeService } from 'src/app/services/stripe/stripe.service';
import { TokenService } from 'src/app/services/token/token.service';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { PdfService } from 'src/app/services/pdf/pdf.service';
import { LastLooksPageComponent } from '../last-looks-page/last-looks-page.component';
import { UndoService } from 'src/app/services/edit/undo.service';
import { cloneDeep } from 'lodash';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

import { fadeInOutAnimation } from 'src/app/animations/animations';

interface QueueItem {
  pageIndex: number;
  line: Line;
}

interface Scene {
  id: string;
  pageIndex: number;
  sceneNumber: string;
  firstLine: number;
  lastLine: number;
  firstPage: number;
  lastPage: number;
  lines: Line[];
  pageRanges: {
    startPage: number;
    endPage: number;
    sharedPages: number[];
  };
}

interface Page {
  pageNumber: number;
  lines: Line[];
  sceneIds: string[];
  isShared: boolean;
}

interface DocumentState {
  scenes: Map<string, Scene>;
  pages: Page[];
  sceneOrder: string[];
  sharedPages: Set<number>;
}

/** Canonical page dimensions — never sent to the PDF service. */
const PAGE_WIDTH = 816;
const PAGE_HEIGHT = 1056;
/** Updated per spec FR-014: 0.25 (was 0.35) */
const MIN_SCALE = 0.25;
/** Updated per spec FR-014: 2.0 (was 1.5) */
const MAX_SCALE = 2.0;

@Component({
  selector: 'app-last-looks',
  templateUrl: './last-looks.component.html',
  styleUrls: ['./last-looks.component.css'],
  animations: [fadeInOutAnimation],
  standalone: false,
})
export class LastLooksComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(LastLooksPageComponent) public lastLooksPage: LastLooksPageComponent;
  @ViewChild('viewerContainer') viewerContainer?: ElementRef<HTMLElement>;

  constructor(
    private upload: UploadService,
    private stripe: StripeService,
    private token: TokenService,
    private router: Router,
    private cdRef: ChangeDetectorRef,
    public pdf: PdfService,
    private undoService: UndoService,
  ) {}

  // ── Existing Inputs (carry-over) ──────────────────────────────────────────
  doc: any;
  private documentRegeneratedSubscription: Subscription;
  @Input() editState: boolean = false;
  @Input() resetDocState: boolean = false;
  @Input() selectedLineState: string = '';
  @Input() undoState: boolean = false;
  @Input() triggerLastLooksAction: string = '';
  @Input() callsheetPath: string = '';

  // ── New Inputs for the rail ───────────────────────────────────────────────
  @Input() selectedScenes: any[] = [];
  @Input() userData: any = null;
  @Input() isCheckingSubscription: boolean = false;
  @Input() callsheetReady: boolean = false;
  @Input() watermark: string = '';
  @Input() hasWatermark: boolean = false;
  @Input() callsheetState: boolean = false;
  @Input() callsheet: string = '';
  @Input() scriptName: string = '';
  @Input() scriptDate: number | null = null;

  // ── Existing Outputs (carry-over) ─────────────────────────────────────────
  @Output() pageUpdate = new EventEmitter<Line[]>();
  @Output() editModeToggle = new EventEmitter<void>();

  // ── New Outputs relayed from rail ─────────────────────────────────────────
  @Output() sceneReorder = new EventEmitter<CdkDragDrop<any[]>>();
  @Output() sceneRemove = new EventEmitter<any>();
  @Output() sceneNumberEdit = new EventEmitter<{ scene: any; event: FocusEvent }>();
  @Output() sceneTextEdit = new EventEmitter<{ scene: any; event: FocusEvent }>();
  @Output() getSides = new EventEmitter<void>();
  @Output() signIn = new EventEmitter<void>();
  @Output() backToScenes = new EventEmitter<void>();
  @Output() callsheetUpload = new EventEmitter<any>();
  @Output() watermarkUpdate = new EventEmitter<any>();
  @Output() watermarkRemove = new EventEmitter<void>();

  // ── Page / document state ────────────────────────────────────────────────
  pages: any[];
  hasCallsheet: boolean = false;
  initialDocState: any[];
  currentPageIndex: number = 0;
  currentPage: any = 0;
  startingLinesOfDoc = [];
  canEditDocument: boolean = false;
  docChangesQueue: QueueItem[];
  selectedLine: Line | null = null;
  undoQueue: Subscription;
  sceneBreaks: any[];
  acceptableCategoriesForFirstLine = [
    'dialog', 'character', 'description', 'first-description',
    'scene-header', 'short-dialog', 'parenthetical', 'more', 'shot',
  ];
  searchQuery: string = '';
  selectedLines: Line[] = [];
  isMultipleSelection: boolean = false;
  resetSubscription: Subscription;
  showInstructions: boolean = false;
  scenes: Scene[] = [];

  @Output() lineSelected = new EventEmitter<Line>();
  private finalDocumentDataSubscription: Subscription;
  private documentReorderedSubscription: Subscription;

  // ── Rail state ────────────────────────────────────────────────────────────
  /**
   * null = auto (open when not editing, closed when editing)
   * true = user manually pinned open
   * false = user manually pinned closed
   */
  railManual: boolean | null = null;

  get railOpen(): boolean {
    return this.railManual === null ? !this.editState : this.railManual;
  }

  // ── Headline breakpoint ───────────────────────────────────────────────────
  get showHeadline(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerHeight >= 860 && !this.editState;
  }

  // ── Zoom — authoritative source (FR-013, FR-014) ─────────────────────────
  /** Fit-to-width scale; computed by ResizeObserver. */
  fitScale: number = 1;
  /** null = follow fitScale; number = user override */
  zoomOverride: number | null = null;
  /** Which fit mode is active (for control-bar highlight). */
  zoomMode: 'fitW' | 'fitP' | 'manual' = 'fitW';
  private viewportObserver?: ResizeObserver;

  get pageScale(): number {
    const raw = this.zoomOverride ?? this.fitScale;
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, raw));
  }

  get zoomPercent(): number {
    return Math.round(this.pageScale * 100);
  }

  get isFitZoom(): boolean {
    return this.zoomMode === 'fitW';
  }

  get isFitPage(): boolean {
    return this.zoomMode === 'fitP';
  }

  get canZoomIn(): boolean {
    return this.pageScale < MAX_SCALE - 0.001;
  }

  get canZoomOut(): boolean {
    return this.pageScale > MIN_SCALE + 0.001;
  }

  zoomIn(): void {
    this.zoomMode = 'manual';
    this.zoomOverride = Math.min(MAX_SCALE, this.pageScale + 0.1);
    this.cdRef.detectChanges();
  }

  zoomOut(): void {
    this.zoomMode = 'manual';
    this.zoomOverride = Math.max(MIN_SCALE, this.pageScale - 0.1);
    this.cdRef.detectChanges();
  }

  /**
   * Fit Width: containerWidth / PAGE_WIDTH with NO Math.min(1,...) ceiling.
   * Intentional: allows scale > 1.0 when the container is wider than 816px,
   * giving users a true fit-to-viewport experience on wide monitors.
   */
  fitToWidth(): void {
    this.zoomMode = 'fitW';
    this.zoomOverride = null;
    this.measureFitScale();
  }

  /**
   * Fit Page: min(w/816, h/1056) so the whole page is visible.
   */
  fitPage(): void {
    const el = this.viewerContainer?.nativeElement;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (w <= 0 || h <= 0) return;
    this.zoomMode = 'fitP';
    this.zoomOverride = Math.min(w / PAGE_WIDTH, h / PAGE_HEIGHT);
    this.cdRef.detectChanges();
  }

  private measureFitScale(): void {
    const el = this.viewerContainer?.nativeElement;
    if (!el) return;
    const styles = getComputedStyle(el);
    const hPad = parseFloat(styles.paddingLeft || '0') + parseFloat(styles.paddingRight || '0');
    const available = el.clientWidth - hPad;
    if (available <= 0) return;
    // FR-015: No ceiling — scale may exceed 1.0 on wide containers.
    const next = available / PAGE_WIDTH;
    if (Math.abs(next - this.fitScale) < 0.005) return;
    this.fitScale = next;
    this.cdRef.detectChanges();
  }

  // ── Rail toggle (desktop / tablet strip) ──────────────────────────────────
  toggleRail(): void {
    this.railManual = !this.railOpen;
  }

  // ── Mobile panel: Preview (Last Looks) vs Controls ────────────────────────
  /** Mobile-only view switcher. Desktop ignores this and uses the side rail. */
  mobilePanel: 'preview' | 'controls' = 'preview';

  setMobilePanel(panel: 'preview' | 'controls'): void {
    this.mobilePanel = panel;
    if (panel === 'preview') {
      // Re-measure fit after the viewer becomes visible again
      setTimeout(() => {
        this.fitToWidth();
        this.cdRef.detectChanges();
      }, 0);
    }
  }

  // ── Edit tools strip visibility ───────────────────────────────────────────
  showEditTips: boolean = false;

  /**
   * Condense repaginates by dropping hidden lines, which discards x-box and
   * bar annotations so they never reach the final document. Hidden until that
   * is fixed; flip back to true to restore the tool.
   */
  condenseEnabled: boolean = false;

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.pages = [];

    // FR-032 / US-5: start collapsed on tablet/phone so the viewer owns the width.
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      this.railManual = false;
    }

    if (this.pdf.finalDocument?.data) {
      this.doc = this.pdf.finalDocument.data;
      this.pages = this.doc;
      this.currentPage = this.pages[this.currentPageIndex] || [];
      this.processLinesForLastLooks(this.pages);
    }

    this.finalDocumentDataSubscription = this.pdf.finalDocumentData$.subscribe((data) => {
      if (data) {
        if (this.pdf.finalDocument?.data) {
          this.pages = [...this.pdf.finalDocument.data];
        }
        if (this.pages[this.currentPageIndex]) {
          this.currentPage = [...this.pages[this.currentPageIndex]];
        }
        this.cdRef.detectChanges();
      }
    });

    this.documentReorderedSubscription = this.pdf.documentReordered$.subscribe((reordered) => {
      if (reordered) this.handleDocumentReorder();
    });

    this.documentRegeneratedSubscription = this.pdf.documentRegenerated$.subscribe((regenerated) => {
      if (regenerated) this.refreshDocument();
    });

    this.undoQueue = this.undoService.undoRedo$.subscribe(() => {
      this.handleUndoRedoUpdate();
    });

    this.selectedLine = null;
    this.selectedLines = [];
    this.isMultipleSelection = false;
    this.sceneBreaks = [];

    const callsheetData = localStorage.getItem('callsheetData');
    if (callsheetData) {
      try {
        const parsed = JSON.parse(callsheetData);
        const displayUrl = parsed.imageUrl || parsed.previewUrl;
        if (displayUrl && this.pdf.finalDocument?.data && !this.pdf.isProcessingForServer()) {
          this.insertCallsheetPage(displayUrl);
        }
      } catch (_) {}
    } else if (this.callsheetPath && !this.pdf.isProcessingForServer()) {
      this.insertCallsheetPage(this.callsheetPath);
    }

    this.initialDocState = this.doc?.map((page) => [...page]);
    this.establishInitialLineState();
    this.initializeScenes();
    this.canEditDocument = this.editState;
  }

  ngAfterViewInit(): void {
    if (this.viewerContainer && typeof ResizeObserver !== 'undefined') {
      this.viewportObserver = new ResizeObserver(() => this.measureFitScale());
      this.viewportObserver.observe(this.viewerContainer.nativeElement);
    }
    this.measureFitScale();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resetDocState'] && changes['resetDocState'].currentValue) {
      this.undoService.reset();
      this.resetDocumentToInitialState();
    }

    if (!this.canEditDocument) {
      this.selectedLine = null;
    }

    if (changes['callsheetPath']) {
      const newPath = changes['callsheetPath'].currentValue;
      const prevPath = changes['callsheetPath'].previousValue;

      if (this.pdf.isProcessingForServer()) return;

      if (newPath) {
        const callsheetData = localStorage.getItem('callsheetData');
        if (callsheetData) {
          try {
            const parsed = JSON.parse(callsheetData);
            const displayUrl = parsed.imageUrl || parsed.previewUrl;
            if (displayUrl) {
              this.insertCallsheetPage(displayUrl);
              if (this.pdf.finalDocument?.data) {
                this.pages = this.pdf.finalDocument.data;
                this.currentPage = this.pages[this.currentPageIndex] || [];
                this.processLinesForLastLooks(this.pages);
                this.cdRef.detectChanges();
              }
            }
          } catch (_) {}
        } else {
          this.insertCallsheetPage(newPath);
          if (this.pdf.finalDocument?.data) {
            this.pages = this.pdf.finalDocument.data;
            this.currentPage = this.pages[this.currentPageIndex] || [];
            this.processLinesForLastLooks(this.pages);
            this.cdRef.detectChanges();
          }
        }
      } else if (newPath === null && prevPath) {
        this.removeCallsheetFromDocument();
      }
    }

    if (changes['editState']) {
      const wasEditing = changes['editState'].previousValue;
      const isEditing = changes['editState'].currentValue;
      this.canEditDocument = isEditing;

      // Auto-collapse rail when entering edit mode (FR-007)
      if (isEditing && !wasEditing) {
        if (this.railManual === null) {
          // auto: rail will be closed (railOpen = !editing = false)
          // no change needed; railOpen getter handles it
        }
      }

      // Clear railManual on Save/Reset exit from edit (FR-007)
      if (!isEditing && wasEditing) {
        this.railManual = null;
      }
    }
  }

  ngOnDestroy(): void {
    this.viewportObserver?.disconnect();
    this.finalDocumentDataSubscription?.unsubscribe();
    this.documentReorderedSubscription?.unsubscribe();
    this.documentRegeneratedSubscription?.unsubscribe();
    this.undoQueue?.unsubscribe();
    this.pages = null;
    this.currentPage = null;
    this.doc = null;
    this.scenes = [];
    this.selectedLines = [];
    this.selectedLine = null;
  }

  // ── Edit mode control bar handlers ───────────────────────────────────────
  onEditPdfClick(): void {
    this.editModeToggle.emit();
  }

  onSaveChanges(): void {
    // Delegate to page component if available
    if (this.lastLooksPage) {
      this.lastLooksPage.saveChanges();
    }
    this.editModeToggle.emit();
    this.railManual = null; // Clear manual pin on exit
  }

  onUndoClick(): void {
    this.lastLooksPage?.performUndo();
  }

  onRedoClick(): void {
    this.lastLooksPage?.performRedo();
  }

  onResetClick(): void {
    this.lastLooksPage?.resetToInitialState();
    this.railManual = null; // Clear manual pin on exit
  }

  get canUndo(): boolean {
    return this.lastLooksPage?.canUndo ?? this.undoService.canUndo;
  }

  get canRedo(): boolean {
    return this.lastLooksPage?.canRedo ?? this.undoService.canRedo;
  }

  // ── Existing document methods (carry-over, unchanged) ─────────────────────

  isCallsheetPage(page: any): boolean {
    return page && page[0] && (
      page[0].type === 'callsheet' ||
      page[0].category === 'callsheet'
    );
  }

  establishInitialLineState(): void {
    this.processLinesForLastLooks(this.pages);
    this.updateDisplayedPage();
  }

  findLastLinesOfScenes(pages): object {
    const lastLinesOfScenes = {};
    pages.forEach((page) => {
      page.forEach((line) => {
        if (line.category !== 'hidden' && line.category !== 'page-number') {
          lastLinesOfScenes[line.sceneIndex] = line.index;
        }
      });
    });
    return lastLinesOfScenes;
  }

  private insertCallsheetPage(imagePath: string): void {
    if (this.pdf.isProcessingForServer()) return;

    if (this.pdf.finalDocument?.data) {
      this.undoService.recordDocumentReorderChange(
        cloneDeep(this.pdf.finalDocument.data),
        'Insert callsheet page'
      );
    }

    const callsheetPage = [{
      type: 'callsheet', category: 'callsheet', imagePath,
      visible: 'true', docPageIndex: 0, docPageLineIndex: 0,
      calculatedXpos: '0px', calculatedYpos: '0px',
      xPos: 0, yPos: 0, text: 'CALLSHEET', index: -1, page: 0,
      loadError: null, bar: 'hideBar', cont: 'hideCont',
      end: 'hideEnd', hidden: '', trueScene: ''
    }];

    if (this.pdf.finalDocument?.data) {
      this.pdf.finalDocument.data = this.pdf.finalDocument.data.filter(page =>
        !(page[0] && (page[0].type === 'callsheet' || page[0].category === 'callsheet'))
      );
      this.pdf.finalDocument.data = [callsheetPage, ...this.pdf.finalDocument.data];
      this.pages = this.pdf.finalDocument.data;
      this.hasCallsheet = true;
      this.currentPageIndex = 0;
      this.currentPage = this.pages[0] || [];
      this.pdf.saveDocumentState();
      this.cdRef.detectChanges();
      if (this.lastLooksPage) this.lastLooksPage.cdRef.detectChanges();
      this.pageUpdate.emit(this.currentPage);
    }
  }

  private handleDocumentReorder(): void {
    if (!this.pdf.finalDocument?.data) {
      return;
    }

    // Deep-spread every page into new arrays of new line objects.
    // This guarantees Angular sees fresh object references for every line,
    // so *ngIf / property-binding expressions (line.bar, line.end, line.cont,
    // line.visible, …) are always re-evaluated after a reorder — even when the
    // underlying line objects were mutated in-place by reorderScenes.
    this.pages = this.pdf.finalDocument.data.map(page =>
      page.map((line: any) => ({ ...line }))
    );

    // Mirror the spread into finalDocument.data so the service and the component
    // stay in sync with the same new references.
    this.pdf.finalDocument.data = this.pages;

    // Keep this.doc in sync so findFirstLineOfNextPage() uses current order
    this.doc = this.pages;

    // Reset to first page
    this.currentPageIndex = 0;

    // Set current page (new array of new line objects so child always re-renders)
    this.currentPage = [...(this.pages[0] || [])];

    // Re-process lines for the new document order
    this.processLinesForLastLooks(this.pages);

    // Clear any selections since we're on a new page order
    this.selectedLine = null;
    this.selectedLines = [];
    this.isMultipleSelection = false;

    // Force change detection
    this.cdRef.detectChanges();
  }

  handlePageUpdate(updatedPage: any): void {
    if (!this.isCallsheetPage(updatedPage)) {
      this.pages[this.currentPageIndex] = [...updatedPage];
      updatedPage.forEach((line: any) => {
        if (line && line.docPageIndex !== undefined && line.docPageLineIndex !== undefined) {
          this.pdf.updateLine(line.docPageIndex, line.docPageLineIndex, line, true);
        }
      });
      this.currentPage = [...updatedPage];
      this.cdRef.detectChanges();
    }
  }

  handleWaterMarkUpdate(_newWatermark: string): void {}

  processLinesForLastLooks(pages: Line[][]): void {
    if (!pages || pages.length === 0) return;
    pages.forEach(page => {
      if (!page || page.length === 0) return;
      page.forEach(line => {
        if (line) {
          this.adjustSceneNumberPosition(line);
          this.adjustBarPosition(line);
          this.calculateYPositions(line);
          if (!line.calculatedXpos || line.calculatedXpos === 'undefinedpx' || line.calculatedXpos === 'NaNpx') {
            const xPosValue = line.xPos !== undefined ? Number(line.xPos) : 0;
            line.calculatedXpos = (xPosValue * 1.3 + 'px');
          }
          if (line.endY !== undefined) {
            if (!line.calculatedEnd || line.calculatedEnd === 'undefinedpx' || line.calculatedEnd === 'NaNpx') {
              line.calculatedEnd = (Number(line.endY) * 1.3 + 'px');
            }
          } else {
            if (!line.calculatedEnd || line.calculatedEnd === 'undefinedpx' || line.calculatedEnd === 'NaNpx') {
              line.calculatedEnd = Number(line.yPos) > 90 ? Number(line.yPos) * 1.3 + 'px' : '90px';
            }
          }
          if (line.visible === undefined) line.visible = 'true';
        }
      });
    });
  }

  hideBars(line: Line): void {
    if (line.bar !== 'bar') line.bar = 'hideBar';
    if (line.end !== 'END') line.bar = 'hideEnd';
    if (!line.cont) line.cont = 'hideCont';
  }

  resetDocumentToInitialState(): void {
    this.pdf.resetToInitialState();
    this.pages = JSON.parse(JSON.stringify(this.pdf.finalDocument?.data || []));
    this.currentPageIndex = 0;
    this.currentPage = JSON.parse(JSON.stringify(this.pages[this.currentPageIndex] || []));
    this.selectedLine = null;
    this.selectedLines = [];
    this.isMultipleSelection = false;
    this.processLinesForLastLooks(this.pages);
    this.cdRef.detectChanges();
  }

  updateDisplayedPage(forceDeepClone = true): void {
    if (!this.pages || this.pages.length === 0) return;
    const currentPage = this.pages[this.currentPageIndex];
    if (!currentPage) return;
    this.handleCallsheetPage(currentPage);
    this.currentPage = forceDeepClone
      ? JSON.parse(JSON.stringify(currentPage))
      : [...currentPage];
    this.selectedLine = null;
    this.selectedLines = [];
    this.isMultipleSelection = false;
    this.cdRef.detectChanges();
  }

  previousPage(): void {
    if (this.currentPageIndex > 0) {
      if (this.editState) this.saveCurrentPageState();
      this.currentPageIndex--;
      this.updateDisplayedPage(false);
    }
  }

  nextPage(): void {
    if (this.currentPageIndex < this.pages.length - 1) {
      if (this.editState) this.saveCurrentPageState();
      this.currentPageIndex++;
      this.updateDisplayedPage(false);
    }
  }

  adjustSceneNumberPosition(line: Line): void {
    if (line.category === 'scene-header' && !line.calculatedXpos) {
      line.calculatedXpos = Number(line.xPos) * 1.3 + 'px';
    }
  }

  adjustBarPosition(line: Line): void {
    if (line.barY) {
      line.calculatedBarY = line.calculatedBarY || (Number(line.barY) * 1.3 + 'px');
    }
  }

  calculateYPositions(line: Line): void {
    if (line.yPos !== undefined) {
      if (!line.calculatedYpos || line.calculatedYpos === 'undefinedpx' || line.calculatedYpos === 'NaNpx') {
        line.calculatedYpos = (Number(line.yPos) * 1.3 + 'px');
      }
    }
  }

  public refreshDocument(): void {
    if (this.pdf.finalDocument?.data) {
      this.pages = this.pdf.finalDocument.data;
      // Always produce a new array reference so Angular's change detection sees a distinct
      // object from whatever handleDocumentReorder() set, and ngOnChanges fires correctly
      // in LastLooksPageComponent — preserving isDoubledPage and all other line properties.
      this.currentPage = [...(this.pages[this.currentPageIndex] || [])];
      this.processLinesForLastLooks(this.pages);
      this.cdRef.detectChanges();
    }
  }

  handleUndoRedoUpdate(): void {
    if (this.pdf.finalDocument?.data) {
      this.pages = [...this.pdf.finalDocument.data];
      if (this.pages[this.currentPageIndex]) {
        this.currentPage = [...this.pages[this.currentPageIndex]];
      } else {
        this.currentPageIndex = 0;
        this.currentPage = this.pages[0] || [];
      }
      this.processLinesForLastLooks(this.pages);
      this.selectedLine = null;
      this.selectedLines = [];
      this.isMultipleSelection = false;
      this.cdRef.detectChanges();
    }
  }

  handlePositionChange(event: any): void {
    const { line, lineIndex } = event;
    this.pages[this.currentPageIndex][lineIndex] = line;
    this.pdf.updateLinePosition(this.currentPageIndex, lineIndex, {
      calculatedBarY: line.calculatedBarY,
      calculatedEnd: line.calculatedEnd,
      barY: line.barY,
      endY: line.endY,
      calculatedXpos: line.calculatedXpos,
      calculatedYpos: line.calculatedYpos,
      xPos: line.xPos,
      yPos: line.yPos
    });
  }

  handleCategoryChange(_event: any): void {
    this.saveChangesToPdfService();
  }

  handleLineChange(event: any): void {
    const { line } = event;
    if (this.pages && this.pages[this.currentPageIndex]) {
      const page = this.pages[this.currentPageIndex];
      const lineIndex = page.findIndex((l: Line) => l.docPageLineIndex === line.docPageLineIndex);
      if (lineIndex !== -1) {
        page[lineIndex] = { ...line };
        this.currentPage = [...page];
        this.pdf.updateLine(this.currentPageIndex, line.docPageLineIndex, line);
        this.cdRef.detectChanges();
      }
    }
  }

  handleLineSelected(line: Line): void {
    this.selectedLine = line;
    this.lineSelected.emit(line);
  }

  handleProceedToCheckout(): void {}

  handleToggleVisibilityRequest(): void {
    if (this.selectedLine) {
      this.saveChangesToPdfService();
    }
  }

  handlePageChange(pageIndex: number): void {
    this.currentPageIndex = pageIndex;
    this.updateDisplayedPage();
  }

  onLineSelected(line: Line | null): void {
    if (!line) {
      this.selectedLine = null;
      this.selectedLines = [];
      this.isMultipleSelection = false;
      return;
    }
    if (line.multipleSelected) {
      this.isMultipleSelection = true;
      this.selectedLines = this.currentPage.filter((l: Line) =>
        this.lastLooksPage?.selectedLineIds.includes(l.index)
      );
      this.selectedLine = line;
    } else {
      this.isMultipleSelection = false;
      this.selectedLines = [line];
      this.selectedLine = line;
    }
  }

  saveChangesToPdfService(): void {
    this.pdf.finalDocument.data = [...this.pages];
    this.pdf.saveDocumentState();
  }

  saveCurrentPageState(): void {
    if (this.editState && this.currentPage) {
      this.pages[this.currentPageIndex] = [...this.currentPage];
    }
  }

  private removeCallsheetFromDocument(): void {
    if (this.pdf.finalDocument?.data) {
      this.undoService.recordDocumentReorderChange(
        cloneDeep(this.pdf.finalDocument.data),
        'Remove callsheet page'
      );
      this.pdf.finalDocument.data = this.pdf.finalDocument.data.filter(page =>
        !(page[0] && (page[0].type === 'callsheet' || page[0].category === 'callsheet'))
      );
      this.pages = this.pdf.finalDocument.data;
      this.hasCallsheet = false;
      if (this.currentPageIndex === 0 && this.isCallsheetPage(this.currentPage)) {
        this.currentPageIndex = 0;
        this.currentPage = this.pages[0] || [];
      }
      this.pdf.saveDocumentState();
      this.cdRef.detectChanges();
      if (this.lastLooksPage) this.lastLooksPage.cdRef.detectChanges();
      this.pageUpdate.emit(this.currentPage);
    }
  }

  private handleCallsheetPage(page: any): void {
    if (this.isCallsheetPage(page) && page[0]) {
      page[0].visible = 'true';
      this.hasCallsheet = true;
      if (!page[0].calculatedXpos) page[0].calculatedXpos = '0px';
      if (!page[0].calculatedYpos) page[0].calculatedYpos = '0px';
      this.cdRef?.detectChanges();
    }
  }

  initializeScenes(): void {
    this.scenes = [];
    let currentScene: Scene | null = null;
    this.pages.forEach((page, pageIndex) => {
      page.forEach((line: Line) => {
        if (line.category === 'scene-header' && line.visible === 'true') {
          if (currentScene) this.scenes.push(currentScene);
          currentScene = {
            id: '',
            sceneNumber: line.sceneNumberText || '',
            pageIndex,
            firstLine: line.index,
            lastLine: line.lastLine,
            firstPage: pageIndex,
            lastPage: pageIndex,
            lines: [line],
            pageRanges: { startPage: pageIndex, endPage: pageIndex, sharedPages: [] }
          };
        } else if (currentScene) {
          currentScene.lines.push(line);
          currentScene.lastLine = line.index;
          currentScene.lastPage = pageIndex;
        }
      });
    });
    if (currentScene) this.scenes.push(currentScene);
  }

  toggleInstructions(): void {
    this.showInstructions = !this.showInstructions;
  }

  onSearch(): void {
    if (!this.searchQuery?.trim()) return;
    const query = this.searchQuery.toLowerCase();
    for (let i = 0; i < this.pages.length; i++) {
      for (const line of this.pages[i]) {
        if (line.text && line.text.toLowerCase().includes(query)) {
          this.currentPageIndex = i;
          this.updateDisplayedPage();
          return;
        }
      }
    }
  }

  adjustYpositionAndReturnString(lineYPos: number): string {
    return Number(lineYPos) > 1 ? Number(lineYPos) * 1.3 + 'px' : '0';
  }

  revealContSubcategoryLines(line: Line): void {}
  adjustStartingLinesOfDoc(_line: Line): void {}
  adjustSceneHeader(line: Line): void {
    if (line.category === 'scene-header') {
      if (line.visible === 'true') { line.trueScene = 'true-scene'; line.bar = 'bar'; }
      else { line.bar = 'hideBar'; }
    }
  }
  getSceneBreaks(sceneArr: any[]): void {
    sceneArr.forEach((scene) => {
      this.sceneBreaks.push({
        first: scene.firstLine, last: scene.lastLine,
        scene: scene.sceneNumber, firstPage: scene.page,
      });
    });
  }
}
