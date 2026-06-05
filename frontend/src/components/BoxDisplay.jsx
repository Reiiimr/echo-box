import { useTranslation } from 'react-i18next';

// Pre-defined palette the user can choose from
export const BOX_COLORS = [
  '#8b6440', // warm brown (default)
  '#8b3a2a', // rust red
  '#4e6e41', // forest green
  '#4a6b8a', // slate blue
  '#704214', // sepia
  '#b8860b', // brass gold
  '#5c3317', // dark walnut
  '#a0522d', // sienna
  '#6b3fa0', // aged violet
  '#2c5f6e', // teal ink
];

export default function BoxDisplay({ user, itemCount = 0 }) {
  const { t } = useTranslation();
  const color = user?.box_color || '#8b6440';

  // Slightly lighter shade for the lid
  const lidColor = lighten(color, 18);

  return (
    <div className="box-wrap">
      {/* Lid */}
      <div className="box-lid" style={{ background: lidColor }} />

      {/* Body */}
      <div className="box-body" style={{ background: color }}>
        {/* Mail slot */}
        <div className="box-slot" />

        {/* Name label */}
        <div className="box-label">{user?.box_name || 'My Box'}</div>

        {/* Username */}
        <div className="box-username">@{user?.username}</div>

        {/* Item count */}
        {itemCount > 0 && (
          <div className="box-count">
            {t('box.items_count_other', { count: itemCount })}
          </div>
        )}
      </div>
    </div>
  );
}

/** Lightens a hex colour by `amount` (0-255) */
function lighten(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
