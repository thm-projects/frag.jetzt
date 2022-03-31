export class ArsUtil {

  /**
   * creates an interval by passing (()=>void)
   * arg:()=>void gets triggered on call when trigger?:boolean set to true
   *
   * @param arg:()=>void
   * @param time:number
   * @param trigger?:boolean
   * @return ()=>void
   */
  public static setInterval(arg:()=>void,time:number,trigger?:boolean):()=>void{
    if(trigger)arg();
    const interval=setInterval(arg,time);
    return ()=>clearInterval(interval);
  }

}
