function ok(data, message = '') {
  return Response.json({ success: true, data, message });
}

function fail(message, status = 400) {
  return Response.json({ success: false, data: null, message }, { status });
}

export async function onRequestGet(context) {
  var { request, env } = context;
  var url = new URL(request.url);
  var month = url.searchParams.get('month');

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return fail('缺少 month 参数，格式: YYYY-MM');
  }

  var rows = await env.DB.prepare(
    "SELECT date, mood FROM diaries WHERE date LIKE ? ORDER BY date ASC"
  ).bind(month + '%').all();

  return ok(rows.results);
}
