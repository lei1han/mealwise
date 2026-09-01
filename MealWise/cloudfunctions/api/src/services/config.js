// 全局配置服务：读取 app_config 集合（公开配置 + 内部提示词覆盖），本地/测试无云端时回退默认。
// app_config 行结构：{ _id, key, value, public, description, updated_at }；key 语义唯一。
// 公开配置（public=true）经 app.config.get 暴露给客户端；prompt.* 为内部提示词覆盖（public=false/缺省），
// 云函数每次请求经 ready() 实时读取，未配置时调用方回退代码默认模板。
// 注：app_config 为全局表（无 user_id），不走 CloudDB 按用户的工作集加载/差分写回，由本服务直读。
import { DEFAULT_CONFIG_COLLECTION } from '../db/schema.js';

export const DEFAULT_PUBLIC = Object.freeze({
  coach_avatar_url: '',
});

// 提示词槽位键清单（内部配置，public=false）
export const PROMPT_KEYS = Object.freeze([
  'prompt.chat.system',
  'prompt.opening.new',
  'prompt.opening.profiling',
  'prompt.opening.active',
  'prompt.target_confirm',
  'prompt.target_partial',
  'prompt.nudge.morning_greeting',
  'prompt.nudge.meal_reminder',
  'prompt.nudge.evening_summary',
]);

// {name} 占位符替换；缺失或 null 变量渲染为「未知」
export function render(template, vars = {}) {
  if (template == null) return template;
  return String(template).replace(/\{(\w+)\}/g, (_, name) => {
    const v = vars[name];
    return v === undefined || v === null ? '未知' : String(v);
  });
}

export class ConfigService {
  constructor({ db }) {
    // CloudDB 对外暴露原始 cloud.database() 于 .cdb；本地 MemoryDB 无此属性 → 视为无云端
    this.raw = db?.cdb ?? null;
    this._rows = null; // 集合行数组（含 public 与内部），ready() 后可用
  }

  /** 每次请求加载一次 app_config；本地/测试立即返回；读取失败按未配置处理 */
  async ready() {
    if (!this.raw || this._rows) return;
    try {
      if (typeof this.raw.createCollection === 'function') {
        try {
          await this.raw.createCollection(DEFAULT_CONFIG_COLLECTION);
        } catch {
          /* 集合已存在或 SDK 不支持 → 忽略 */
        }
      }
      const res = await this.raw.collection(DEFAULT_CONFIG_COLLECTION).get();
      this._rows = res.data ?? [];
    } catch {
      // 集合不存在或读取异常：按未配置兜底，不影响业务
      this._rows = [];
    }
  }

  /** 公开配置：默认值 + public=true 的覆盖行 */
  getPublic() {
    const out = { ...DEFAULT_PUBLIC };
    for (const d of this._rows ?? []) {
      if (d && d.key != null && d.public === true) out[d.key] = d.value;
    }
    return out;
  }

  /** 提示词槽位：返回配置中的模板字符串，未配置返回 null（调用方回退代码默认） */
  getPrompt(key) {
    for (const d of this._rows ?? []) {
      if (d && d.key === key) return d.value ?? null;
    }
    return null;
  }
}
