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
  icon: string;
  onClick: () => void;
  disabled?: boolean;
}

export interface M3HeaderMenu {
  title: string;
  icon: string;
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
  sections: M3NavigationSection[];
}

export interface M3NavigationSection {
  title?: string;
  entries: M3NavigationEntry[];
}

export interface M3NavigationEntry {
  title: string;
  onClick: () => boolean;
  icon?: string;
  activated?: boolean;
}

// Options

export interface M3NavigationOptionSection {
  title: string;
  options: (M3NavigationOptionEntry | M3NavigationNestedOptionSection)[];
}

export interface M3NavigationNestedOptionSection
  extends M3NavigationOptionSection {
  icon?: string;
}

export interface M3NavigationOptionEntry {
  title: string;
  onClick: () => boolean;
  icon?: string;
}
