const VALID_TYPES = new Set(["client_commissioned", "internal_project", "studio_original"]);
const SITE_BASED_TYPES = new Set(["client_commissioned", "internal_project"]);

export function getProvenance(animation) {
  let prov = animation?.metadata?.provenance;
  if (prov && typeof prov === "object" && VALID_TYPES.has(prov.type)) {
    return prov;
  }
  return null;
}

export function getProvenanceLine(animation) {
  let prov = getProvenance(animation);
  if (prov && SITE_BASED_TYPES.has(prov.type) && prov.site) {
    let contextStr = prov.context ? ` ${prov.context}` : "";
    return `Built for ${prov.site}${contextStr}.`;
  }
  return "A Good Fella original.";
}

export function getProvenanceBody(animation) {
  let prov = getProvenance(animation);
  
  if (prov?.body) return prov.body;
  
  if (prov?.site) {
    if (prov.type === "client_commissioned") {
      return `We built it for the ${prov.site} site and folded it back into the library when the project went live. A Good Fella piece, refined for reuse.`;
    }
    if (prov.type === "internal_project") {
      return `We built it for ${prov.site}, our own site, and kept it in the library once it earned its place. The same code runs in production today.`;
    }
  }
  
  return "We built it for the library deliberately, not against a client brief, and kept it once it earned its place here.";
}

export function getProvenanceSite(animation) {
  let prov = getProvenance(animation);
  return (prov && SITE_BASED_TYPES.has(prov.type) && prov.site) ? prov.site : null;
}
