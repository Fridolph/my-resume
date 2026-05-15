import { Inject, Injectable } from '@nestjs/common'
import { and, desc, eq, sql } from 'drizzle-orm'

import type { DatabaseClient, DatabaseInstance } from '../../../database/database.client'
import { DATABASE_CLIENT, DATABASE_INSTANCE } from '../../../database/database.tokens'
import {
  aiChatMessages,
  aiChatSessions,
  aiChatUseKeys,
  aiChatVisitorLeads,
} from '../../../database/schema'
import type {
  AiChatLeadStatus,
  AiChatMessageRole,
  AiChatSessionStatus,
  AiChatUseKeyStatus,
} from './ai-chat.types'

@Injectable()
export class AiChatRepository {
  constructor(
    @Inject(DATABASE_INSTANCE)
    private readonly database: DatabaseInstance,
    @Inject(DATABASE_CLIENT)
    private readonly databaseClient: DatabaseClient,
  ) {}

  async ensureTables() {
    await this.databaseClient.execute(`
      CREATE TABLE IF NOT EXISTS ai_chat_visitor_leads (
        id text PRIMARY KEY NOT NULL,
        locale text NOT NULL,
        display_name text NOT NULL,
        company_name text,
        contact text,
        message text NOT NULL,
        source_tag text,
        source_key text,
        metadata_json text,
        status text NOT NULL,
        created_at integer NOT NULL,
        updated_at integer NOT NULL
      );
    `)
    // Existing local databases may have an older lead table shape without
    // `source_tag`, `source_key`, or `metadata_json`. Make sure those columns
    // exist before creating any index that references them.
    await this.ensureLeadColumns()
    await this.databaseClient.execute(`
      CREATE INDEX IF NOT EXISTS ai_chat_visitor_leads_status_created_at_idx
      ON ai_chat_visitor_leads (status, created_at);
    `)
    await this.databaseClient.execute(`
      CREATE INDEX IF NOT EXISTS ai_chat_visitor_leads_source_key_created_at_idx
      ON ai_chat_visitor_leads (source_key, created_at);
    `)

    await this.databaseClient.execute(`
      CREATE TABLE IF NOT EXISTS ai_chat_usekeys (
        id text PRIMARY KEY NOT NULL,
        use_key text NOT NULL,
        lead_id text NOT NULL,
        session_id text,
        issued_by_user_id text,
        status text NOT NULL,
        max_turns integer NOT NULL,
        used_turns integer NOT NULL,
        claimed_at integer,
        revoked_at integer,
        expires_at integer,
        created_at integer NOT NULL,
        updated_at integer NOT NULL,
        FOREIGN KEY (lead_id) REFERENCES ai_chat_visitor_leads(id) ON UPDATE cascade ON DELETE cascade
      );
    `)
    await this.databaseClient.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS ai_chat_usekeys_use_key_unique
      ON ai_chat_usekeys (use_key);
    `)
    await this.databaseClient.execute(`
      CREATE INDEX IF NOT EXISTS ai_chat_usekeys_lead_status_created_at_idx
      ON ai_chat_usekeys (lead_id, status, created_at);
    `)

    await this.databaseClient.execute(`
      CREATE TABLE IF NOT EXISTS ai_chat_sessions (
        id text PRIMARY KEY NOT NULL,
        lead_id text NOT NULL,
        use_key_id text NOT NULL,
        locale text NOT NULL,
        status text NOT NULL,
        turn_count integer NOT NULL,
        interim_summary text,
        final_summary text,
        focus_keywords_json text,
        closed_at integer,
        created_at integer NOT NULL,
        updated_at integer NOT NULL,
        FOREIGN KEY (lead_id) REFERENCES ai_chat_visitor_leads(id) ON UPDATE cascade ON DELETE cascade,
        FOREIGN KEY (use_key_id) REFERENCES ai_chat_usekeys(id) ON UPDATE cascade ON DELETE cascade
      );
    `)
    await this.databaseClient.execute(`
      CREATE INDEX IF NOT EXISTS ai_chat_sessions_status_updated_at_idx
      ON ai_chat_sessions (status, updated_at);
    `)
    await this.databaseClient.execute(`
      CREATE INDEX IF NOT EXISTS ai_chat_sessions_lead_created_at_idx
      ON ai_chat_sessions (lead_id, created_at);
    `)

    await this.databaseClient.execute(`
      CREATE TABLE IF NOT EXISTS ai_chat_messages (
        id text PRIMARY KEY NOT NULL,
        session_id text NOT NULL,
        role text NOT NULL,
        content text NOT NULL,
        turn_index integer NOT NULL,
        answer_blocks_json text,
        citations_json text,
        created_at integer NOT NULL,
        FOREIGN KEY (session_id) REFERENCES ai_chat_sessions(id) ON UPDATE cascade ON DELETE cascade
      );
    `)
    await this.databaseClient.execute(`
      CREATE INDEX IF NOT EXISTS ai_chat_messages_session_turn_created_at_idx
      ON ai_chat_messages (session_id, turn_index, created_at);
    `)
  }

  async createLead(input: {
    id: string
    locale: string
    displayName: string
    companyName?: string | null
    contact?: string | null
    message: string
    sourceTag?: string | null
    sourceKey?: string | null
    metadataJson?: Record<string, unknown> | null
    status: AiChatLeadStatus
    createdAt: Date
    updatedAt: Date
  }) {
    await this.database.insert(aiChatVisitorLeads).values({
      ...input,
      companyName: input.companyName ?? null,
      contact: input.contact ?? null,
      sourceTag: input.sourceTag ?? null,
      sourceKey: input.sourceKey ?? null,
      metadataJson: input.metadataJson ?? null,
    })

    return this.findLeadById(input.id)
  }

  async findLeadById(id: string) {
    const [record] = await this.database
      .select()
      .from(aiChatVisitorLeads)
      .where(eq(aiChatVisitorLeads.id, id))
      .limit(1)

    return record ?? null
  }

  async updateLeadStatus(id: string, status: AiChatLeadStatus, updatedAt: Date) {
    await this.database
      .update(aiChatVisitorLeads)
      .set({ status, updatedAt })
      .where(eq(aiChatVisitorLeads.id, id))

    return this.findLeadById(id)
  }

  async listLeads() {
    return this.database
      .select()
      .from(aiChatVisitorLeads)
      .orderBy(desc(aiChatVisitorLeads.createdAt))
  }

  async findLatestLeadBySourceKey(sourceKey: string) {
    const [record] = await this.database
      .select()
      .from(aiChatVisitorLeads)
      .where(eq(aiChatVisitorLeads.sourceKey, sourceKey))
      .orderBy(desc(aiChatVisitorLeads.createdAt))
      .limit(1)

    return record ?? null
  }

  async createUseKey(input: {
    id: string
    useKey: string
    leadId: string
    sessionId?: string | null
    issuedByUserId: string
    status: AiChatUseKeyStatus
    maxTurns: number
    usedTurns: number
    claimedAt?: Date | null
    revokedAt?: Date | null
    expiresAt?: Date | null
    createdAt: Date
    updatedAt: Date
  }) {
    await this.database.insert(aiChatUseKeys).values({
      ...input,
      sessionId: input.sessionId ?? null,
      claimedAt: input.claimedAt ?? null,
      revokedAt: input.revokedAt ?? null,
      expiresAt: input.expiresAt ?? null,
    })

    return this.findUseKeyById(input.id)
  }

  async findUseKeyById(id: string) {
    const [record] = await this.database
      .select()
      .from(aiChatUseKeys)
      .where(eq(aiChatUseKeys.id, id))
      .limit(1)

    return record ?? null
  }

  async findUseKeyByValue(useKey: string) {
    const [record] = await this.database
      .select()
      .from(aiChatUseKeys)
      .where(eq(aiChatUseKeys.useKey, useKey))
      .limit(1)

    return record ?? null
  }

  async findLatestUseKeyByLeadId(leadId: string) {
    const [record] = await this.database
      .select()
      .from(aiChatUseKeys)
      .where(eq(aiChatUseKeys.leadId, leadId))
      .orderBy(desc(aiChatUseKeys.createdAt))
      .limit(1)

    return record ?? null
  }

  async updateUseKey(input: {
    id: string
    sessionId?: string | null
    status?: AiChatUseKeyStatus
    usedTurns?: number
    claimedAt?: Date | null
    revokedAt?: Date | null
    updatedAt: Date
  }) {
    const updateData: Record<string, unknown> = {
      updatedAt: input.updatedAt,
    }

    if (typeof input.sessionId !== 'undefined') {
      updateData.sessionId = input.sessionId
    }

    if (typeof input.status !== 'undefined') {
      updateData.status = input.status
    }

    if (typeof input.usedTurns !== 'undefined') {
      updateData.usedTurns = input.usedTurns
    }

    if (typeof input.claimedAt !== 'undefined') {
      updateData.claimedAt = input.claimedAt
    }

    if (typeof input.revokedAt !== 'undefined') {
      updateData.revokedAt = input.revokedAt
    }

    await this.database.update(aiChatUseKeys).set(updateData).where(eq(aiChatUseKeys.id, input.id))

    return this.findUseKeyById(input.id)
  }

  async listUseKeys() {
    return this.database.select().from(aiChatUseKeys).orderBy(desc(aiChatUseKeys.createdAt))
  }

  async createSession(input: {
    id: string
    leadId: string
    useKeyId: string
    locale: string
    status: AiChatSessionStatus
    turnCount: number
    interimSummary?: string | null
    finalSummary?: string | null
    focusKeywordsJson?: string[] | null
    closedAt?: Date | null
    createdAt: Date
    updatedAt: Date
  }) {
    await this.database.insert(aiChatSessions).values({
      ...input,
      interimSummary: input.interimSummary ?? null,
      finalSummary: input.finalSummary ?? null,
      focusKeywordsJson: input.focusKeywordsJson ?? null,
      closedAt: input.closedAt ?? null,
    })

    return this.findSessionById(input.id)
  }

  async findSessionById(id: string) {
    const [record] = await this.database
      .select()
      .from(aiChatSessions)
      .where(eq(aiChatSessions.id, id))
      .limit(1)

    return record ?? null
  }

  async updateSession(input: {
    id: string
    status?: AiChatSessionStatus
    turnCount?: number
    interimSummary?: string | null
    finalSummary?: string | null
    focusKeywordsJson?: string[] | null
    closedAt?: Date | null
    updatedAt: Date
  }) {
    const updateData: Record<string, unknown> = {
      updatedAt: input.updatedAt,
    }

    if (typeof input.status !== 'undefined') {
      updateData.status = input.status
    }

    if (typeof input.turnCount !== 'undefined') {
      updateData.turnCount = input.turnCount
    }

    if (typeof input.interimSummary !== 'undefined') {
      updateData.interimSummary = input.interimSummary
    }

    if (typeof input.finalSummary !== 'undefined') {
      updateData.finalSummary = input.finalSummary
    }

    if (typeof input.focusKeywordsJson !== 'undefined') {
      updateData.focusKeywordsJson = input.focusKeywordsJson
    }

    if (typeof input.closedAt !== 'undefined') {
      updateData.closedAt = input.closedAt
    }

    await this.database.update(aiChatSessions).set(updateData).where(eq(aiChatSessions.id, input.id))

    return this.findSessionById(input.id)
  }

  async listSessions() {
    return this.database.select().from(aiChatSessions).orderBy(desc(aiChatSessions.updatedAt))
  }

  async createMessage(input: {
    id: string
    sessionId: string
    role: AiChatMessageRole
    content: string
    turnIndex: number
    answerBlocksJson?: unknown | null
    citationsJson?: unknown | null
    createdAt: Date
  }) {
    await this.database.insert(aiChatMessages).values({
      ...input,
      answerBlocksJson: input.answerBlocksJson ?? null,
      citationsJson: input.citationsJson ?? null,
    })

    return this.findMessageById(input.id)
  }

  async findMessageById(id: string) {
    const [record] = await this.database
      .select()
      .from(aiChatMessages)
      .where(eq(aiChatMessages.id, id))
      .limit(1)

    return record ?? null
  }

  async listMessagesBySessionId(sessionId: string) {
    return this.database
      .select()
      .from(aiChatMessages)
      .where(eq(aiChatMessages.sessionId, sessionId))
      .orderBy(aiChatMessages.createdAt)
  }

  async findLeadByUseKey(useKey: string) {
    const rows = await this.database
      .select({
        lead: aiChatVisitorLeads,
        useKey: aiChatUseKeys,
      })
      .from(aiChatUseKeys)
      .innerJoin(aiChatVisitorLeads, eq(aiChatUseKeys.leadId, aiChatVisitorLeads.id))
      .where(eq(aiChatUseKeys.useKey, useKey))
      .limit(1)

    return rows[0] ?? null
  }

  async getSessionBundle(sessionId: string) {
    const rows = await this.database
      .select({
        session: aiChatSessions,
        lead: aiChatVisitorLeads,
        useKey: aiChatUseKeys,
      })
      .from(aiChatSessions)
      .innerJoin(aiChatVisitorLeads, eq(aiChatSessions.leadId, aiChatVisitorLeads.id))
      .innerJoin(aiChatUseKeys, eq(aiChatSessions.useKeyId, aiChatUseKeys.id))
      .where(eq(aiChatSessions.id, sessionId))
      .limit(1)

    return rows[0] ?? null
  }

  async listSessionBundles() {
    return this.database
      .select({
        session: aiChatSessions,
        lead: aiChatVisitorLeads,
        useKey: aiChatUseKeys,
      })
      .from(aiChatSessions)
      .innerJoin(aiChatVisitorLeads, eq(aiChatSessions.leadId, aiChatVisitorLeads.id))
      .innerJoin(aiChatUseKeys, eq(aiChatSessions.useKeyId, aiChatUseKeys.id))
      .orderBy(desc(aiChatSessions.updatedAt))
  }

  async expireOverdueUseKeys(now: Date) {
    await this.database
      .update(aiChatUseKeys)
      .set({
        status: 'expired',
        updatedAt: now,
      })
      .where(
        and(
          eq(aiChatUseKeys.status, 'issued'),
          sql`${aiChatUseKeys.expiresAt} IS NOT NULL`,
          sql`${aiChatUseKeys.expiresAt} < ${now}`,
        ),
      )
  }

  private async ensureLeadColumns() {
    const result = await this.databaseClient.execute(`PRAGMA table_info('ai_chat_visitor_leads');`)
    const columnNames = new Set(result.rows.map((row) => String(row.column ?? row.name ?? '')))

    if (!columnNames.has('source_tag')) {
      await this.databaseClient.execute(`
        ALTER TABLE ai_chat_visitor_leads ADD COLUMN source_tag text;
      `)
    }

    if (!columnNames.has('source_key')) {
      await this.databaseClient.execute(`
        ALTER TABLE ai_chat_visitor_leads ADD COLUMN source_key text;
      `)
    }

    if (!columnNames.has('metadata_json')) {
      await this.databaseClient.execute(`
        ALTER TABLE ai_chat_visitor_leads ADD COLUMN metadata_json text;
      `)
    }
  }
}
