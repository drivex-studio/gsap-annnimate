export function isRouteActive(currentPath, targetRoute) {
  if (!currentPath || !targetRoute) return false;

  const basePath = targetRoute.split(/[?#]/)[0];

  return (
    !!basePath.startsWith("/") &&
    (basePath === "/"
      ? currentPath === "/"
      : currentPath === basePath || currentPath.startsWith(`${basePath}/`))
  );
}