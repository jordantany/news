const axios = require('axios');
const Database = require('./database');

const NEWS_API_KEY = process.env.NEWS_API_KEY || 'your-api-key-here';
const BASE_URL = 'https://newsapi.org/v2';

// 币圈相关关键词
const CRYPTO_KEYWORDS = [
    'bitcoin', 'ethereum', 'cryptocurrency', 'crypto', 'blockchain',
    'BTC', 'ETH', 'altcoin', 'defi', 'NFT', 'web3', 'binance',
    'coinbase', 'dogecoin', 'solana', 'cardano', 'polkadot',
    'chainlink', 'litecoin', 'ripple', 'XRP', 'mining', 'wallet',
    'exchange', 'trading', 'hodl', 'bull market', 'bear market'
];

async function fetchCryptoNews(saveToDb = false) {
    const db = saveToDb ? new Database() : null;
    
    try {
        if (db) {
            await db.init();
        }
        
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // 构建查询字符串
        const cryptoQuery = CRYPTO_KEYWORDS.slice(0, 10).join(' OR ');
        
        const response = await axios.get(`${BASE_URL}/everything`, {
            params: {
                q: cryptoQuery,
                from: yesterday,
                to: today,
                language: 'en',
                sortBy: 'publishedAt',
                pageSize: 50,
                apiKey: NEWS_API_KEY
            }
        });

        const articles = response.data.articles;
        
        console.log(`=== 币圈新闻监控 (${today}) ===`);
        console.log(`总共找到 ${articles.length} 条相关新闻\n`);
        
        let savedCount = 0;
        
        // 按重要性和相关性排序显示前15条
        for (let i = 0; i < Math.min(15, articles.length); i++) {
            const article = articles[i];
            console.log(`${i + 1}. ${article.title}`);
            console.log(`   来源: ${article.source.name}`);
            console.log(`   时间: ${new Date(article.publishedAt).toLocaleString('zh-CN')}`);
            console.log(`   链接: ${article.url}`);
            if (article.description) {
                console.log(`   摘要: ${article.description.substring(0, 150)}...`);
            }
            
            // 标识关键词匹配
            const matchedKeywords = CRYPTO_KEYWORDS.filter(keyword => 
                article.title.toLowerCase().includes(keyword.toLowerCase()) ||
                (article.description && article.description.toLowerCase().includes(keyword.toLowerCase()))
            );
            if (matchedKeywords.length > 0) {
                console.log(`   关键词: ${matchedKeywords.join(', ')}`);
            }
            
            // 保存到数据库
            if (db) {
                try {
                    await db.saveNews(article, matchedKeywords);
                    savedCount++;
                    console.log(`   ✅ 已保存到数据库`);
                } catch (saveError) {
                    console.log(`   ⚠️ 保存失败: ${saveError.message}`);
                }
            }
            
            console.log('');
        }
        
        if (db) {
            const totalCount = await db.getNewsCount();
            console.log(`📊 数据库统计: 本次保存 ${savedCount} 条，总计 ${totalCount} 条新闻`);
            await db.close();
        }
        
    } catch (error) {
        console.error('获取币圈新闻失败:', error.message);
        
        if (error.response && error.response.status === 401) {
            console.log('\n请设置有效的 NEWS_API_KEY 环境变量。');
            console.log('获取API密钥: https://newsapi.org/register');
            console.log('使用方法: export NEWS_API_KEY=your-actual-api-key');
        }
        
        if (db) {
            await db.close();
        }
    }
}

// 兼容原有函数名
async function fetchTodaysNews() {
    return fetchCryptoNews();
}

if (require.main === module) {
    fetchTodaysNews();
}

module.exports = { fetchTodaysNews, fetchCryptoNews };