import { trigger, state, style, transition, animate } from '@angular/animations';

export const slideAnimation = trigger('slideAnimation', [
  state('void', style({
    opacity: 0,
    transform: 'translateX(100%)'
  })),
  state('*', style({
    opacity: 1,
    transform: 'translateX(0%)'
  })),
  transition('void => *', [
    animate('0.5s cubic-bezier(0.4, 0, 0.2, 1)')
  ]),
  transition('* => void', [
    animate('0.5s cubic-bezier(0.4, 0, 0.2, 1)')
  ])
]);
