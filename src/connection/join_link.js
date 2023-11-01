export function getOpponentIdFromJoinLink() {
  return new URLSearchParams(location.search).get("id");
}

export function resetUrl() {
  history.replaceState(
    {},
    document.title,
    `${location.origin}${location.pathname}`,
  );
}
