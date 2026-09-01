// LLM 客户端：OpenAI 兼容适配（DeepSeek/其它换 baseURL 即可）；service='mock' 走 mockLlm
import { mockComplete } from './mockLlm.js';

export function createLlm(opts = {}) {
  if (opts.service === 'mock') {
    return { service: 'mock', async complete({ messages }) { return mockComplete({ messages }); } };
  }

  // 真实：OpenAI 兼容 chat/completions（如 DeepSeek）
  // 环境变量：DEEPSEEK_API_KEY（必）、DEEPSEEK_BASE_URL（可选）、DEEPSEEK_MODEL（可选）
  const baseURL = (opts.baseURL ?? process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com').replace(/\/$/, '');
  const model = opts.model ?? process.env.DEEPSEEK_MODEL ?? 'deepseek-chat';
  const apiKey = opts.apiKey ?? process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('createLlm(opts) 需 apiKey 或环境变量 DEEPSEEK_API_KEY（M3 接入点，见后端计划 §15.1）');
  }

  return {
    service: 'openai',
    async complete({ messages }) {
      const resp = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          response_format: { type: 'json_object' },
          temperature: opts.temperature ?? 0.5,
        }),
      });
      if (!resp.ok) throw new Error(`LLM HTTP ${resp.status}: ${await resp.text()}`);
      const data = await resp.json();
      return data?.choices?.[0]?.message?.content ?? '';
    },
  };
}