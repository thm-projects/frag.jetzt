export enum M3ElementKind {
  DrawerData,
  DrawerSection,
  SectionContent,
}

export interface M3Element<E extends M3ElementKind> {
  kind: E;
}

interface M3SectionItem extends M3Element<M3ElementKind.SectionContent> {
  name: string;
  subSection: M3SectionItem[];
}

interface M3Identifier {
  title: string;
  icon?: string;
}

export interface M3Section extends M3Element<M3ElementKind.DrawerSection> {
  enterLabel: M3Identifier;
  returnLabel: M3Identifier;
  content: M3SectionItem[];
}

export interface M3DrawerData extends M3Element<M3ElementKind.DrawerData> {
  sections: M3Section[];
}
