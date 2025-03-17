const { fetchCryptoNews } = require('./fetch-news');

console.log('🚀 启动币圈新闻监控...\n');

async function startCryptoMonitoring() {
    await fetchCryptoNews();
    
    console.log('\n💡 提示：');
    console.log('- 此脚本监控比特币、以太坊等主流加密货币新闻');
    console.log('- 包含 DeFi、NFT、Web3 等热门领域');
    console.log('- 新闻来源包括主流财经媒体和科技网站');
    console.log('- 建议定期运行以获取最新资讯');
}

if (require.main === module) {
    startCryptoMonitoring();
}