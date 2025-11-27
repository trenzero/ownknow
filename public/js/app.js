// 前端应用主逻辑 - 完整版本
class KnowledgeBaseApp {
    constructor() {
        this.currentPage = 'home';
        this.articles = [];
        this.categories = {};
        this.tags = {};
        this.isAdmin = false;
        this.adminPassword = '';
        this.currentEditingArticle = null;
        
        this.init();
    }
    
    async init() {
        this.bindEvents();
        
        // 先进行健康检查
        try {
            const health = await this.healthCheck();
            console.log('System health:', health);
        } catch (error) {
            console.error('Health check failed:', error);
        }
        
        this.loadData();
        this.updateTheme();
    }
    
    bindEvents() {
        // 导航链接点击事件
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.getAttribute('data-page');
                
                if (page === 'admin') {
                    this.showAdminLogin();
                } else {
                    this.showPage(page);
                }
            });
        });
        
        // 主题切换
        document.querySelector('.theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // 搜索功能
        document.getElementById('search-btn').addEventListener('click', () => {
            this.searchArticles();
        });
        
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchArticles();
            }
        });
        
        // 返回按钮
        document.getElementById('back-btn').addEventListener('click', () => {
            this.showPage('home');
        });
        
        // 管理登录
        document.getElementById('login-btn').addEventListener('click', () => {
            this.adminLogin();
        });
        
        document.getElementById('admin-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.adminLogin();
            }
        });
        
        // 管理后台操作
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.adminLogout();
        });
        
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportData();
        });
        
        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });
        
        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });
        
        // 标签切换
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.target.getAttribute('data-tab');
                this.switchAdminTab(tabId);
            });
        });
        
        // 文章管理
        document.getElementById('new-article-btn').addEventListener('click', () => {
            this.openArticleEditor();
        });
        
        // 分类管理
        document.getElementById('new-category-btn').addEventListener('click', () => {
            this.addNewCategory();
        });
        
        // 标签管理
        document.getElementById('new-tag-btn').addEventListener('click', () => {
            this.addNewTag();
        });
        
        // 模态框操作
        document.querySelector('.close-btn').addEventListener('click', () => {
            this.closeArticleEditor();
        });
        
        document.getElementById('cancel-article-btn').addEventListener('click', () => {
            this.closeArticleEditor();
        });
        
        document.getElementById('article-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveArticle();
        });
        
        // 点击模态框外部关闭
        document.getElementById('article-editor-modal').addEventListener('click', (e) => {
            if (e.target.id === 'article-editor-modal') {
                this.closeArticleEditor();
            }
        });
    }
    
    // API基础URL - 使用相对路径
    getApiBaseUrl() {
        return '';
    }
    
    async loadData() {
        try {
            console.log('Loading data from API...');
            const response = await fetch(this.getApiBaseUrl() + '/api/articles');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Data loaded:', result);
            
            if (result.success) {
                this.articles = result.data.articles || [];
                this.categories = result.data.categories || {};
                this.tags = result.data.tags || {};
                
                this.renderHomePage();
                this.renderCategoriesPage();
                this.renderTagsPage();
            } else {
                console.error('Failed to load data:', result.error);
                this.showError('加载数据失败: ' + result.error);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('加载数据失败，请检查网络连接: ' + error.message);
        }
    }
    
    async loadAdminData() {
        if (!this.isAdmin) return;
        
        try {
            console.log('Loading admin data...');
            const response = await fetch(this.getApiBaseUrl() + '/api/admin/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    password: this.adminPassword
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Admin data loaded:', result);
            
            if (result.success) {
                this.articles = result.data.articles || [];
                this.categories = result.data.categories || {};
                this.tags = result.data.tags || {};
                
                this.renderAdminArticles();
                this.renderAdminCategories();
                this.renderAdminTags();
            } else {
                console.error('Failed to load admin data:', result.error);
                this.showError('加载管理数据失败: ' + result.error);
            }
        } catch (error) {
            console.error('Error loading admin data:', error);
            this.showError('加载管理数据失败: ' + error.message);
        }
    }
    
    showPage(page) {
        // 隐藏所有页面
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        
        // 更新导航激活状态
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // 显示目标页面
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        } else {
            console.error('Page not found:', page);
            return;
        }
        
        // 更新导航激活状态（管理页面特殊处理）
        if (page !== 'admin' && page !== 'admin-login') {
            const navLink = document.querySelector(`.nav-link[data-page="${page}"]`);
            if (navLink) {
                navLink.classList.add('active');
            }
        }
        
        this.currentPage = page;
    }
    
    showAdminLogin() {
        this.showPage('admin-login');
    }
    
    async adminLogin() {
        const password = document.getElementById('admin-password').value;
        
        if (!password) {
            alert('请输入管理员密码');
            return;
        }
        
        this.adminPassword = password;
        
        try {
            console.log('Attempting admin login...');
            
            const response = await fetch(this.getApiBaseUrl() + '/api/admin/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    password: this.adminPassword
                })
            });
            
            console.log('Login response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Login response:', result);
            
            if (result.success) {
                this.isAdmin = true;
                this.articles = result.data.articles || [];
                this.categories = result.data.categories || {};
                this.tags = result.data.tags || {};
                
                this.showPage('admin');
                this.renderAdminArticles();
                this.renderAdminCategories();
                this.renderAdminTags();
                
                // 清空密码输入框
                document.getElementById('admin-password').value = '';
                
                console.log('Admin login successful');
            } else {
                alert('登录失败: ' + (result.error || '未知错误'));
                console.error('Login failed:', result.error);
            }
        } catch (error) {
            console.error('Error during admin login:', error);
            alert('登录失败，请检查网络连接和API端点。错误: ' + error.message);
        }
    }
    
    adminLogout() {
        this.isAdmin = false;
        this.adminPassword = '';
        this.showPage('home');
    }
    
    switchAdminTab(tabId) {
        // 更新标签按钮状态
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
        
        // 更新标签内容
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        
        document.getElementById(tabId).classList.add('active');
    }
    
    renderHomePage() {
        const container = document.getElementById('articles-grid');
        
        if (!container) {
            console.error('Articles grid container not found');
            return;
        }
        
        if (this.articles.length === 0) {
            container.innerHTML = '<p class="no-data">暂无文章</p>';
            return;
        }
        
        container.innerHTML = this.articles.map(article => {
            const category = this.categories[article.categoryId];
            const categoryName = category ? category.name : '未分类';
            
            const tagElements = article.tagIds ? article.tagIds.map(tagId => {
                const tag = this.tags[tagId];
                return tag ? `<span class="tag">${tag.name}</span>` : '';
            }).join('') : '';
            
            const date = new Date(article.createdAt).toLocaleDateString('zh-CN');
            const excerpt = article.content ? article.content.substring(0, 150) + '...' : '';
            
            return `
                <div class="article-card" data-id="${article.id}">
                    <h3>${this.escapeHtml(article.title)}</h3>
                    <p>${this.escapeHtml(excerpt)}</p>
                    <div class="article-meta">
                        <span class="category-badge">${this.escapeHtml(categoryName)}</span>
                        <div class="tags-list">${tagElements}</div>
                        <span class="article-date">${date}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        // 绑定文章点击事件
        container.querySelectorAll('.article-card').forEach(card => {
            card.addEventListener('click', () => {
                const articleId = card.getAttribute('data-id');
                this.showArticle(articleId);
            });
        });
    }
    
    renderCategoriesPage() {
        const container = document.getElementById('categories-container');
        
        if (!container) {
            console.error('Categories container not found');
            return;
        }
        
        const categoriesArray = Object.values(this.categories);
        
        if (categoriesArray.length === 0) {
            container.innerHTML = '<p class="no-data">暂无分类</p>';
            return;
        }
        
        container.innerHTML = categoriesArray.map(category => {
            const articleCount = this.articles.filter(article => 
                article.categoryId === category.id
            ).length;
            
            return `
                <div class="category-card" data-id="${category.id}">
                    <h3>${this.escapeHtml(category.name)}</h3>
                    <div class="count">${articleCount} 篇文章</div>
                </div>
            `;
        }).join('');
        
        // 绑定分类点击事件
        container.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const categoryId = card.getAttribute('data-id');
                this.showCategoryArticles(categoryId);
            });
        });
    }
    
    renderTagsPage() {
        const container = document.getElementById('tags-container');
        
        if (!container) {
            console.error('Tags container not found');
            return;
        }
        
        const tagsArray = Object.values(this.tags);
        
        if (tagsArray.length === 0) {
            container.innerHTML = '<p class="no-data">暂无标签</p>';
            return;
        }
        
        container.innerHTML = tagsArray.map(tag => {
            const articleCount = this.articles.filter(article => 
                article.tagIds && article.tagIds.includes(tag.id)
            ).length;
            
            return `
                <div class="tag-card" data-id="${tag.id}">
                    <h3>${this.escapeHtml(tag.name)}</h3>
                    <div class="count">${articleCount} 篇文章</div>
                </div>
            `;
        }).join('');
        
        // 绑定标签点击事件
        container.querySelectorAll('.tag-card').forEach(card => {
            card.addEventListener('click', () => {
                const tagId = card.getAttribute('data-id');
                this.showTagArticles(tagId);
            });
        });
    }
    
    showArticle(articleId) {
        const article = this.articles.find(a => a.id === articleId);
        
        if (!article) {
            console.error('Article not found:', articleId);
            return;
        }
        
        const category = this.categories[article.categoryId];
        const categoryName = category ? category.name : '未分类';
        
        const tagElements = article.tagIds ? article.tagIds.map(tagId => {
            const tag = this.tags[tagId];
            return tag ? `<span class="tag">${tag.name}</span>` : '';
        }).join('') : '';
        
        const date = new Date(article.createdAt).toLocaleDateString('zh-CN');
        
        document.getElementById('article-title').textContent = article.title;
        document.getElementById('article-category').textContent = categoryName;
        document.getElementById('article-tags').innerHTML = tagElements;
        document.getElementById('article-date').textContent = date;
        document.getElementById('article-content').innerHTML = this.formatContent(article.content);
        
        this.showPage('article');
    }
    
    showCategoryArticles(categoryId) {
        const category = this.categories[categoryId];
        if (!category) {
            console.error('Category not found:', categoryId);
            return;
        }
        
        const filteredArticles = this.articles.filter(article => 
            article.categoryId === categoryId
        );
        
        this.renderFilteredArticles(filteredArticles, `分类: ${category.name}`);
    }
    
    showTagArticles(tagId) {
        const tag = this.tags[tagId];
        if (!tag) {
            console.error('Tag not found:', tagId);
            return;
        }
        
        const filteredArticles = this.articles.filter(article => 
            article.tagIds && article.tagIds.includes(tagId)
        );
        
        this.renderFilteredArticles(filteredArticles, `标签: ${tag.name}`);
    }
    
    renderFilteredArticles(articles, title) {
        const container = document.getElementById('articles-grid');
        
        if (!container) {
            console.error('Articles grid container not found');
            return;
        }
        
        if (articles.length === 0) {
            container.innerHTML = `<p class="no-data">${title} 下暂无文章</p>`;
            return;
        }
        
        container.innerHTML = articles.map(article => {
            const category = this.categories[article.categoryId];
            const categoryName = category ? category.name : '未分类';
            
            const tagElements = article.tagIds ? article.tagIds.map(tagId => {
                const tag = this.tags[tagId];
                return tag ? `<span class="tag">${tag.name}</span>` : '';
            }).join('') : '';
            
            const date = new Date(article.createdAt).toLocaleDateString('zh-CN');
            const excerpt = article.content ? article.content.substring(0, 150) + '...' : '';
            
            return `
                <div class="article-card" data-id="${article.id}">
                    <h3>${this.escapeHtml(article.title)}</h3>
                    <p>${this.escapeHtml(excerpt)}</p>
                    <div class="article-meta">
                        <span class="category-badge">${this.escapeHtml(categoryName)}</span>
                        <div class="tags-list">${tagElements}</div>
                        <span class="article-date">${date}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        // 更新页面标题
        const pageHeader = document.querySelector('#home-page .page-header h2');
        if (pageHeader) {
            pageHeader.textContent = title;
        }
        
        // 绑定文章点击事件
        container.querySelectorAll('.article-card').forEach(card => {
            card.addEventListener('click', () => {
                const articleId = card.getAttribute('data-id');
                this.showArticle(articleId);
            });
        });
        
        this.showPage('home');
    }
    
    searchArticles() {
        const query = document.getElementById('search-input').value.toLowerCase().trim();
        
        if (!query) {
            this.renderHomePage();
            const pageHeader = document.querySelector('#home-page .page-header h2');
            if (pageHeader) {
                pageHeader.textContent = '最新文章';
            }
            return;
        }
        
        const filteredArticles = this.articles.filter(article => 
            article.title.toLowerCase().includes(query) || 
            (article.content && article.content.toLowerCase().includes(query))
        );
        
        this.renderFilteredArticles(filteredArticles, `搜索: ${query}`);
    }
    
    // 管理后台渲染函数
    renderAdminArticles() {
        const container = document.getElementById('admin-articles-list');
        
        if (!container) {
            console.error('Admin articles list container not found');
            return;
        }
        
        const articlesArray = Object.values(this.articles);
        
        if (articlesArray.length === 0) {
            container.innerHTML = '<p class="no-data">暂无文章</p>';
            return;
        }
        
        // 按创建时间倒序排列
        articlesArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        container.innerHTML = articlesArray.map(article => {
            const category = this.categories[article.categoryId];
            const categoryName = category ? category.name : '未分类';
            
            const date = new Date(article.createdAt).toLocaleDateString('zh-CN');
            
            return `
                <div class="article-item">
                    <div class="title">${this.escapeHtml(article.title)}</div>
                    <span class="category">${this.escapeHtml(categoryName)}</span>
                    <span class="status ${article.published ? 'published' : 'draft'}">
                        ${article.published ? '已发布' : '草稿'}
                    </span>
                    <span class="date">${date}</span>
                    <div class="article-actions">
                        <button class="edit-btn" data-id="${article.id}">编辑</button>
                        <button class="delete-btn" data-id="${article.id}">删除</button>
                    </div>
                </div>
            `;
        }).join('');
        
        // 绑定编辑和删除按钮事件
        container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const articleId = btn.getAttribute('data-id');
                this.editArticle(articleId);
            });
        });
        
        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const articleId = btn.getAttribute('data-id');
                this.deleteArticle(articleId);
            });
        });
    }
    
    renderAdminCategories() {
        const container = document.getElementById('categories-editor');
        
        if (!container) {
            console.error('Categories editor container not found');
            return;
        }
        
        const categoriesArray = Object.values(this.categories);
        
        container.innerHTML = categoriesArray.map(category => {
            return `
                <div class="category-item">
                    <input type="text" value="${this.escapeHtml(category.name)}" data-id="${category.id}">
                    <button class="delete-category-btn" data-id="${category.id}">删除</button>
                </div>
            `;
        }).join('');
        
        // 绑定输入框变化事件
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', () => {
                this.saveCategories();
            });
        });
        
        // 绑定删除按钮事件
        container.querySelectorAll('.delete-category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const categoryId = btn.getAttribute('data-id');
                this.deleteCategory(categoryId);
            });
        });
    }
    
    renderAdminTags() {
        const container = document.getElementById('tags-editor');
        
        if (!container) {
            console.error('Tags editor container not found');
            return;
        }
        
        const tagsArray = Object.values(this.tags);
        
        container.innerHTML = tagsArray.map(tag => {
            return `
                <div class="tag-item">
                    <input type="text" value="${this.escapeHtml(tag.name)}" data-id="${tag.id}">
                    <button class="delete-tag-btn" data-id="${tag.id}">删除</button>
                </div>
            `;
        }).join('');
        
        // 绑定输入框变化事件
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', () => {
                this.saveTags();
            });
        });
        
        // 绑定删除按钮事件
        container.querySelectorAll('.delete-tag-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tagId = btn.getAttribute('data-id');
                this.deleteTag(tagId);
            });
        });
    }
    
    openArticleEditor(articleId = null) {
        this.currentEditingArticle = articleId;
        
        // 填充分类选择框
        const categorySelect = document.getElementById('article-category-select');
        if (!categorySelect) {
            console.error('Category select element not found');
            return;
        }
        
        categorySelect.innerHTML = '<option value="">选择分类</option>';
        
        Object.values(this.categories).forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
        
        // 填充标签选择框
        const tagsSelect = document.getElementById('article-tags-select');
        if (!tagsSelect) {
            console.error('Tags select element not found');
            return;
        }
        
        tagsSelect.innerHTML = '';
        
        Object.values(this.tags).forEach(tag => {
            const option = document.createElement('option');
            option.value = tag.id;
            option.textContent = tag.name;
            tagsSelect.appendChild(option);
        });
        
        // 如果是编辑模式，填充数据
        if (articleId) {
            const article = this.articles.find(a => a.id === articleId);
            
            if (article) {
                document.getElementById('article-title-input').value = article.title;
                document.getElementById('article-category-select').value = article.categoryId || '';
                document.getElementById('article-content-textarea').value = article.content;
                document.getElementById('article-published-checkbox').checked = article.published || false;
                
                // 设置选中的标签
                if (article.tagIds) {
                    Array.from(tagsSelect.options).forEach(option => {
                        option.selected = article.tagIds.includes(option.value);
                    });
                }
            }
        } else {
            // 新建模式，清空表单
            document.getElementById('article-form').reset();
        }
        
        // 显示模态框
        const modal = document.getElementById('article-editor-modal');
        if (modal) {
            modal.classList.add('active');
        }
    }
    
    closeArticleEditor() {
        const modal = document.getElementById('article-editor-modal');
        if (modal) {
            modal.classList.remove('active');
        }
        this.currentEditingArticle = null;
    }
    
    async saveArticle() {
        const titleInput = document.getElementById('article-title-input');
        const categorySelect = document.getElementById('article-category-select');
        const contentTextarea = document.getElementById('article-content-textarea');
        const publishedCheckbox = document.getElementById('article-published-checkbox');
        
        if (!titleInput || !categorySelect || !contentTextarea || !publishedCheckbox) {
            console.error('Form elements not found');
            return;
        }
        
        const title = titleInput.value.trim();
        const categoryId = categorySelect.value;
        const content = contentTextarea.value.trim();
        const published = publishedCheckbox.checked;
        
        // 获取选中的标签
        const tagsSelect = document.getElementById('article-tags-select');
        let tagIds = [];
        if (tagsSelect) {
            tagIds = Array.from(tagsSelect.selectedOptions).map(option => option.value);
        }
        
        if (!title || !content) {
            alert('请填写标题和内容');
            return;
        }
        
        const articleData = {
            id: this.currentEditingArticle || this.generateId(),
            title,
            content,
            categoryId: categoryId || null,
            tagIds,
            published,
            createdAt: this.currentEditingArticle ? 
                (this.articles.find(a => a.id === this.currentEditingArticle)?.createdAt || new Date().toISOString()) : 
                new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // 更新本地数据
        if (this.currentEditingArticle) {
            const index = this.articles.findIndex(a => a.id === this.currentEditingArticle);
            if (index !== -1) {
                this.articles[index] = articleData;
            }
        } else {
            this.articles.push(articleData);
        }
        
        // 保存到服务器
        try {
            const response = await fetch(this.getApiBaseUrl() + '/api/admin/articles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    password: this.adminPassword,
                    articles: this.articles
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.closeArticleEditor();
                this.renderAdminArticles();
                alert('文章保存成功');
            } else {
                alert('保存失败: ' + result.error);
            }
        } catch (error) {
            console.error('Error saving article:', error);
            alert('保存失败，请检查网络连接: ' + error.message);
        }
    }
    
    editArticle(articleId) {
        this.openArticleEditor(articleId);
    }
    
    async deleteArticle(articleId) {
        if (!confirm('确定要删除这篇文章吗？')) {
            return;
        }
        
        // 从本地数据中删除
        this.articles = this.articles.filter(a => a.id !== articleId);
        
        // 保存到服务器
        try {
            const response = await fetch(this.getApiBaseUrl() + '/api/admin/articles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    password: this.adminPassword,
                    articles: this.articles
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.renderAdminArticles();
                alert('文章删除成功');
            } else {
                alert('删除失败: ' + result.error);
            }
        } catch (error) {
            console.error('Error deleting article:', error);
            alert('删除失败，请检查网络连接: ' + error.message);
        }
    }
    
    addNewCategory() {
        const container = document.getElementById('categories-editor');
        
        if (!container) {
            console.error('Categories editor container not found');
            return;
        }
        
        const newId = this.generateId();
        
        const newCategoryHTML = `
            <div class="category-item">
                <input type="text" placeholder="新分类名称" data-id="${newId}">
                <button class="delete-category-btn" data-id="${newId}">删除</button>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', newCategoryHTML);
        
        // 绑定事件
        const newInput = container.querySelector(`input[data-id="${newId}"]`);
        const newDeleteBtn = container.querySelector(`.delete-category-btn[data-id="${newId}"]`);
        
        if (newInput && newDeleteBtn) {
            newInput.addEventListener('change', () => {
                this.saveCategories();
            });
            
            newDeleteBtn.addEventListener('click', () => {
                this.deleteCategory(newId);
            });
            
            // 聚焦到新输入框
            newInput.focus();
        }
    }
    
    async saveCategories() {
        const container = document.getElementById('categories-editor');
        
        if (!container) {
            console.error('Categories editor container not found');
            return;
        }
        
        const inputs = container.querySelectorAll('input');
        
        const newCategories = {};
        
        inputs.forEach(input => {
            const id = input.getAttribute('data-id');
            const name = input.value.trim();
            
            if (name) {
                newCategories[id] = {
                    id,
                    name
                };
            }
        });
        
        this.categories = newCategories;
        
        // 保存到服务器
        try {
            const response = await fetch(this.getApiBaseUrl() + '/api/admin/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    password: this.adminPassword,
                    categories: newCategories
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                alert('保存分类失败: ' + result.error);
            }
        } catch (error) {
            console.error('Error saving categories:', error);
            alert('保存分类失败，请检查网络连接: ' + error.message);
        }
    }
    
    async deleteCategory(categoryId) {
        // 检查是否有文章使用这个分类
        const articlesUsingCategory = this.articles.filter(article => 
            article.categoryId === categoryId
        );
        
        if (articlesUsingCategory.length > 0) {
            alert(`无法删除该分类，有 ${articlesUsingCategory.length} 篇文章正在使用它。请先修改这些文章的分类。`);
            return;
        }
        
        // 从本地数据中删除
        delete this.categories[categoryId];
        
        // 保存到服务器
        await this.saveCategories();
        
        // 重新渲染分类编辑器
        this.renderAdminCategories();
    }
    
    addNewTag() {
        const container = document.getElementById('tags-editor');
        
        if (!container) {
            console.error('Tags editor container not found');
            return;
        }
        
        const newId = this.generateId();
        
        const newTagHTML = `
            <div class="tag-item">
                <input type="text" placeholder="新标签名称" data-id="${newId}">
                <button class="delete-tag-btn" data-id="${newId}">删除</button>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', newTagHTML);
        
        // 绑定事件
        const newInput = container.querySelector(`input[data-id="${newId}"]`);
        const newDeleteBtn = container.querySelector(`.delete-tag-btn[data-id="${newId}"]`);
        
        if (newInput && newDeleteBtn) {
            newInput.addEventListener('change', () => {
                this.saveTags();
            });
            
            newDeleteBtn.addEventListener('click', () => {
                this.deleteTag(newId);
            });
            
            // 聚焦到新输入框
            newInput.focus();
        }
    }
    
    async saveTags() {
        const container = document.getElementById('tags-editor');
        
        if (!container) {
            console.error('Tags editor container not found');
            return;
        }
        
        const inputs = container.querySelectorAll('input');
        
        const newTags = {};
        
        inputs.forEach(input => {
            const id = input.getAttribute('data-id');
            const name = input.value.trim();
            
            if (name) {
                newTags[id] = {
                    id,
                    name
                };
            }
        });
        
        this.tags = newTags;
        
        // 保存到服务器
        try {
            const response = await fetch(this.getApiBaseUrl() + '/api/admin/tags', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    password: this.adminPassword,
                    tags: newTags
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                alert('保存标签失败: ' + result.error);
            }
        } catch (error) {
            console.error('Error saving tags:', error);
            alert('保存标签失败，请检查网络连接: ' + error.message);
        }
    }
    
    async deleteTag(tagId) {
        // 检查是否有文章使用这个标签
        const articlesUsingTag = this.articles.filter(article => 
            article.tagIds && article.tagIds.includes(tagId)
        );
        
        if (articlesUsingTag.length > 0) {
            alert(`无法删除该标签，有 ${articlesUsingTag.length} 篇文章正在使用它。请先修改这些文章的标签。`);
            return;
        }
        
        // 从本地数据中删除
        delete this.tags[tagId];
        
        // 保存到服务器
        await this.saveTags();
        
        // 重新渲染标签编辑器
        this.renderAdminTags();
    }
    
    async exportData() {
        try {
            const response = await fetch(this.getApiBaseUrl() + '/api/admin/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    password: this.adminPassword
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                const dataStr = JSON.stringify(result.data, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                
                const url = URL.createObjectURL(dataBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `knowledge-base-backup-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                alert('数据导出成功');
            } else {
                alert('导出失败: ' + result.error);
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('导出失败，请检查网络连接: ' + error.message);
        }
    }
    
    async importData(file) {
        if (!file) return;
        
        if (!confirm('导入数据将覆盖现有数据，确定要继续吗？')) {
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                const response = await fetch(this.getApiBaseUrl() + '/api/admin/import', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        password: this.adminPassword,
                        data
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                
                if (result.success) {
                    // 重新加载数据
                    await this.loadAdminData();
                    alert('数据导入成功');
                } else {
                    alert('导入失败: ' + result.error);
                }
            } catch (error) {
                console.error('Error importing data:', error);
                alert('导入失败，文件格式不正确: ' + error.message);
            }
        };
        
        reader.readAsText(file);
        
        // 清空文件输入
        const importFile = document.getElementById('import-file');
        if (importFile) {
            importFile.value = '';
        }
    }
    
    // 健康检查
    async healthCheck() {
        try {
            const response = await fetch(this.getApiBaseUrl() + '/health');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            console.log('Health check:', result);
            return result;
        } catch (error) {
            console.error('Health check failed:', error);
            return { status: 'error', error: error.message };
        }
    }
    
    // 工具函数
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
    
    formatContent(content) {
        if (!content) return '';
        
        // 简单的Markdown格式处理
        return content
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }
    
    escapeHtml(unsafe) {
        if (unsafe === null || unsafe === undefined) return '';
        
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // 更新图标
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = newTheme === 'dark' ? '🌙' : '☀️';
        }
    }
    
    updateTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // 更新图标
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
        }
    }
    
    showError(message) {
        // 简单的错误提示
        console.error('Application Error:', message);
        // 可以在这里添加更复杂的错误显示逻辑
    }
}

// PWA Service Worker 注册
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new KnowledgeBaseApp();
});
