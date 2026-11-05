import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditorSemanaComponent } from './editor-semana';

describe('EditorSemanaComponent', () => {
    let component: EditorSemanaComponent;
    let fixture: ComponentFixture<EditorSemanaComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditorSemanaComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(EditorSemanaComponent);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});