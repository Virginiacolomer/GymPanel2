import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/page-header/page-header';
import { PageBgComponent } from '../../shared/page-bg/page-bg';

@Component({
  standalone: true,
  imports: [PageHeaderComponent, PageBgComponent],
  templateUrl: './horarios.html',
  styleUrl: './horarios.css',
})
export class Horarios {}