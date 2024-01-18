import { Component, ElementRef, Optional, SkipSelf, inject } from "@angular/core";

@Component({
    standalone: true,
    selector: 'my-test',
    template: ``
})
export class MyTestComponent {
    private elementRef: ElementRef = inject(ElementRef
            ,{ optional: true, host: true, self: true, skipSelf: true });

    constructor() {
    }
}
