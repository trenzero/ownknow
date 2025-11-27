// 在KnowledgeBaseApp类中添加改进的登录方法
async adminLogin() {
    const password = document.getElementById('admin-password').value;
    
    if (!password) {
        alert('请输入管理员密码');
        return;
    }
    
    this.adminPassword = password;
    
    try {
        console.log('Attempting admin login...');
        
        const response = await fetch('/api/admin/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                password: this.adminPassword
            })
        });
        
        console.log('Login response status:', response.status);
        
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

// 添加健康检查方法
async healthCheck() {
    try {
        const response = await fetch('/health');
        const result = await response.json();
        console.log('Health check:', result);
        return result;
    } catch (error) {
        console.error('Health check failed:', error);
        return { status: 'error', error: error.message };
    }
}

// 在init方法中添加健康检查
async init() {
    this.bindEvents();
    
    // 先进行健康检查
    const health = await this.healthCheck();
    console.log('System health:', health);
    
    this.loadData();
    this.updateTheme();
}
