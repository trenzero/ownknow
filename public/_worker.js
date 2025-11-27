// _worker.js - 替代 Functions 目录
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 处理 API 请求
    if (url.pathname.startsWith('/api/') || url.pathname === '/health') {
      return handleAPIRequest(request, env);
    }
    
    // 其他请求交给 Pages 处理静态文件
    return env.ASSETS.fetch(request);
  }
};

async function handleAPIRequest(request, env) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // 设置 CORS 头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // 健康检查
    if (pathname === '/health' && request.method === 'GET') {
      return new Response(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'API is working',
        kv_configured: typeof env.KNOWLEDGE_BASE !== 'undefined'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // 获取文章列表（公开）
    if (pathname === '/api/articles' && request.method === 'GET') {
      return await handleGetArticles(env, corsHeaders);
    }
    
    // 管理员获取所有数据
    if (pathname === '/api/admin/data' && request.method === 'POST') {
      return await handleGetAdminData(request, env, corsHeaders);
    }
    
    // 保存分类
    if (pathname === '/api/admin/categories' && request.method === 'POST') {
      return await handleSaveCategories(request, env, corsHeaders);
    }
    
    // 保存标签
    if (pathname === '/api/admin/tags' && request.method === 'POST') {
      return await handleSaveTags(request, env, corsHeaders);
    }
    
    // 保存文章
    if (pathname === '/api/admin/articles' && request.method === 'POST') {
      return await handleSaveArticles(request, env, corsHeaders);
    }
    
    // 导出数据
    if (pathname === '/api/admin/export' && request.method === 'POST') {
      return await handleExportData(request, env, corsHeaders);
    }
    
    // 导入数据
    if (pathname === '/api/admin/import' && request.method === 'POST') {
      return await handleImportData(request, env, corsHeaders);
    }
    
    // 如果没有匹配的路由，返回404
    return new Response(JSON.stringify({
      error: 'Not Found',
      message: `Route ${pathname} not found`
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 验证管理员权限
function verifyAdmin(env, password) {
  const adminPassword = env.ADMIN_PASSWORD;
  return password === adminPassword;
}

// 工具函数：生成ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// API处理函数（与方案二相同）
async function handleGetArticles(env, corsHeaders) {
  try {
    const kv = env.KNOWLEDGE_BASE;
    
    const [articlesData, categoriesData, tagsData] = await Promise.all([
      kv.get('articles'),
      kv.get('categories'),
      kv.get('tags')
    ]);
    
    const articles = articlesData ? JSON.parse(articlesData) : [];
    const categories = categoriesData ? JSON.parse(categoriesData) : {};
    const tags = tagsData ? JSON.parse(tagsData) : {};
    
    // 只返回已发布的文章
    const publishedArticles = Array.isArray(articles) 
      ? articles.filter(article => article.published)
      : Object.values(articles).filter(article => article.published);
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        articles: publishedArticles,
        categories,
        tags
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
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

async function handleGetAdminData(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { password } = body;
    
    if (!verifyAdmin(env, password)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const kv = env.KNOWLEDGE_BASE;
    
    const [articlesData, categoriesData, tagsData] = await Promise.all([
      kv.get('articles'),
      kv.get('categories'),
      kv.get('tags')
    ]);
    
    let articles = [];
    if (articlesData) {
      try {
        const parsed = JSON.parse(articlesData);
        articles = Array.isArray(parsed) ? parsed : Object.values(parsed);
      } catch (e) {
        console.error('Error parsing articles:', e);
        articles = [];
      }
    }
    
    const categories = categoriesData ? JSON.parse(categoriesData) : {};
    const tags = tagsData ? JSON.parse(tagsData) : {};
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        articles,
        categories,
        tags
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
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

async function handleSaveCategories(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { password, categories } = body;
    
    if (!verifyAdmin(env, password)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const kv = env.KNOWLEDGE_BASE;
    await kv.put('categories', JSON.stringify(categories));
    
    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
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

async function handleSaveTags(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { password, tags } = body;
    
    if (!verifyAdmin(env, password)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const kv = env.KNOWLEDGE_BASE;
    await kv.put('tags', JSON.stringify(tags));
    
    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
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

async function handleSaveArticles(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { password, articles } = body;
    
    if (!verifyAdmin(env, password)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const kv = env.KNOWLEDGE_BASE;
    await kv.put('articles', JSON.stringify(articles));
    
    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
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

async function handleExportData(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { password } = body;
    
    if (!verifyAdmin(env, password)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const kv = env.KNOWLEDGE_BASE;
    
    const [articlesData, categoriesData, tagsData] = await Promise.all([
      kv.get('articles'),
      kv.get('categories'),
      kv.get('tags')
    ]);
    
    let articles = [];
    if (articlesData) {
      try {
        const parsed = JSON.parse(articlesData);
        articles = Array.isArray(parsed) ? parsed : Object.values(parsed);
      } catch (e) {
        console.error('Error parsing articles for export:', e);
        articles = [];
      }
    }
    
    const categories = categoriesData ? JSON.parse(categoriesData) : {};
    const tags = tagsData ? JSON.parse(tagsData) : {};
    
    const exportData = {
      articles,
      categories,
      tags,
      exportDate: new Date().toISOString()
    };
    
    return new Response(JSON.stringify({
      success: true,
      data: exportData
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
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

async function handleImportData(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { password, data } = body;
    
    if (!verifyAdmin(env, password)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const kv = env.KNOWLEDGE_BASE;
    
    if (data.articles) {
      await kv.put('articles', JSON.stringify(data.articles));
    }
    
    if (data.categories) {
      await kv.put('categories', JSON.stringify(data.categories));
    }
    
    if (data.tags) {
      await kv.put('tags', JSON.stringify(data.tags));
    }
    
    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
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
