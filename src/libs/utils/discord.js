export function getDiscordLinkForUser(profile) { 
  let defaultLink = "https://discord.gg/sAPGDmzacw"; 
  if (!profile) {
    return defaultLink;
  }
  if (profile.is_legacy_user) {
    return "https://discord.gg/FbBvVkuY8j";
  }
  if (profile.plan_name?.toLowerCase().includes("team")) {
    return "https://discord.gg/ynkZTZyyeJ";
  }
  return defaultLink;
}
