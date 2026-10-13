export const FRAMEWORKS = ['react', 'vue', 'html'];

const CODE_FIELDS = [
  'html_code', 'css_code', 'js_code', 'gsap_code', 'react_code', 'vue_code',
  'demo_react_code', 'demo_vue_code', 'webflow_code', 'webflow_css_code',
];

export function normalizeAnimation(row) {
  if (!row) return null;
  return {
    ...row,
    html_code: row.html_code ?? row.code_html ?? '',
    react_code: row.react_code ?? row.code_react ?? '',
    vue_code: row.vue_code ?? row.code_vue ?? '',
  };
}

export function lockCode(animation, hasAccess) {
  if (hasAccess) return animation;
  const locked = { ...animation };
  for (const key of [...CODE_FIELDS, 'code_html', 'code_react', 'code_vue']) {
    if (typeof locked[key] === 'string') {
      locked[key] = locked[key].split('\n').slice(0, 10).join('\n');
    }
  }
  return locked;
}

export function getAvailableFormats(animation) {
  const formats = [];
  if (animation.react_code) formats.push('react');
  if (animation.vue_code) formats.push('vue');
  if (animation.html_code || animation.css_code || animation.js_code) formats.push('html');
  return formats;
}

export function pickRelated(all, animation, limit = 3) {
  const others = all.filter((a) => a.id !== animation.id);
  const sameCategory = others.filter((a) => a.category === animation.category);
  const rest = others.filter((a) => a.category !== animation.category);
  return [...sameCategory, ...rest].slice(0, limit);
}
