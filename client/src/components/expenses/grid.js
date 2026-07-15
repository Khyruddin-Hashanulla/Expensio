// Shared CSS Grid template for the expense list.
// Column order: Title | Category | Frequency | Group | Date | Amount | Actions
// Every column has a fixed width so content can never shift alignment.
// Mobile (<md) renders as stacked cards (handled per-row); the grid applies at md+.
export const EXPENSE_GRID =
  'md:grid md:grid-cols-[minmax(0,1fr)_140px_92px_84px_104px_112px_80px] ' +
  'lg:grid-cols-[minmax(0,1fr)_160px_100px_96px_120px_128px_88px] ' +
  'md:items-center md:gap-x-4 lg:gap-x-6'

// Grid placement (order) so DOM order can differ from visual column order.
export const EXPENSE_ORDER = {
  title: 'md:order-1',
  category: 'md:order-2',
  frequency: 'md:order-3',
  group: 'md:order-4',
  date: 'md:order-5',
  amount: 'md:order-6',
  actions: 'md:order-7',
}
