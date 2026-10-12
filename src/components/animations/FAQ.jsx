import React from 'react';

export default function FAQ({ 
  items = [],
  heading = "FAQ",
  className = ""
}) {
  if (!items.length) return null;

  return (
    <section className={className}>
      <h2 className="text-h4 m-0 font-medium">{heading}</h2>
      <dl className="m-0 mt-8">
        {items.map(({ q, a }) => (
          <div key={q} className="border-t border-foreground/10 py-20 first:mt-16">
            <dt className="text-body m-0 font-medium">{q}</dt>
            <dd className="text-body-sm m-0 mt-8 max-w-[64ch] text-foreground-reading">
              {a}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
