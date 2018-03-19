function getDisplayName(Component: any) {
  return Component.displayName || Component.name || "Component";
}

export default getDisplayName;
