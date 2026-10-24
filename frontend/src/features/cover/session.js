
let key = null

export const setSessionKey = (k) => {
  key = k
}

export const getSessionKey = () => key

export const isUnlocked = () => key !== null

export function vanish() {
  key = null
  window.location.replace('/calc')
}
