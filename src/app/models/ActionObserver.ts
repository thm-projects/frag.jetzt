export class ActionObserver {

  private list:(()=>void)[]=[];

  public subscribe(a:()=>void):()=>void {
    this.list.push(a);
    return ()=>this.remove(a);
  }

  public run(){
    this.list.forEach(e=>e());
  }

  private remove(a:()=>void){
    this.list=this.list.splice(this.list.indexOf(a),1);
  }

}
