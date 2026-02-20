export const DISCOVER_TAB_CONFIG = {
  marketplace: {
    label: 'SHOP',
    route: '/discover',
    parentCategory: 'Shop',
    feedType: 'marketplace',
  },
  barter: {
    label: 'BARTER',
    route: '/discover/barter',
    parentCategory: 'Swap',
    feedType: 'barter',
  },
} as const;

export type DiscoverTab = keyof typeof DISCOVER_TAB_CONFIG;

export const DEFAULT_DISCOVER_TAB: DiscoverTab = 'marketplace';

export const DISCOVER_TABS = Object.keys(DISCOVER_TAB_CONFIG) as DiscoverTab[];

export const isDiscoverTab = (value?: string): value is DiscoverTab => {
  return !!value && value in DISCOVER_TAB_CONFIG;
};

export const toDiscoverTab = (value?: string): DiscoverTab => {
  return isDiscoverTab(value) ? value : DEFAULT_DISCOVER_TAB;
};
