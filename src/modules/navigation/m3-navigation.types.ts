// Preferred Template

export interface M3PreferredTemplate {
  railOrientation: 'start' | 'center' | 'end';
  railDivider: boolean;
}

// Header

export interface M3HeaderTemplate {
  slogan?: string;
  options: (M3HeaderOption | M3HeaderMenu)[];
  /**
   * https://m3.material.io/components/top-app-bar/guidelines#0e9878bc-c1e1-46a5-afa5-4b43a1949dc1
   */
  scrollBehavior?: 'fixed' | 'shrink' | 'hide';
  /**
   * Not implemented yet, always centered
   */
  type?: 'centered' | 'small' | 'medium' | 'large';
}

export interface M3HeaderOption {
  title: string;
  icon?: string;
  svgIcon?: string;
  onClick: () => void;
  disabled?: boolean;
}

export interface M3HeaderMenu {
  id: string;
  title: string;
  icon?: string;
  svgIcon?: string;
  items: M3HeaderOption[];
}

// Fab

export interface M3FabEntry {
  title?: string;
  icon: string;
  onClick: () => boolean;
}

// Navigations

export interface M3NavigationTemplate {
  title?: string;
  sections: (M3NavigationSection | M3NavigationOptionSection)[];
}

export interface Identifiable {
  id: string;
}

export interface M3NavigationSection extends Identifiable {
  kind: 'navigation';
  title?: string;
  entries: M3NavigationEntry[];
}

export interface M3NavigationEntry
  extends Identifiable,
    Partial<Pick<M3NavigationNestedOptionSection, 'options'>> {
  title: string;
  smallTitle?: string;
  onClick: () => boolean;
  icon?: string;
  svgIcon?: string;
  activated?: boolean;
}

// Options

export interface M3NavigationOptionSection extends Identifiable {
  kind: 'options';
  title: string;
  options: (M3NavigationOptionEntry | M3NavigationNestedOptionSection)[];
}

export interface M3NavigationNestedOptionSection extends Identifiable {
  icon?: string;
  svgIcon?: string;
  title: string;
  options: (M3NavigationOptionEntry | M3NavigationNestedOptionSection)[];
}

export interface M3NavigationOptionEntry extends Identifiable {
  title: string;
  onClick: () => boolean;
  icon?: string;
  svgIcon?: string;
  switchState?: boolean;
}

// Utilities
type NavigationElements =
  | M3NavigationSection
  | M3NavigationOptionSection
  | M3NavigationNestedOptionSection
  | M3NavigationEntry
  | M3NavigationOptionEntry;

type ContainerType =
  | M3NavigationOptionSection['options']
  | M3NavigationNestedOptionSection['options']
  | M3NavigationTemplate['sections']
  | M3NavigationSection['entries'];

export const addAround = (
  template: M3NavigationTemplate,
  id: string,
  elem: NavigationElements,
  before: boolean,
  logNotFound = true,
): boolean => {
  const idStack = id.split('.');
  let container: ContainerType = template.sections;
  while (idStack.length > 1) {
    const currentId = idStack.shift();
    const current = container.find(
      (c) => c.id === currentId,
    ) as ContainerType[number];
    if (!current) {
      if (logNotFound) {
        console.error(`Navigation: "${id}" not found!`);
      }
      return false;
    }
    if ('entries' in current) {
      container = current.entries;
    } else if ('options' in current) {
      container = current.options;
    } else {
      if (logNotFound) {
        console.error(`Navigation: "${id}" not found!`);
      }
      return false;
    }
  }
  const currentId = idStack.shift();
  const index = container.findIndex((c) => c.id === currentId);
  if (index === -1) {
    if (logNotFound) {
      console.error(`Navigation: "${id}" not found!`);
    }
    return false;
  }
  container.splice(before ? index : index + 1, 0, elem as any);
  return true;
};

export const getById = (
  template: M3NavigationTemplate,
  id: string,
): NavigationElements => {
  const idStack = id.split('.');
  let container: ContainerType = template.sections;
  while (idStack.length > 1) {
    const currentId = idStack.shift();
    const current = container.find(
      (c) => c.id === currentId,
    ) as ContainerType[number];
    if (!current) {
      return null;
    }
    if ('entries' in current) {
      container = current.entries;
    } else if ('options' in current) {
      container = current.options;
    } else {
      return null;
    }
  }
  const currentId = idStack.shift();
  return container.find((c) => c.id === currentId);
};
