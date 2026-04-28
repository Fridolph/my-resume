import { ServiceUnavailableException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { describe, expect, it, beforeEach, vi } from 'vitest'

import { AppController } from '../app.controller'
import { AppService } from '../app.service'
import { AiService } from '../modules/ai/ai.service'

const aiServiceMock = {
  getProviderSummary: vi.fn(),
  generateText: vi.fn(),
}

describe('AppController', () => {
  let appController: AppController

  beforeEach(async () => {
    vi.clearAllMocks()
    aiServiceMock.getProviderSummary.mockReturnValue({
      provider: 'mock',
      model: 'mock-chat-model',
      mode: 'mock',
      chatModel: 'mock-chat-model',
      embeddingModel: 'mock-embedding-model',
    })

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: AiService,
          useValue: aiServiceMock,
        },
      ],
    }).compile()

    appController = app.get<AppController>(AppController)
  })

  describe('health', () => {
    it('should leave root redirects to the Nest redirect decorator', () => {
      expect(appController.redirectRootToHealth()).toBeUndefined()
    })

    it('should return health check payload', () => {
      expect(appController.getHealth()).toEqual(
        expect.objectContaining({
          status: 'ok',
          service: 'my-resume-api',
          uptimeSeconds: expect.any(Number),
          timestamp: expect.any(String),
        }),
      )
    })
  })

  describe('ai connectivity', () => {
    it('should call current ai provider and return a safe connectivity payload', async () => {
      aiServiceMock.generateText.mockResolvedValue({
        provider: 'mock',
        model: 'mock-chat-model',
        text: 'OK',
      })

      await expect(appController.checkAiConnectivity()).resolves.toEqual(
        expect.objectContaining({
          ok: true,
          status: 'ok',
          provider: 'mock',
          model: 'mock-chat-model',
          mode: 'mock',
          latencyMs: expect.any(Number),
          sample: 'OK',
        }),
      )
      expect(aiServiceMock.generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('AI model is reachable'),
          temperature: 0,
        }),
      )
    })

    it('should return service unavailable when current ai provider fails', async () => {
      aiServiceMock.generateText.mockRejectedValue(new Error('upstream timeout'))

      await expect(appController.checkAiConnectivity()).rejects.toThrow(
        ServiceUnavailableException,
      )
    })
  })
})
