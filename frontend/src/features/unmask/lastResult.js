let last = null

export const setLastResult = (result) => {
  last = result
}
export const getLastResult = () => last
export const clearLastResult = () => {
  last = null
}