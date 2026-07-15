// Shared CSS Grid template for the expense list.
// Column order: Title | Category | Frequency | Group | Date | Amount | Actions
// Every column has a fixed width so content can never shift alignment.
// The fixed sidebar (240px) means the 7-column grid only fits at lg+;
// below that the row renders as a stacked card (handled per-row).
export const EXPENSE_GRID =
  'lg:grid lg:grid-cols-[minmax(0,1fr)_140px_92px_84px_104px_112px_80px] ' +
  'xl:grid-cols-[minmax(0,1fr)_160px_100px_96px_120px_128px_88px] ' +
  'lg:items-center lg:gap-x-4 xl:gap-x-6'

// Grid placement (order) so DOM order can differ from visual column order.
export const EXPENSE_ORDER = {
  title: 'lg:order-1',
  category: 'lg:order-2',
  frequency: 'lg:order-3',
  group: 'lg:order-4',
  date: 'lg:order-5',
  amount: 'lg:order-6',
  actions: 'lg:order-7',
}
