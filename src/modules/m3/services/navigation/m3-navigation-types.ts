import { NavigationExtras } from '@angular/router';
import { TemplateRef, Type } from '@angular/core';

export enum M3TemplateKind {
  Navigation,
  Header,
  Rail,
  RailExtension,
  Label,
  Badge,
  RailSection,
}

export enum M3State {
  Enabled,
  Disabled,
  Active,
}

export interface M3AbstractNode<E extends M3TemplateKind> {
  kind: E;
}

export interface M3NavigationTemplate
  extends M3AbstractNode<M3TemplateKind.Navigation> {
  elevation: 0 | 1;
  header: M3HeaderTemplate;
  rail: M3RailTemplate;
  railExtension?: M3RailExtensionTemplate;
}

interface M3ButtonAction {
  triggerFor?: M3MenuTemplate;
  route?: {
    commands: string[];
    extras: NavigationExtras;
  };
  action?: VoidFunction;
}

export interface M3BadgeTemplate extends M3AbstractNode<M3TemplateKind.Badge> {}

export interface M3MenuItemTemplate extends M3ButtonAction {
  name: string;
  icon?: string;
}

export interface M3MenuTemplate {
  items: M3MenuItemTemplate[];
}

export interface M3LabelTemplate
  extends M3AbstractNode<M3TemplateKind.Label>,
    M3ButtonAction {
  text: string;
  icon: string;
  state?: M3State;
  badge?: M3BadgeTemplate;
}

export interface M3RailTemplate extends M3AbstractNode<M3TemplateKind.Rail> {
  title?: string;
  hide?: boolean;
  labels?: M3LabelTemplate[];
}

export interface M3RailSection
  extends M3AbstractNode<M3TemplateKind.RailSection> {
  title?: string;
  labels: M3LabelTemplate[];
}

export interface M3RailExtensionTemplate
  extends M3AbstractNode<M3TemplateKind.RailExtension> {
  sections: M3RailSection[];
}

export interface M3PortalTemplate {
  templateRef?: TemplateRef<any>;
  component?: Type<any>;
}

export interface M3HeaderTemplate
  extends M3AbstractNode<M3TemplateKind.Header>,
    M3PortalTemplate {}

export const M3NavigationUtility = {
  emptyPortal(component: Type<any>): M3NavigationTemplate {
    return {
      kind: M3TemplateKind.Navigation,
      header: {
        kind: M3TemplateKind.Header,
        component: component,
      },
      rail: {
        kind: M3TemplateKind.Rail,
        hide: true,
      },
      elevation: 0,
    };
  },
};
