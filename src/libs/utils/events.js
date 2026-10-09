// module id: 185161

export async function sendUserEvent(eventName, payload = {}) { // original mangled: t, e, a
  try {
    let response = await fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        event: eventName,
        ...payload
      })
    });
    
    if (!response.ok) {
      console.warn(`[Events] Failed to send event ${eventName}:`, response.status);
      return false;
    }
    
    return true;
  } catch (err) {
    console.warn(`[Events] Error sending event ${eventName}:`, err.message);
    return false;
  }
}

export const events = {
  animationCopied: (animationId, animationTitle, category, platform) => 
    sendUserEvent("animation_copied", {
      animation_id: animationId,
      animation_title: animationTitle,
      category: category,
      platform: platform
    }),
    
  animationSaved: (animationId, animationTitle, category) => 
    sendUserEvent("animation_saved", {
      animation_id: animationId,
      animation_title: animationTitle,
      category: category
    }),
    
  userActive: () => sendUserEvent("user_active", {})
};
