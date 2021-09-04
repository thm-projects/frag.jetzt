import { ComponentFactory, ComponentFactoryResolver, ComponentRef, Injectable, Injector, Type, ViewContainerRef } from '@angular/core';
import { PortalInjector } from '@angular/cdk/portal';

@Injectable({
  providedIn: 'root'
})
export class ComposeService {

  constructor(
    private cfr:ComponentFactoryResolver,
    private injector:Injector
  ) { }

  create<E>(vcr:ViewContainerRef,component:Type<E>,map:WeakMap<any,any>):ComponentRef<E>{
    return vcr.createComponent(this.resolve(component),null,this.createInjector(map));
  }

  private resolve<E>(component:Type<E>):ComponentFactory<E>{
    return this.cfr.resolveComponentFactory(component);
  }

  private createInjector(map:WeakMap<any,any>):PortalInjector{
    return new PortalInjector(this.injector,map);
  }

  public createMap(key:any,value:any){
    const map=new WeakMap<any,any>();
    map.set(key,value);
    return map;
  }

}
