import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '../ui.jsx'
import { cn } from '../../lib/format.js'

// Edit / Delete icon buttons. Occupies a fixed-width column; when editing is
// not allowed (e.g. group expenses) it renders an invisible, space-reserving
// placeholder so the Actions column never collapses.
export function ActionButtons({
  canEdit,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
  className,
}) {
  if (!canEdit) {
    return <span className={cn('hidden w-full md:block', className)} aria-hidden="true" />
  }
  return (
    <div className={cn('flex items-center justify-end gap-2', className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-10 w-10 text-muted-foreground hover:bg-secondary hover:text-foreground"
        onClick={onEdit}
        aria-label={editLabel}
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-10 w-10 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
        onClick={onDelete}
        aria-label={deleteLabel}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  )
}
