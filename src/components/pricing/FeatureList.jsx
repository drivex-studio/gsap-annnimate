/* Data */
const SIZE_VARIANTS = {
  sm: {
    rect: 'size-8 mt-[0.35em]',
    gap: 'gap-12',
    text: 'text-body leading-snug'
  },
  default: {
    rect: 'size-12 mt-[0.4em]',
    gap: 'gap-16',
    text: 'text-body-lg leading-snug'
  }
};


export default function FeatureList({
  items = [],
  size = 'sm',
  className = '',
  itemClassName = ''
}) {
  const variantStyles = SIZE_VARIANTS[size] ?? SIZE_VARIANTS.sm;

  return (
    <ul className={`m-0 list-none space-y-2 p-0 ${className}`}>
      {items.map((item, index) => {
        const itemData = typeof item === 'string' ? { label: item } : item;
        const textClass = itemData.muted ? 'text-foreground/40' : 'text-foreground-muted';
        const bgClass = itemData.muted ? 'bg-brand/40' : 'bg-brand';

        return (
          <li
            key={index}
            className={`flex items-start ${variantStyles.gap} ${variantStyles.text} ${textClass} ${itemClassName} ${itemData.className || ''}`}
          >
            <span
              className={`block shrink-0 ${variantStyles.rect} ${bgClass}`}
              aria-hidden="true"
            />
            <span>{itemData.label}</span>
          </li>
        );
      })}
    </ul>
  );
}