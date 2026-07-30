import { Component, Input, Output, EventEmitter, ContentChildren, QueryList, AfterContentInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TailwindTableColumnDirective } from './tailwind-table-column.directive';


export interface TableColumn {
  key: string;
  header: string;
  cell?: (item: any) => string;
  /** Mobile card layout: badge (scene #), primary (main text), meta (secondary), hide */
  role?: 'badge' | 'primary' | 'meta' | 'hide';
}

@Component({
  selector: 'app-tailwind-table',
  templateUrl: './tailwind-table.component.html',
  styleUrls: ['./tailwind-table.component.css'],
  standalone: false
})
export class TailwindTableComponent implements AfterContentInit, OnChanges {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() selectable: boolean = false;
  @Input() pagination: boolean = false;
  @Input() pageSize: number = 10;
  /** Include `0` for "All". Defaults to 10 / 20 / 50 / All. */
  @Input() pageSizeOptions: number[] = [10, 20, 50, 0];
  @Input() selectedItems: any[] = [];
  
  @Output() rowClick = new EventEmitter<any>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
  
  @ContentChildren(TailwindTableColumnDirective) columnList!: QueryList<TailwindTableColumnDirective>;
  
  currentPage: number = 1;
  totalPages: number = 1;
  displayData: any[] = [];
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // For template access
  Math = Math;

  /** Columns shown as the scene-number badge on mobile cards. */
  get badgeColumns(): TableColumn[] {
    return this.columns.filter(c => (c.role || this.inferRole(c, 0)) === 'badge');
  }

  /** Main title/body column(s) for mobile cards. */
  get primaryColumns(): TableColumn[] {
    return this.columns.filter(c => (c.role || this.inferRole(c, 1)) === 'primary');
  }

  /** Secondary meta line on mobile cards. */
  get metaColumns(): TableColumn[] {
    return this.columns.filter(c => (c.role || this.inferRole(c, 2)) === 'meta');
  }

  private inferRole(column: TableColumn, index: number): 'badge' | 'primary' | 'meta' | 'hide' {
    if (column.role) return column.role;
    if (column.key === 'sceneNumberText' || column.key === 'sceneNumber') return 'badge';
    if (column.key === 'text' || column.key === 'location' || column.key === 'name') return 'primary';
    if (index === 0) return 'badge';
    if (index === 1) return 'primary';
    return 'meta';
  }

  cellValue(item: any, column: TableColumn): string {
    if (column.cell) return column.cell(item);
    const raw = item?.[column.key];
    return raw == null ? '' : String(raw);
  }
  
  ngAfterContentInit() {
    // Only use columnList if columns input is empty
    if (this.columns.length === 0 && this.columnList && this.columnList.length > 0) {
      this.columns = this.columnList.toArray().map(col => ({
        key: col.key,
        header: col.header,
        cell: col.cell
      }));
    }
    
    
    this.updateDisplayData();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.data || changes.pagination || changes.pageSize || changes.sortColumn || changes.sortDirection) {
      this.updateDisplayData();
    }
  }
  
  /** Effective page size — `0` means show all rows. */
  get effectivePageSize(): number {
    if (!this.data?.length) return 10;
    if (!this.pageSize || this.pageSize <= 0) return this.data.length;
    return this.pageSize;
  }

  setupPagination(): void {
    if (this.pagination && this.data) {
      const size = this.effectivePageSize;
      this.totalPages = Math.max(1, Math.ceil(this.data.length / size));
      
      // Ensure current page is valid
      if (this.currentPage > this.totalPages) {
        this.currentPage = 1;
      }
      
      // Update display data
      const start = (this.currentPage - 1) * size;
      const end = Math.min(start + size, this.data.length);
      this.displayData = this.data.slice(start, end);
    } else {
      this.displayData = this.data ? [...this.data] : [];
      this.totalPages = 1;
      this.currentPage = 1;
    }
  }

  onPageSizeChange(size: number | string): void {
    const next = typeof size === 'string' ? parseInt(size, 10) : size;
    this.pageSize = Number.isFinite(next) ? next : 10;
    this.currentPage = 1;
    this.updateDisplayData();
    this.pageSizeChange.emit(this.pageSize);
    this.pageChange.emit(this.currentPage);
  }

  pageSizeLabel(size: number): string {
    return size === 0 ? 'All' : String(size);
  }
  
  get sortedData(): any[] {
    if (!this.data || this.data.length === 0) {
      return [];
    }
    
    let result = [...this.data];
    if (this.sortColumn) {
      result.sort((a, b) => {
        const valueA = a[this.sortColumn];
        const valueB = b[this.sortColumn];
    
        if (valueA === undefined || valueA === null) return this.sortDirection === 'asc' ? -1 : 1;
        if (valueB === undefined || valueB === null) return this.sortDirection === 'asc' ? 1 : -1;
        
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return this.sortDirection === 'asc' 
            ? valueA.localeCompare(valueB) 
            : valueB.localeCompare(valueA);
        }
        
        
        const comparison = valueA < valueB ? -1 : (valueA > valueB ? 1 : 0);
        return this.sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
   
    if (this.pagination) {
      const size = this.effectivePageSize;
      const start = (this.currentPage - 1) * size;
      const end = Math.min(start + size, result.length);
      return result.slice(start, end);
    }
    
    return result;
  }
  
  get startIndex(): number {
    return (this.currentPage - 1) * this.effectivePageSize;
  }
  
  get endIndex(): number {
    return Math.min(this.startIndex + this.effectivePageSize, this.data?.length || 0);
  }
  
  get pageNumbers(): number[] {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      // Show all pages if there are few
      for (let i = 0; i < this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show a subset of pages with current page in the middle
      let startPage = Math.max(0, this.currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(this.totalPages - 1, startPage + maxVisiblePages - 1);
      
      // Adjust if we're near the end
      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(0, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }
  
  sort(column: string) {
    if (this.sortColumn === column) {
      // Toggle direction
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New column, default to ascending
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }
  
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.pageChange.emit(this.currentPage);
    }
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.pageChange.emit(this.currentPage);
    }
  }
  
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    
    this.currentPage = page;
    this.updateDisplayData();
    this.pageChange.emit(page);
  }
  
  isSelected(item: any): boolean {
    if (!item || !this.selectedItems) return false;
    return this.selectedItems.some(selected => selected.index === item.index);
  }
  
  toggleSelection(event: Event, item: any): void {
    // Just emit the item that was clicked
    this.selectionChange.emit(item);
  }
  
  onRowClick(item: any): void {
    // Only emit the clicked item, don't modify the selection
    this.rowClick.emit(item);
  }
  
  updateDisplayData(): void {
    this.setupPagination();
  }
} 