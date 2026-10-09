import React from 'react';

const SIZES = {
  sm: {
    rect: "size-8 mt-[0.35em]",
    gap: "gap-12",
    text: "text-body leading-snug"
  },
  default: {
    rect: "size-12 mt-[0.4em]",
    gap: "gap-16",
    text: "text-body-lg leading-snug"
  }
};

export default function BulletPoints({
  items = [],
  size = "sm",
  className = "",
  itemClassName = ""
}) {
  let config = SIZES[size] ?? SIZES.sm;

  return (
    <ul className={`m-0 list-none space-y-2 p-0 ${className}`}>
      {items.map((item, index) => {
        let parsedItem = typeof item === "string" ? { label: item } : item;
        let textColor = parsedItem.muted ? "text-foreground/40" : "text-foreground-muted";
        let bulletColor = parsedItem.muted ? "bg-brand/40" : "bg-brand";

        return (
          <li
            key={index}
            className={`flex items-start ${config.gap} ${config.text} ${textColor} ${itemClassName} ${parsedItem.className || ""}`}
          >
            <span
              className={`block shrink-0 ${config.rect} ${bulletColor}`}
              aria-hidden="true"
            />
            <span>{parsedItem.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
