/**
 * ArsAnchor
 * When created with ArsObserver.createAnchor the value of this
 * object (value:E) will change when the current value of the
 * observer, which created this object, changes.
 *
 * Use:
 * It is preferred to use variables instead of functions for
 * 'attributes with changing values'.
 *
 * E.g.: @angular/common structural directive *ngIf=""
 *
 * *ngIf="getState()"
 * the function getState() will be applied
 * for every detected change, even if the value returned by the
 * function is the same. Depending on the implementation of that
 * function, it might decrease performance.
 *
 * *ngIf="state"
 * does not apply a function
 *
 */
export class ArsAnchor<E> {
  public value:E;
  constructor(private rel:()=>void){}
  public release():void{
    this.rel();
  }
}

/**
 * ArsObserver
 * State-Change-Listener
 */
export class ArsObserver<E> {

  private previous:E;
  private current:E;
  private listener:((e:ArsObserver<E>)=>void)[];
  private compare:(a:E,b:E)=>boolean;//a current b new value
  constructor(e?:E){
    if(e)this.current=e;
    this.compare=(a,b)=>a===b;
  }

  public setPredicate(compare:(a:E,b:E)=>boolean) {
    this.compare=compare;
  }

  public set(e:E):boolean{
    if(this.compare(this.current,e)){
      this.previous=this.current;
      this.current=e;
      this.listener.forEach(listener=>listener(this));
      return true;
    }
    return false;
  }

  public get():E{
    return this.current;
  }

  public getPrevious():E{
    return this.previous;
  }

  public empty():boolean{
    return this.current == null;
  }

  public onChange(consumer:(e:ArsObserver<E>)=>void):()=>void {
    this.listener.push(consumer);
    return ()=>this.listener
      =this.listener.splice(this.listener.indexOf(consumer));
  }

  // this works for some reason
  public createAnchor():ArsAnchor<E>{
    const anchor:ArsAnchor<E>=new ArsAnchor<E>(
      this.onChange(e=>anchor.value=e.get()));
    return anchor;
  }

}
