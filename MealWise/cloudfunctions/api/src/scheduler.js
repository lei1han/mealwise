// 定时触发器入口：云开发控制台按 NUDGE_SLOTS 配置 4 个 cron（§9.1，08:30 / 13:00 / 20:00 / 21:30），
// 分别传 slot 触发；event 形如 { slot, dryRun }。
import { main } from '../src/index.js';

export default main;