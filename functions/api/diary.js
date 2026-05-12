function ok(data, message = '') {
  return Response.json({ success: true, data, message });
}

function fail(message, status = 400) {
  return Response.json({ success: false, data: null, message }, { status });
}

function checkAuth(request, env) {
  var pwd = request.headers.get('X-Password');
  return pwd && pwd === env.AUTH_PASSWORD;
}

export async function onRequestGet(context) {
  var { request, env } = context;
  var url = new URL(request.url);
  var date = url.searchParams.get('date');

  if (!date) return fail('缺少 date 参数');

  var row = await env.DB.prepare('SELECT * FROM diaries WHERE date = ?').bind(date).first();
  if (!row) return ok(null, '该日期暂无日记');
  return ok(row);
}

export async function onRequestPost(context) {
  var { request, env } = context;
  var body;
  try { body = await request.json(); } catch (e) { return fail('请求体格式错误'); }

  var { date, author, content, mood } = body;
  if (!date || !author) return fail('date 和 author 必填');

  try {
    await env.DB.prepare(
      'INSERT INTO diaries (date, author, content, mood) VALUES (?, ?, ?, ?)'
    ).bind(date, author, content || '', mood || '').run();
    return ok({ date, author, content, mood }, '日记创建成功');
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE')) {
      return fail('该日期已有日记，请使用 PUT 更新', 409);
    }
    return fail('创建失败: ' + e.message, 500);
  }
}

export async function onRequestPut(context) {
  var { request, env } = context;
  if (!checkAuth(request, env)) return fail('密码验证失败', 401);

  var url = new URL(request.url);
  var date = url.searchParams.get('date');
  if (!date) return fail('缺少 date 参数');

  var body;
  try { body = await request.json(); } catch (e) { return fail('请求体格式错误'); }

  var { content, mood, author } = body;
  var fields = [];
  var values = [];

  if (content !== undefined) { fields.push('content = ?'); values.push(content); }
  if (mood !== undefined) { fields.push('mood = ?'); values.push(mood); }
  if (author !== undefined) { fields.push('author = ?'); values.push(author); }
  fields.push("updated_at = datetime('now')");

  if (values.length === 0) return fail('没有可更新的字段');

  values.push(date);
  var sql = 'UPDATE diaries SET ' + fields.join(', ') + ' WHERE date = ?';
  var result = await env.DB.prepare(sql).bind(...values).run();

  if (result.meta.changes === 0) return fail('未找到该日期的日记', 404);
  return ok({ date }, '日记更新成功');
}
