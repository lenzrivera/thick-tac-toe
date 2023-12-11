export function timeout(msTime) {
  return new Promise(resolve => setTimeout(resolve, msTime));
}
