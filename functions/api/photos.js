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
  var rows = await context.env.DB.prepare(
    'SELECT id, caption, photo_date, location, upload_time FROM photos ORDER BY upload_time DESC'
  ).all();
  return ok(rows.results);
}

export async function onRequestPost(context) {
  var { request, env } = context;
  var body;
  try { body = await request.json(); } catch (e) { return fail('请求体格式错误'); }

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
      location: location,
    }, '照片上传成功');
  } catch (e) {
    return fail('保存失败: ' + e.message, 500);
  }
}

export async function onRequestDelete(context) {
  var { request, env } = context;
  if (!checkAuth(request, env)) return fail('密码验证失败', 401);

  var url = new URL(request.url);
  var id = url.searchParams.get('id');
  if (!id) return fail('缺少 id 参数');

  var row = await env.DB.prepare('SELECT id FROM photos WHERE id = ?').bind(id).first();
  if (!row) return fail('照片不存在', 404);

  await env.DB.prepare('DELETE FROM photos WHERE id = ?').bind(id).run();
  return ok({ id: Number(id) }, '照片删除成功');
}

// 单独获取单张照片的完整 base64 数据
export async function onRequestGet(context) {
  var { request, env } = context;
  var url = new URL(request.url);
  var photoId = url.searchParams.get('detail');

  if (photoId) {
    var row = await env.DB.prepare('SELECT * FROM photos WHERE id = ?').bind(photoId).first();
    if (!row) return fail('照片不存在', 404);
    return ok(row);
  }

  var rows = await env.DB.prepare(
    'SELECT id, image_data, caption, photo_date, location, upload_time FROM photos ORDER BY upload_time DESC'
  ).all();
  return ok(rows.results);
}
