export interface CategoryIconGroup {
  /** i18n key suffix under `iconPicker.groups` */
  id: string
  icons: string[]
}

/**
 * Curated library of emoji icons offered when creating a category, grouped by
 * theme so users can pick one easily instead of typing an emoji by hand.
 */
export const CATEGORY_ICON_GROUPS: CategoryIconGroup[] = [
  {
    id: 'produce',
    icons: ['🥦', '🥕', '🍅', '🥬', '🌽', '🥔', '🧅', '🧄', '🫑', '🥒', '🍆', '🍄', '🥑', '🌶️', '🫛', '🥗'],
  },
  {
    id: 'fruits',
    icons: ['🍎', '🍌', '🍓', '🍇', '🍊', '🍋', '🍐', '🍑', '🍒', '🍉', '🍍', '🥭', '🥝', '🫐', '🥥', '🍈'],
  },
  {
    id: 'proteins',
    icons: ['🥩', '🍗', '🍖', '🥓', '🌭', '🍔', '🐟', '🐠', '🦐', '🦑', '🦀', '🦞', '🥚', '🍤'],
  },
  {
    id: 'dairy',
    icons: ['🥛', '🧀', '🧈', '🍶'],
  },
  {
    id: 'bakery',
    icons: ['🍞', '🥖', '🥐', '🥯', '🥨', '🧇', '🥞', '🎂', '🧁', '🥧'],
  },
  {
    id: 'pantry',
    icons: ['🥫', '🍝', '🍚', '🍜', '🫙', '🧂', '🫒', '🍯', '🥜', '🌾', '🫘', '🌰'],
  },
  {
    id: 'snacks',
    icons: ['🍫', '🍬', '🍭', '🍿', '🍪', '🍩', '🥠', '🍡', '🍮'],
  },
  {
    id: 'drinks',
    icons: ['🥤', '☕', '🍵', '🧃', '🧋', '🍺', '🍷', '🍹', '🧉', '🥂', '💧', '🍾'],
  },
  {
    id: 'frozen',
    icons: ['🧊', '🍨', '🍧', '🍦', '🥶'],
  },
  {
    id: 'household',
    icons: ['🧻', '🧼', '🧴', '🧽', '🧹', '🧺', '🪣', '🧯', '🔋', '💡', '🕯️', '🧷', '🪥', '🪒'],
  },
  {
    id: 'health',
    icons: ['💊', '🩹', '🩺', '🌡️', '🧫', '🧬', '🩸', '🧪'],
  },
  {
    id: 'pets',
    icons: ['🐶', '🐱', '🦴', '🐾', '🐦', '🐹', '🐰'],
  },
  {
    id: 'other',
    icons: ['🛒', '🛍️', '🎁', '📦', '🌱', '🍽️', '🧾', '🏷️', '⭐', '✅'],
  },
]

/** Flat list of every icon in the library. */
export const CATEGORY_ICONS: string[] = CATEGORY_ICON_GROUPS.flatMap((group) => group.icons)
