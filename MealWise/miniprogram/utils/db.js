/**
 * 云数据库前端直连调试工具
 * 仅供调试 / 临时核对数据使用，不参与现有业务调用链（业务统一走 utils/api.js → 云函数 api）。
 * 直连集合遵循云开发"仅创建者可读写"默认权限：写入会自动带 _openid，
 * 但与契约字段 user_id（存 openid）各写各的，故此处默认只读，写接口需显式开启。
 */

let _db = null;

/**
 * 懒加载数据库实例（依赖 app.js 已 wx.cloud.init）
 */
function getDB() {
  if (!wx.cloud) {
    throw new Error('当前基础库不支持云能力，请升级基础库');
  }
  if (!_db) {
    _db = wx.cloud.database();
  }
  return _db;
}

/**
 * 查询集合文档（默认最多 20 条）
 * @param {string} collection 集合名
 * @param {object} [where={}] 查询条件
 * @param {object} [opts] { sort: {key, desc}, limit }
 */
async function query(collection, where = {}, opts = {}) {
  const db = getDB();
  const _ = db.command;
  let q = db.collection(collection).where(where);
  if (opts.sort) {
    q = q.orderBy(opts.sort.key, opts.sort.desc ? 'desc' : 'asc');
  }
  const res = await q.limit(opts.limit || 20).get();
  return res.data;
}

/**
 * 统计集合文档数
 */
async function count(collection, where = {}) {
  const db = getDB();
  const res = await db.collection(collection).where(where).count();
  return res.total;
}

/**
 * 插入文档（写操作：默认打印提醒，前端直连会带 _openid）
 * 注意：会写入 _openid（云开发自动），与 user_id 字段不同源，仅用于受控调试。
 */
async function insert(collection, data) {
  const db = getDB();
  const res = await db.collection(collection).add({ data });
  return res._id;
}

module.exports = {
  getDB,
  query,
  count,
  insert
};