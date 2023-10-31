import AtpAgent from '@atproto/api'
import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  isAlice(alices, did) {
    return alices.find((alice) => alice.did === did)
  }

  async handleEvent(evt: RepoEvent, agent: AtpAgent) {
    if (!isCommit(evt)) return
    const ops = await getOpsByType(evt)
    const alices = await this.db.selectFrom('alice').select('did').execute()
    // console.log('❤️❤️❤️ ALICE DIDS ❤️❤️❤️', alices)
    const postsToDelete = ops.posts.deletes
      .map((del) => ({
        uri: del.uri,
        author: del.uri.split('/')[2],
      }))
      .filter((del) => this.isAlice(alices, del.author))
      .map((del) => del.uri)
    const postsToCreate = ops.posts.creates
      .filter((create) => this.isAlice(alices, create.author))
      .map((create) => {
        return {
          uri: create.uri,
          cid: create.cid,
          replyParent: create.record?.reply?.parent.uri ?? null,
          replyRoot: create.record?.reply?.root.uri ?? null,
          indexedAt: new Date().toISOString(),
        }
      })

    if (postsToDelete.length > 0) {
      console.log('🗑️ new deletes 🗑️: ', postsToDelete)
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute()
    }
    if (postsToCreate.length > 0) {
      console.log('❗️ new posts ❗️: ', postsToCreate)
      await this.db
        .insertInto('post')
        .values(postsToCreate)
        .onConflict((oc) => oc.doNothing())
        .execute()
    }

    ops.posts.creates.forEach(async (create) => {
      const user = await this.db
        .selectFrom('atproto_user')
        .select(['did', 'indexedAt'])
        .where('did', '=', create.author)
        // .where('indexedAt', '<=', 'CURRENT_TIMESTAMP - INTERVAL \'1 week\'')
        .execute()
      if (user.length === 0) {
        console.log(`!!!!! fetching profile for ${create.author}`)
        let profile
        try {
          profile = await agent.api.app.bsky.actor.getProfile({
            actor: create.author,
          })
        } catch (e) {
          console.error('error fetching profile: ', e)
          return
        }

        try {
          await this.db
            .insertInto('atproto_user')
            .values({
              did: create.author,
              handle: profile.data.handle,
              displayName: profile.data.displayName,
              bio: profile.data.description,
              indexedAt: new Date().toISOString(),
            })
            .execute()
        } catch (e) {
          console.error('error inserting user: ', e)
        }

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
        // console.log(new Date(user[0].indexedAt));
        // console.log(user)
        // let d = new Date(user[0].indexedAt);

      }
    })
  }
}
