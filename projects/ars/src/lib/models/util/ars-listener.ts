export class ArsListener<T> {

  private _listener:((value?:T)=>void)[]=[];

  public addListener(listener:(value?:T)=>void):()=>void{
    this._listener.push(listener);
    return ()=>this._removeListener(listener);
  }

  private _removeListener(listener:(value?:T)=>void){
    this._listener=this._listener.splice(this._listener.indexOf(listener),1);
  }

  public run(value?:T){
    this._listener.forEach(listener=>listener(value));
  }

}
