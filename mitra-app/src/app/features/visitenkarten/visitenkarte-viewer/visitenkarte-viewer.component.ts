import '@google/model-viewer';
import { Component, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-visitenkarte-viewer',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './visitenkarte-viewer.component.html',
  styleUrl: './visitenkarte-viewer.component.scss',
})
export class VisitkarteViewerComponent {
  @Input() fotoUrl: string | null = null;
  @Input() firma: string = '';
}
