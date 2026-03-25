import { AiRuntimeConfig } from '../config/ai-config';
import {
  AiProvider,
  GenerateTextInput,
  GenerateTextResult,
} from '../interfaces/ai-provider.interface';

type FetchLike = typeof fetch;

interface OpenAiCompatibleResponse {
  id?: string;
  choices?: Array<{
    message?: {
      content?: string | Array<{ type: string; text?: string }>;
    };
  }>;
}

function joinChatCompletionsUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, '')}/chat/completions`;
}

function extractMessageContent(response: OpenAiCompatibleResponse): string {
  const content = response.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .filter((item) => item.type === 'text' && item.text)
      .map((item) => item.text)
      .join('\n');
  }

  throw new Error('Provider response does not include message content');
}

export class OpenAiCompatibleAiProvider implements AiProvider {
  constructor(
    private readonly config: Extract<
      AiRuntimeConfig,
      { mode: 'openai-compatible' }
    >,
    private readonly fetchFn: FetchLike,
  ) {}

  getSummary() {
    return {
      provider: this.config.provider,
      model: this.config.model,
      mode: this.config.mode,
    };
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
    const response = await this.fetchFn(
      joinChatCompletionsUrl(this.config.baseUrl),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          temperature: input.temperature ?? 0.2,
          messages: [
            ...(input.systemPrompt
              ? [
                  {
                    role: 'system',
                    content: input.systemPrompt,
                  },
                ]
              : []),
            {
              role: 'user',
              content: input.prompt,
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `${this.config.providerLabel} request failed with status ${response.status}`,
      );
    }

    const payload = (await response.json()) as OpenAiCompatibleResponse;

    return {
      provider: this.config.provider,
      model: this.config.model,
      text: extractMessageContent(payload),
      raw: payload,
    };
  }
}
