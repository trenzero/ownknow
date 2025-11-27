import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('*', cors())

// 工具函数
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2)

// 验证管理员权限
const verifyAdmin = (c, password) => {
  const adminPassword = c.env.ADMIN_PASSWORD
  return password === adminPassword
}

// API路由 - 获取所有文章（公开）
app.get('/api/articles', async (c) => {
  try {
    const kv = c.env.KNOWLEDGE_BASE
    const articlesData = await kv.get('articles')
    const categoriesData = await kv.get('categories')
    const tagsData = await kv.get('tags')
    
    const articles = articlesData ? JSON.parse(articlesData) : {}
    const categories = categoriesData ? JSON.parse(categoriesData) : {}
    const tags = tagsData ? JSON.parse(tagsData) : {}
    
    // 只返回已发布的文章
    const publishedArticles = Object.values(articles).filter(article => article.published)
    
    return c.json({
      success: true,
      data: {
        articles: publishedArticles,
        categories,
        tags
      }
    })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// API路由 - 获取所有数据（管理员）
app.post('/api/admin/data', async (c) => {
  try {
    const { password } = await c.req.json()
    
    if (!verifyAdmin(c, password)) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }
    
    const kv = c.env.KNOWLEDGE_BASE
    const articlesData = await kv.get('articles')
    const categoriesData = await kv.get('categories')
    const tagsData = await kv.get('tags')
    
    const articles = articlesData ? JSON.parse(articlesData) : {}
    const categories = categoriesData ? JSON.parse(categoriesData) : {}
    const tags = tagsData ? JSON.parse(tagsData) : {}
    
    return c.json({
      success: true,
      data: {
        articles,
        categories,
        tags
      }
    })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// API路由 - 保存分类
app.post('/api/admin/categories', async (c) => {
  try {
    const { password, categories } = await c.req.json()
    
    if (!verifyAdmin(c, password)) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }
    
    const kv = c.env.KNOWLEDGE_BASE
    await kv.put('categories', JSON.stringify(categories))
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// API路由 - 保存标签
app.post('/api/admin/tags', async (c) => {
  try {
    const { password, tags } = await c.req.json()
    
    if (!verifyAdmin(c, password)) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }
    
    const kv = c.env.KNOWLEDGE_BASE
    await kv.put('tags', JSON.stringify(tags))
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// API路由 - 保存文章
app.post('/api/admin/articles', async (c) => {
  try {
    const { password, articles } = await c.req.json()
    
    if (!verifyAdmin(c, password)) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }
    
    const kv = c.env.KNOWLEDGE_BASE
    await kv.put('articles', JSON.stringify(articles))
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// API路由 - 导出数据
app.post('/api/admin/export', async (c) => {
  try {
    const { password } = await c.req.json()
    
    if (!verifyAdmin(c, password)) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }
    
    const kv = c.env.KNOWLEDGE_BASE
    const articlesData = await kv.get('articles')
    const categoriesData = await kv.get('categories')
    const tagsData = await kv.get('tags')
    
    const exportData = {
      articles: articlesData ? JSON.parse(articlesData) : {},
      categories: categoriesData ? JSON.parse(categoriesData) : {},
      tags: tagsData ? JSON.parse(tagsData) : {},
      exportDate: new Date().toISOString()
    }
    
    return c.json({ success: true, data: exportData })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// API路由 - 导入数据
app.post('/api/admin/import', async (c) => {
  try {
    const { password, data } = await c.req.json()
    
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
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 静态文件服务
app.get('*', async (c) => {
  // 这里应该返回前端HTML文件
  // 在实际部署中，Cloudflare Pages会自动处理静态文件
  return c.text('Knowledge Base System - Please deploy with Cloudflare Pages')
})

export default app
