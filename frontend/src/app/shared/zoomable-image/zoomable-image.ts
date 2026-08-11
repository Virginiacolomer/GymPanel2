import { Component, HostListener, Input } from '@angular/core';

@Component({
  selector: 'app-zoomable-image',
  standalone: true,
  imports: [],
  templateUrl: './zoomable-image.html',
  styleUrl: './zoomable-image.css',
})
export class ZoomableImageComponent {
  @Input({ required: true }) src!: string;
  @Input() alt = '';

  isExpanded = false;

  open(): void {
    this.isExpanded = true;
  }

  close(): void {
    this.isExpanded = false;
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isExpanded) {
      this.close();
    }
  }
}
