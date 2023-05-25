import { Kysely, Migration, MigrationProvider } from 'kysely'

const migrations: Record<string, Migration> = {}

export const migrationProvider: MigrationProvider = {
  async getMigrations() {
    return migrations
  },
}

migrations['001'] = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .createTable('post')
      .addColumn('uri', 'varchar', (col) => col.primaryKey())
      .addColumn('cid', 'varchar', (col) => col.notNull())
      .addColumn('replyParent', 'varchar')
      .addColumn('replyRoot', 'varchar')
      .addColumn('indexedAt', 'varchar', (col) => col.notNull())
      .execute()
    await db.schema
      .createTable('sub_state')
      .addColumn('service', 'varchar', (col) => col.primaryKey())
      .addColumn('cursor', 'integer', (col) => col.notNull())
      .execute()
  },
  async down(db: Kysely<unknown>) {
    await db.schema.dropTable('post').execute()
    await db.schema.dropTable('sub_state').execute()
  },
}

// you cannot actually create a table called "user" in postgres because it's a reserved word :(
migrations['002'] = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .createTable('user')
      .addColumn('did', 'varchar', (col) => col.primaryKey())
      .addColumn('handle', 'varchar', (col) => col.notNull())
      .addColumn('displayName', 'varchar')
      .addColumn('bio', 'varchar')
      .addColumn('indexedAt', 'varchar', (col) => col.notNull())
      .execute()
  },
  async down(db: Kysely<unknown>) {
    await db.schema.dropTable('user').execute()
  },
}

migrations['003'] = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .createTable('alice')
      .addColumn('did', 'varchar', (col) => col.primaryKey())
      .execute()
  },
  async down(db: Kysely<unknown>) {
    await db.schema.dropTable('alice').execute()
  },
}

migrations['004'] = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .createTable('repost')
      .addColumn('uri', 'varchar', (col) => col.primaryKey())
      .addColumn('cid', 'varchar', (col) => col.notNull())
      .addColumn('indexedAt', 'varchar', (col) => col.notNull())
      .execute()
  },
  async down(db: Kysely<unknown>) {
    await db.schema.dropTable('repost').execute()
  },
}

migrations['005'] = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .createTable('atproto_user')
      .addColumn('did', 'varchar', (col) => col.primaryKey())
      .addColumn('handle', 'varchar', (col) => col.notNull())
      .addColumn('displayName', 'varchar')
      .addColumn('bio', 'varchar')
      .addColumn('indexedAt', 'varchar', (col) => col.notNull())
      .execute()
  },
  async down(db: Kysely<unknown>) {
    await db.schema.dropTable('atproto_user').execute()
  },
}
