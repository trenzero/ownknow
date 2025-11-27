export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // 处理API请求
    if (url.pathname.startsWith('/api/')) {
      return handleAPIRequest(request, env);
    }
    
    // 其他请求交给Pages处理静态文件
    return env.ASSETS.fetch(request);
  }
};

async function handleAPIRequest(request, env) {
  const url = new URL(request.url);
  
  // 设置CORS头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // 这里添加您的API处理逻辑
    // 简化示例...
    if (url.pathname === '/api/articles' && request.method === 'GET') {
      const articles = await env.KNOWLEDGE_BASE.get('articles');
      return new Response(JSON.stringify({
        success: true,
        data: {
          articles: articles ? JSON.parse(articles) : [],
          categories: {},
          tags: {}
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not Found', { status: 404 });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
