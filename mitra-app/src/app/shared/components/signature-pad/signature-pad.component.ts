import {
  Component, ElementRef, ViewChild, AfterViewInit, OnDestroy,
  output, input, signal,
} from '@angular/core';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  template: `
    <div class="sig-container">
      <label class="sig-label">{{ label() }}</label>
      <canvas
        #canvas
        class="sig-canvas"
        [class.has-signature]="hasSignature()"
        (pointerdown)="onPointerDown($event)"
        (pointermove)="onPointerMove($event)"
        (pointerup)="onPointerUp()"
        (pointerleave)="onPointerUp()"
      ></canvas>
      <div class="sig-actions">
        @if (hasSignature()) {
          <button type="button" class="sig-btn clear" (click)="clear()">Löschen</button>
          <button type="button" class="sig-btn confirm" (click)="confirm()">Bestätigen</button>
        }
      </div>
    </div>
  `,
  styles: [`
    .sig-container { display: flex; flex-direction: column; gap: 8px; }
    .sig-label {
      font-size: 13px; font-weight: 600;
      color: var(--text-secondary, #8b949e);
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .sig-canvas {
      width: 100%; height: 160px;
      border: 2px dashed var(--border-subtle, #333);
      border-radius: 8px; background: var(--bg-1, #161b22);
      touch-action: none; cursor: crosshair;
    }
    .sig-canvas.has-signature { border-style: solid; border-color: var(--accent, #2DD4BF); }
    .sig-actions { display: flex; gap: 8px; justify-content: flex-end; }
    .sig-btn {
      padding: 6px 16px; border-radius: 6px; border: none;
      font-size: 13px; font-weight: 500; cursor: pointer;
    }
    .sig-btn.clear {
      background: var(--bg-2, #21262d); color: var(--text-secondary, #8b949e);
    }
    .sig-btn.confirm {
      background: var(--accent, #2DD4BF); color: #fff;
    }
  `],
})
export class SignaturePadComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  readonly label = input<string>('Unterschrift');
  readonly existingSignature = input<string | undefined>();
  readonly signed = output<string>();

  readonly hasSignature = signal(false);

  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.setupCanvas();

    this.resizeObserver = new ResizeObserver(() => this.setupCanvas());
    this.resizeObserver.observe(canvas);

    const existing = this.existingSignature();
    if (existing) {
      this.loadImage(existing);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private setupCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.ctx.strokeStyle = '#2DD4BF';
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  private loadImage(dataUrl: string): void {
    const img = new Image();
    img.onload = () => {
      const canvas = this.canvasRef.nativeElement;
      const rect = canvas.getBoundingClientRect();
      this.ctx.drawImage(img, 0, 0, rect.width, rect.height);
      this.hasSignature.set(true);
    };
    img.src = dataUrl;
  }

  onPointerDown(event: PointerEvent): void {
    this.isDrawing = true;
    const { offsetX, offsetY } = event;
    this.ctx.beginPath();
    this.ctx.moveTo(offsetX, offsetY);
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.isDrawing) return;
    this.ctx.lineTo(event.offsetX, event.offsetY);
    this.ctx.stroke();
    this.hasSignature.set(true);
  }

  onPointerUp(): void {
    this.isDrawing = false;
  }

  clear(): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);
    this.hasSignature.set(false);
  }

  confirm(): void {
    const canvas = this.canvasRef.nativeElement;
    const dataUrl = canvas.toDataURL('image/png');
    this.signed.emit(dataUrl);
  }
}
