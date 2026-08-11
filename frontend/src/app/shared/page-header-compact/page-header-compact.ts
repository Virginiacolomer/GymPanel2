import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header-compact',
  standalone: true,
  imports: [],
  templateUrl: './page-header-compact.html',
  styleUrl: './page-header-compact.css',
})
export class PageHeaderCompactComponent {
  @Input() backHref = '/';
  @Input() brandHref = '/';
}
