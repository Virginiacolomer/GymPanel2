import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';

@Component({
  
  standalone: true,
  imports: [RouterLink, PageHeaderCompactComponent, PageBgComponent],
  templateUrl: './menu-admin.html',
  styleUrl: './menu-admin.css',
})
export class MenuAdmin {}

