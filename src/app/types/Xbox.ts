export interface XboxData {
  id: string;
  pageIndex: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
  /** Line IDs (docPageLineIndex) owned by this X-box. */
  lineIds?: number[];
  isFreestanding?: boolean;
}
