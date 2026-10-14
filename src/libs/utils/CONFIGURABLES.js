const SUPPORTED_TYPES = new Set([
  'number',
  'float',
  'boolean',
  'select',
  'color',
])

const CUSTOMIZE_MIN_CONFIGURABLES = 0

function getConfigurables(animation) {
  const attributes = animation?.attributes
  const configurables =
    attributes?.attributes?.configurables ||
    attributes?.configurables ||
    []

  return Array.isArray(configurables)
    ? configurables.filter(isValidConfigurable)
    : []
}

function isValidConfigurable(configurable) {
  if (!configurable || !configurable.attribute) return false

  const type = String(configurable.type || '').toLowerCase()

  if (!SUPPORTED_TYPES.has(type)) return false

  if (type === 'number' || type === 'float') {
    return (
      Number.isFinite(Number(configurable.min)) &&
      Number.isFinite(Number(configurable.max)) &&
      configurable.value !== '' &&
      Number.isFinite(Number(configurable.value))
    )
  }

  if (type === 'select') {
    return (
      Array.isArray(configurable.options) &&
      configurable.options.length > 1 &&
      configurable.options.includes(configurable.value)
    )
  }

  if (type === 'boolean') {
    const value = String(configurable.value).toLowerCase()
    return value === 'true' || value === 'false'
  }

  return (
    type !== 'color' ||
    /^#[0-9a-fA-F]{3,8}$/.test(String(configurable.value || ''))
  )
}

function getAnmApiName(value) {
  return String(value || '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function getPrimaryAttribute(animation) {
  const attributes = animation?.attributes
  const selectors =
    attributes?.attributes?.selectors ||
    attributes?.selectors ||
    []

  const selector =
    selectors.find((item) => item?.required && item?.attribute) ||
    selectors[0]

  return selector?.attribute || `data-anm-${animation?.slug || ''}`
}

function countUsableConfigurables(animation) {
  return getConfigurables(animation).length
}

function toAttributeKey(attribute) {
  return String(attribute || '')
    .replace(/^data-anm-/, '')
    .replace(/-([a-z0-9])/g, (_, character) => character.toUpperCase())
}

function formatConfigurableValue(value, type) {
  const normalizedType = String(type || '').toLowerCase()

  if (normalizedType === 'number' || normalizedType === 'float') {
    const number = Number(value)
    return Number.isFinite(number) ? String(number) : null
  }

  if (normalizedType === 'boolean') {
    return value === true || value === 'true' ? 'true' : 'false'
  }

  return `'${String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")}'`
}

const VALUE_PATTERN = "('[^']*'|\"[^\"]*\"|[^,}\\s][^,}]*)"

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function applyValuesToHtml(html, values, primaryAttribute) {
  let source = String(html || '')
  if (!source) return source

  for (const [attribute, value] of Object.entries(values || {})) {
    if (value == null || value === '') continue

    const text = String(value)
    const attributePattern = new RegExp(
      `(?<![-\\w])${escapeRegExp(attribute)}\\s*=\\s*"[^"]*"`,
    )

    if (attributePattern.test(source)) {
      source = source.replace(
        attributePattern,
        () => `${attribute}="${text}"`,
      )
    } else {
      const primaryPattern = new RegExp(
        `(?<![-\\w])${escapeRegExp(primaryAttribute)}(\\s*=\\s*"[^"]*")?`,
      )

      source = source.replace(
        primaryPattern,
        (match) => `${match} ${attribute}="${text}"`,
      )
    }
  }

  return source
}

function applyValuesToReact(source, values, configurables) {
  let result = String(source || '')
  if (!result) return result

  const match = result.match(
    /export default function \w+\s*\(\s*\{[\s\S]*?\}\s*\)/,
  )

  if (!match) return result

  let functionSignature = match[0]

  for (const [attribute, value] of Object.entries(values || {})) {
    if (value == null || value === '') continue

    const configurable = (configurables || []).find(
      (item) => item.attribute === attribute,
    )

    const formattedValue = formatConfigurableValue(
      value,
      configurable?.type,
    )

    if (formattedValue == null) continue

    const key = toAttributeKey(attribute)
    const pattern = new RegExp(
      `(\\b${escapeRegExp(key)}\\s*=\\s*)${VALUE_PATTERN}`,
    )

    functionSignature = functionSignature.replace(
      pattern,
      (_, prefix) => `${prefix}${formattedValue}`,
    )
  }

  return result.replace(match[0], () => functionSignature)
}

function applyValuesToVue(source, values, configurables) {
  let result = String(source || '')
  if (!result) return result

  for (const [attribute, value] of Object.entries(values || {})) {
    if (value == null || value === '') continue

    const configurable = (configurables || []).find(
      (item) => item.attribute === attribute,
    )

    const formattedValue = formatConfigurableValue(
      value,
      configurable?.type,
    )

    if (formattedValue == null) continue

    const key = toAttributeKey(attribute)
    const pattern = new RegExp(
      `(\\b${escapeRegExp(key)}\\s*:\\s*\\{[^}]*?\\bdefault:\\s*)${VALUE_PATTERN}`,
    )

    result = result.replace(
      pattern,
      (_, prefix) => `${prefix}${formattedValue}`,
    )
  }

  return result
}

// module id: 726368
export {
  CUSTOMIZE_MIN_CONFIGURABLES,
  applyValuesToHtml,
  applyValuesToReact,
  applyValuesToVue,
  countUsableConfigurables,
  getAnmApiName,
  getConfigurables,
  getPrimaryAttribute,
}