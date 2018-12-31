import { Injectable } from '@angular/core';

/*
  Generated class for the UtilProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class UtilProvider {

  constructor() {
  }

  translate(color) {
    if (color == 'Maroon') {
      return 'Marron';
    }
    if (color == 'Red') {
      return 'Rouge';
    }
    if (color == 'Orange') {
      return 'Orange';
    }
    if (color == 'Yellow') {
      return 'Jaune';
    }
    if (color == 'Olive') {
      return 'Olive';
    }
    if (color == 'Green') {
      return 'Vert';
    }
    if (color == 'Purple') {
      return 'Violet';
    }
    if (color == 'Fuchsia') {
      return 'Fuchsia';
    }
    if (color == 'Lime') {
      return 'Citron vert';
    }
    if (color == 'Teal') {
      return 'Sarcelle';
    }
    if (color == 'Aqua') {
      return 'Bleu marine';
    }
    if (color == 'Blue') {
      return 'Bleu';
    }
    return color;
  }
}
