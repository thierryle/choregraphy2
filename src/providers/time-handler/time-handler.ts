import { Injectable } from '@angular/core';

/*
  Generated class for the TimeHandlerProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class TimeHandlerProvider {
  previousTime: number; // Heure du dernier appel à la méthode frame
  elapsedTime: number; // Durée entre deux appels à la méthode frame
  currentDuration: number;
  stepCurrentDuration: number; // Durée actuelle du step
  timer: any;

  constructor() {
  }

  initStep() {
    this.previousTime = 0;
    this.stepCurrentDuration = 0;
    this.elapsedTime = 0;
  }
  
  frame(timestamp) {
    if (this.previousTime != 0) {
      // Au premier appel, on laisse le différentiel à zéro, aux appels suivants (comme ici), on calcule le différentiel
      this.elapsedTime = timestamp - this.previousTime;
    }
    this.previousTime = timestamp;
    
    // Durée totale du step
    this.stepCurrentDuration += this.elapsedTime;
  }
  
  initTimer() {
    // Timer
    this.currentDuration = 0;
    this.timer = setInterval(() => {
      this.currentDuration += 1000;
    }, 1000);
  }
  
  stopTimer() {
    clearInterval(this.timer);
  }
  
  getTimer() {
    let result;
    let minutes = Math.floor(this.currentDuration / 60000);
    if (minutes < 10) {
      result = '0' + minutes;
    } else {
      result = minutes.toString();
    }
    let seconds = (this.currentDuration / 1000) - (minutes * 60);
    if (seconds < 10) {
      result += ':0' + seconds;
    } else {
      result += ':' + seconds;
    }
    return result;
  }
}
