import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ZoomableImageComponent } from '../../../../shared/zoomable-image/zoomable-image';
import { PlanDayConfig } from '../../models/plan.model';

@Component({
    selector: 'app-editor-semana',
    standalone: true,
    imports: [FormsModule, ZoomableImageComponent],
    templateUrl: './editor-semana.html',
    styleUrl: './editor-semana.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorSemanaComponent {
    readonly days = input<PlanDayConfig[]>([]);
    readonly editable = input<boolean>(false);
    readonly allowAddRemove = input<boolean>(false);
    readonly exerciseOptions = input<string[]>([]);

    readonly dayToggled = output<number>();
    readonly rowAdded = output<number>();
    readonly rowRemoved = output<{ dayIndex: number; rowIndex: number }>();
    readonly exerciseBlur = output<{ dayIndex: number; rowIndex: number }>();

    onToggle(index: number): void {
        this.dayToggled.emit(index);
    }

    onAddRow(dayIndex: number): void {
        this.rowAdded.emit(dayIndex);
    }

    onRemoveRow(dayIndex: number, rowIndex: number): void {
        this.rowRemoved.emit({ dayIndex, rowIndex });
    }

    onBlur(dayIndex: number, rowIndex: number): void {
        this.exerciseBlur.emit({ dayIndex, rowIndex });
    }
}