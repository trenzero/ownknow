// _worker.js - Cloudflare Pages Functions入口
import { Hono } from 'hono'

const app = new Hono()

// 中间件：添加CORS支持
app.use('*', async (c, next) => {
  c.res.headers.set('Access-Control-Allow-Origin', '*')
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  await next()
})

// 处理OPTIONS请求（CORS预检）
app.options('*', (c) => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
})

// 验证管理员权限
const verifyAdmin = (c, password) => {
  const adminPassword = c.env.ADMIN_PASSWORD
  return password === adminPassword
}

// API路由 - 健康检查
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'API is working'
  })
})

// API路由 - 获取所有文章（公开）
app.get('/api/articles', async (c) => {
  try {
    const kv = c.env.KNOWLEDGE_BASE
    
    const articlesData = await kv.get('articles') || '[]'
    const categoriesData = await kv.get('categories') || '{}'
    const tagsData = await kv.get('tags') || '{}'
    
    const articles = JSON.parse(articlesData)
    const categories = JSON.parse(categoriesData)
    const tags = JSON.parse(tagsData)
    
    // 只返回已发布的文章
    const publishedArticles = Array.isArray(articles) 
      ? articles.filter(article => article.published)
      : Object.values(articles).filter(article => article.published)
    
    return c.json({
      success: true,
      data: {
        articles: publishedArticles,
        categories,
        tags
      }
    })
  } catch (error) {
    console.error('Error in /api/articles:', error)
    return c.json({ 
      success: false, 
      error: error.message
    }, 500)
  }
})

// API路由 - 获取所有数据（管理员）
app.post('/api/admin/data', async (c) => {
  try {
    const body = await c.req.json()
    const { password } = body
    
    if (!verifyAdmin(c, password)) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }
    
    const kv = c.env.KNOWLEDGE_BASE
    
    const articlesData = await kv.get('articles') || '[]'
    const categoriesData = await kv.get('categories') || '{}'
    const tagsData = await kv.get('tags') || '{}'
    
    let articles = []
    try {
      const parsed = JSON.parse(articlesData)
      articles = Array.isArray(parsed) ? parsed : Object.values(parsed)
    } catch (e) {
      console.error('Error parsing articles:', e)
      articles = []
    }
    
    const categories = JSON.parse(categoriesData)
    const tags = JSON.parse(tagsData)
    
    return c.json({
      success: true,
      data: {
        articles,
        categories,
        tags
      }
    })
  } catch (error) {
    console.error('Error in /api/admin/data:', error)
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

// API路由 - 保存分类
app.post('/api/admin/categories', async (c) => {
  try {
    const body = await c.req.json()
    const { password, categories } = body
    
    if (!verifyAdmin(c, password)) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }
    
    const kv = c.env.KNOWLEDGE_BASE
    await kv.put('categories', JSON.stringify(categories))
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Error in /api/admin/categories:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// API路由 - 保存标签
app.post('/api/admin/tags', async (c) => {
  try {
    const body = await c.req.json()
    const { password, tags } = body
    
    if (!verifyAdmin(c, password)) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }
    
    const kv = c.env.KNOWLEDGE_BASE
    await kv.put('tags', JSON.stringify(tags))
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Error in /api/admin/tags:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// API路由 - 保存文章
app.post('/api/admin/articles', async (c) => {
  try {
    const body = await c.req.json()
    const { password, articles } = body
    
    if (!verifyAdmin(c, password)) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }
    
    const kv = c.env.KNOWLEDGE_BASE
    await kv.put('articles', JSON.stringify(articles))
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Error in /api/admin/articles:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// API路由 - 导出数据
app.post('/api/admin/export', async (c) => {
  try {
    const body = await c.req.json()
    const { password } = body
    
    if (!verifyAdmin(c, password)) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }
    
    const kv = c.env.KNOWLEDGE_BASE
    
    const articlesData = await kv.get('articles') || '[]'
    const categoriesData = await kv.get('categories') || '{}'
    const tagsData = await kv.get('tags') || '{}'
    
    let articles = []
    try {
      const parsed = JSON.parse(articlesData)
      articles = Array.isArray(parsed) ? parsed : Object.values(parsed)
    } catch (e) {
      console.error('Error parsing articles for export:', e)
      articles = []
    }
    
    const categories = JSON.parse(categoriesData)
    const tags = JSON.parse(tagsData)
    
    const exportData = {
      articles,
      categories,
      tags,
      exportDate: new Date().toISOString()
    }
    
    return c.json({ success: true, data: exportData })
  } catch (error) {
    console.error('Error in /api/admin/export:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// API路由 - 导入数据
app.post('/api/admin/import', async (c) => {
  try {
    const body = await c.req.json()
    const { password, data } = body
    
    if (!verifyAdmin(c, password)) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }
    
    const kv = c.env.KNOWLEDGE_BASE
    
    if (data.articles) {
      await kv.put('articles', JSON.stringify(data.articles))
    }
    
    if (data.categories) {
      await kv.put('categories', JSON.stringify(data.categories))
    }
    
    if (data.tags) {
      await kv.put('tags', JSON.stringify(data.tags))
    }
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Error in /api/admin/import:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 默认路由 - 对于其他所有请求，返回404
app.all('*', (c) => {
  return c.json({ error: 'Route not found' }, 404)
})

export default app
