import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './page-header.html',
  styleUrl: './page-header.css',
})
export class PageHeaderComponent {
  @Input() showBack = false;
  @Input() backHref = '/';
  @Input() brandHref = '/';
  @Input() loginHref = '/login';
  @Input() registerHref = '/register';
}
