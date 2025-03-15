const axios = require('axios');

const NEWS_API_KEY = process.env.NEWS_API_KEY || 'your-api-key-here';
const BASE_URL = 'https://newsapi.org/v2';

async function fetchTodaysNews() {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const response = await axios.get(`${BASE_URL}/everything`, {
            params: {
                q: 'technology OR business OR science',
                from: today,
                to: today,
                language: 'en',
                sortBy: 'publishedAt',
                apiKey: NEWS_API_KEY
            }
        });

        const articles = response.data.articles;
        
        console.log(`=== 今日新闻 (${today}) ===\n`);
        
        articles.slice(0, 10).forEach((article, index) => {
            console.log(`${index + 1}. ${article.title}`);
            console.log(`   来源: ${article.source.name}`);
            console.log(`   时间: ${new Date(article.publishedAt).toLocaleString('zh-CN')}`);
            console.log(`   链接: ${article.url}`);
            if (article.description) {
                console.log(`   摘要: ${article.description.substring(0, 100)}...`);
            }
            console.log('');
        });
        
    } catch (error) {
        console.error('获取新闻失败:', error.message);
        
        if (error.response && error.response.status === 401) {
            console.log('\n请设置有效的 NEWS_API_KEY 环境变量。');
            console.log('获取API密钥: https://newsapi.org/register');
            console.log('使用方法: export NEWS_API_KEY=your-actual-api-key');
        }
    }
}

if (require.main === module) {
    fetchTodaysNews();
}

module.exports = { fetchTodaysNews };