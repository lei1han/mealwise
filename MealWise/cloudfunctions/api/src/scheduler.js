// 云函数 scheduler 入口：微信云开发定时触发器调用本函数
// 事件格式（定时触发器 event 通常带 Time 字段）：{ slot, dryRun }
// 云开发控制台配置 4 个定时触发器，分别传 slot：morning_greeting / meal_reminder_lunch / meal_reminder_dinner / evening_summary
// 定时 cron（§9.1）：08:30 / 13:00 / 20:00 / 21:30
import { main } from '../src/index.js';

export default main;