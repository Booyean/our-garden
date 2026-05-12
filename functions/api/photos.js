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

function randomStr(len) {
  var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var s = '';
  for (var i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function onRequestGet(context) {
  var rows = await context.env.DB.prepare(
    'SELECT * FROM photos ORDER BY upload_time DESC'
  ).all();
  return ok(rows.results);
}

export async function onRequestPost(context) {
  var { request, env } = context;
  var formData;
  try { formData = await request.formData(); } catch (e) { return fail('请求体格式错误'); }

  var file = formData.get('file');
  if (!file || !file.size) return fail('缺少文件');

  var caption = formData.get('caption') || '';
  var photoDate = formData.get('photo_date') || '';
  var location = formData.get('location') || '';

  var ext = file.name.split('.').pop().toLowerCase() || 'jpg';
  var allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'];
  if (allowed.indexOf(ext) === -1) return fail('不支持的图片格式');

  var dateStr = (photoDate || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  var imageKey = 'photos/' + dateStr + '_' + randomStr(8) + '.' + ext;

  try {
    await env.R2.put(imageKey, file.stream(), {
      httpMetadata: { contentType: file.type },
    });
  } catch (e) {
    return fail('图片上传失败: ' + e.message, 500);
  }

  var imageUrl = '/r2/' + imageKey;

  try {
    var result = await env.DB.prepare(
      'INSERT INTO photos (image_key, image_url, caption, photo_date, location) VALUES (?, ?, ?, ?, ?)'
    ).bind(imageKey, imageUrl, caption, photoDate, location).run();

    return ok({
      id: result.meta.last_row_id,
      image_key: imageKey,
      image_url: imageUrl,
      caption: caption,
      photo_date: photoDate,
      location: location,
    }, '照片上传成功');
  } catch (e) {
    return fail('保存照片信息失败: ' + e.message, 500);
  }
}

export async function onRequestDelete(context) {
  var { request, env } = context;
  if (!checkAuth(request, env)) return fail('密码验证失败', 401);

  var url = new URL(request.url);
  var id = url.searchParams.get('id');
  if (!id) return fail('缺少 id 参数');

  var row = await env.DB.prepare('SELECT image_key FROM photos WHERE id = ?').bind(id).first();
  if (!row) return fail('照片不存在', 404);

  try {
    await env.R2.delete(row.image_key);
  } catch (e) {}

  await env.DB.prepare('DELETE FROM photos WHERE id = ?').bind(id).run();
  return ok({ id: Number(id) }, '照片删除成功');
}
