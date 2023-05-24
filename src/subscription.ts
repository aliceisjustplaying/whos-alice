import AtpAgent from '@atproto/api'
import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent, agent: AtpAgent) {
    if (!isCommit(evt)) return
    const ops = await getOpsByType(evt)
    const allice = await this.db.selectFrom('alice').select('did').execute()
    // console.log('❤️❤️❤️ ALICE DIDS ❤️❤️❤️', allice)
    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const postsToCreate = ops.posts.creates
      .filter((create) => {
        // only alice posts
        return allice.find((alice) => alice.did === create.author)
      })
      .map((create) => {
        // map alice-related posts to a db row
        return {
          uri: create.uri,
          cid: create.cid,
          replyParent: create.record?.reply?.parent.uri ?? null,
          replyRoot: create.record?.reply?.root.uri ?? null,
          indexedAt: new Date().toISOString(),
        }
      })

    const repostsToDelete = ops.reposts.deletes.map((del) => del.uri)
    const repostsToCreate = ops.reposts.creates
      .filter((create) => {
        // only alice posts
        return allice.find((alice) => alice.did === create.author)
      })
      .map((create) => {
        // map alice-related posts to a db row
        return {
          uri: create.uri,
          cid: create.cid,
          indexedAt: new Date().toISOString(),
        }
      })

    if (postsToDelete.length > 0) {
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute()
      console.log('🗑️ new deletes 🗑️')
    }
    if (postsToCreate.length > 0) {
      await this.db
        .insertInto('post')
        .values(postsToCreate)
        .onConflict((oc) => oc.doNothing())
        .execute()
      console.log('❗️ new posts ❗️')
    }

    if (repostsToDelete.length > 0) {
      try {
        await this.db
          .deleteFrom('repost')
          .where('uri', 'in', repostsToDelete)
          .execute()
      } catch (e) {
        console.log(
          "delete failed for whatever reason it's fine:",
          repostsToDelete,
        )
      }
    }
    if (repostsToCreate.length > 0) {
      await this.db
        .insertInto('repost')
        .values(repostsToCreate)
        .onConflict((oc) => oc.doNothing())
        .execute()
    }

    ops.posts.creates.forEach(async (create) => {
      const user = await this.db
        .selectFrom('user')
        .select('did')
        .where('did', '=', create.author)
        .execute()
      if (user.length === 0) {
        // console.log(`!!!!! fetching profile for ${create.author}`)
        const profile = await agent.api.app.bsky.actor.getProfile({
          actor: create.author,
        })
        await this.db
          .insertInto('user')
          .values({
            did: create.author,
            handle: profile.data.handle,
            displayName: profile.data.displayName,
            bio: profile.data.description,
            indexedAt: new Date().toISOString(),
          })
          .execute()
        if (profile.data.displayName?.toLowerCase().includes('alice')) {
          const alice = await this.db
            .selectFrom('alice')
            .select('did')
            .where('did', '=', create.author)
            .execute()
          if (alice.length == 0) {
            await this.db
              .insertInto('alice')
              .values({
                did: create.author,
              })
              .execute()
            console.log('⭐️⭐️⭐️ !!! ALICE FOUND !!! ⭐️⭐️⭐️')
            console.log(
              `${create.author} is ${profile.data.handle} with display name ${profile.data.displayName}`,
            )
          }
        }
        // console.log(
        //   `${create.author} is ${profile.data.handle} with display name ${profile.data.displayName}`,
        // )
      } else {
        // console.log(user)
      }
    })
  }
}
