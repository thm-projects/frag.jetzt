/**
 * If the navigation options are less than 2, no navigation is displayed.
 * If the navigation options are 2, the navigation is displayed as 'tabs', no matter the value of the NavigationOption.
 * If the navigation options are more than 2, the navigation is displayed as 'rail' by default.
 *
 * If you specify more options than a container can hold, the navigation will display always display a menu or more button.
 */
export type M3NavigationOption =
  | {
      type: 'rail';
      railOrientation?: 'start' | 'center' | 'end';
      railDivider?: boolean;
    }
  | { type: 'tabs'; maxTabs?: number };

export interface M3NavigationTemplate {
  /**
   * @see {@link M3NavigationOption}
   */
  preferedNavigation?: M3NavigationOption;
  elevation: 0 | 1;
  header: M3HeaderTemplate;
  navigations: M3NavigationEntry[];
  options: M3NavigationOptionSection[];
  primaryAction?: M3FabEntry;
  /**
   * If true, a divider is placed between the navigation options.
   *
   * https://m3.material.io/components/navigation-drawer/guidelines#4ef4dd75-740b-462d-a602-ba1f762a4c1a
   */
  divideOptions?: boolean;
  title?: string;
}

export interface M3HeaderTemplate {
  title: string;
  options: (M3HeaderOption | M3HeaderMenu)[];
  /**
   * https://m3.material.io/components/top-app-bar/guidelines#0e9878bc-c1e1-46a5-afa5-4b43a1949dc1
   */
  scrollBehavior?: 'fixed' | 'shrink' | 'hide';
  type?: 'centered' | 'small' | 'medium' | 'large';
}

export interface M3HeaderOption {
  title: string;
  icon: string;
  onClick: () => void;
}

export interface M3HeaderMenu {
  title: string;
  icon: string;
  items: M3HeaderOption[];
}

export interface M3FabEntry {
  title?: string;
  icon: string;
  onClick: () => boolean;
}

export interface M3NavigationEntry {
  title: string;
  onClick: () => boolean;
  icon?: string;
  activated?: boolean;
}

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
