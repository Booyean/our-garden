function ok(data, message) {
  return Response.json({ success: true, data: data, message: message || '' });
}

function fail(message, status) {
  return Response.json({ success: false, data: null, message: message }, { status: status || 400 });
}

function checkAuth(request, env) {
  var pwd = request.headers.get('X-Password');
  return pwd && pwd === env.AUTH_PASSWORD;
}

export async function onRequestGet(context) {
  var req = context.request;
  var env = context.env;
  var url = new URL(req.url);

  var id = url.searchParams.get('id');
  if (id) {
    var row = await env.DB.prepare('SELECT * FROM photos WHERE id = ?').bind(id).first();
    if (!row) return fail('照片不存在', 404);
    return ok(row);
  }

  // 列表不返回 base64 数据，只返回元数据
  var rows = await env.DB.prepare(
    'SELECT id, caption, photo_date, location, upload_time FROM photos ORDER BY upload_time DESC'
  ).all();
  return ok(rows.results);
}

export async function onRequestPost(context) {
  var req = context.request;
  var env = context.env;
  var body;
  try { body = await req.json(); } catch (e) { return fail('请求体格式错误'); }

  var imageData = body.image_data;
  if (!imageData) return fail('缺少图片数据');

  var caption = body.caption || '';
  var photoDate = body.photo_date || '';
  var location = body.location || '';

  try {
    var result = await env.DB.prepare(
      'INSERT INTO photos (image_data, caption, photo_date, location) VALUES (?, ?, ?, ?)'
    ).bind(imageData, caption, photoDate, location).run();

    return ok({
      id: result.meta.last_row_id,
      caption: caption,
      photo_date: photoDate,
      location: location
    }, '照片上传成功');
  } catch (e) {
    return fail('保存失败: ' + e.message, 500);
  }
}

export async function onRequestDelete(context) {
  var req = context.request;
  var env = context.env;
  if (!checkAuth(req, env)) return fail('密码验证失败', 401);

  var url = new URL(req.url);
  var id = url.searchParams.get('id');
  if (!id) return fail('缺少 id 参数');

  var row = await env.DB.prepare('SELECT id FROM photos WHERE id = ?').bind(id).first();
  if (!row) return fail('照片不存在', 404);

  await env.DB.prepare('DELETE FROM photos WHERE id = ?').bind(id).run();
  return ok({ id: Number(id) }, '照片删除成功');
}
