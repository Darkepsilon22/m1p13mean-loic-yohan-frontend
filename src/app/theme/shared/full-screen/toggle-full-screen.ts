import {Directive, ElementRef, HostListener} from '@angular/core';

import screenfull from 'screenfull';

@Directive({
  selector: '[appToggleFullScreen]'
})
export class ToggleFullScreenDirective {
  constructor(private elements: ElementRef) {}

  @HostListener('click')
  onClick() {
    if (screenfull.isEnabled) {
      const feather = (this.elements).nativeElement.querySelector('.feather');
      if (feather) {
        feather.classList.toggle('icon-maximize');
        feather.classList.toggle('icon-minimize');
      }
      screenfull.toggle();
    }
  }
}
