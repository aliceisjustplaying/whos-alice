export type DatabaseSchema = {
  post: Post
  user: User
  alice: Alice
  sub_state: SubState
}

export type Post = {
  uri: string
  cid: string
  replyParent: string | null
  replyRoot: string | null
  indexedAt: string
}

export type SubState = {
  service: string
  cursor: number
}

export type User = {
  did: string
  handle: string
  displayName: string | null
  bio: string | null
  indexedAt: string
}

export type Alice = {
  did: string
}
