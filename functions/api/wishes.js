function ok(data, message = '') {
  return Response.json({ success: true, data, message });
}

function fail(message, status = 400) {
  return Response.json({ success: false, data: null, message }, { status });
}

export async function onRequestGet(context) {
  var rows = await context.env.DB.prepare(
    'SELECT * FROM wishes ORDER BY done ASC, created_at DESC'
  ).all();
  return ok(rows.results);
}

export async function onRequestPost(context) {
  var { request, env } = context;
  var body;
  try { body = await request.json(); } catch (e) { return fail('请求体格式错误'); }

  var { content, who } = body;
  if (!content || !who) return fail('content 和 who 必填');

  var result = await env.DB.prepare(
    'INSERT INTO wishes (content, who) VALUES (?, ?)'
  ).bind(content, who).run();

  return ok({
    id: result.meta.last_row_id,
    content: content,
    who: who,
    done: 0,
    done_date: null,
  }, '愿望添加成功');
}

export async function onRequestPut(context) {
  var { request, env } = context;
  var url = new URL(request.url);
  var id = url.searchParams.get('id');
  if (!id) return fail('缺少 id 参数');

  var body;
  try { body = await request.json(); } catch (e) { return fail('请求体格式错误'); }

  var done = body.done;
  if (done === undefined) return fail('缺少 done 字段');

  var doneDate = done ? new Date().toISOString().slice(0, 10) : null;

  var result = await env.DB.prepare(
    'UPDATE wishes SET done = ?, done_date = ? WHERE id = ?'
  ).bind(done, doneDate, id).run();

  if (result.meta.changes === 0) return fail('愿望不存在', 404);
  return ok({ id: Number(id), done: done, done_date: doneDate }, done ? '愿望完成啦！' : '愿望重新开启');
}
