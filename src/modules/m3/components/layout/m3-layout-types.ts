export type M3PaneType = 'fixed' | 'flexible';

const M3_DEFAULT_PANE_TYPE: M3PaneType = 'fixed';

function isM3PaneType(value: string): value is M3PaneType {
  return value === 'fixed' || value === 'flexible';
}

export function m3PaneTypeAttribute(value: M3PaneType | unknown): M3PaneType {
  return typeof value === 'string' && isM3PaneType(value)
    ? value
    : M3_DEFAULT_PANE_TYPE;
}

export type M3PanePriority = 'primary' | 'secondary' | 'tertiary';

const M3_DEFAULT_PANE_PRIORITY: M3PanePriority = 'primary';

function isM3PanePriority(value: string): value is M3PanePriority {
  return value === 'primary' || value === 'secondary' || value === 'tertiary';
}

export function m3PanePriorityAttribute(value: unknown): M3PanePriority {
  return typeof value === 'string' && isM3PanePriority(value)
    ? value
    : M3_DEFAULT_PANE_PRIORITY;
}
