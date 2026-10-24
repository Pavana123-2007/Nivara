
import { openDB } from 'idb'

let dbPromise = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB('calc-data', 1, {
      upgrade(db) {
        db.createObjectStore('items', { keyPath: 'id' })
        db.createObjectStore('meta')
      },
    })
  }
  return dbPromise
}
