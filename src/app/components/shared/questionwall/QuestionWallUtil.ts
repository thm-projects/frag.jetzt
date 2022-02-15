import { EventEmitter } from '@angular/core';

export interface Runnable {
  ():void;
}

export interface Supplier<E> {
  ():E;
}

export interface Consumer<E> {
  (e:E):void;
}

export interface EscapeListener extends Consumer<Runnable> {

}

