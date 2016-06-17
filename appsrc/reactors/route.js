
export default function route (reactors, store, action) {
  const reactor = reactors[action.type]
  if (reactor) {
    reactor(store, action)
  }

  const catchall = reactors['_ALL']
  if (catchall) {
    catchall(store, action)
  }
}
