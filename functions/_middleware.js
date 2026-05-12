const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Password',
  'Access-Control-Max-Age': '86400',
};

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const response = await context.next();
  const newResponse = new Response(response.body, response);
  Object.entries(CORS_HEADERS).forEach(([k, v]) => newResponse.headers.set(k, v));
  return newResponse;
}
