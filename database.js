const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'crypto_news.db');

class Database {
    constructor() {
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) {
                    console.error('数据库连接失败:', err.message);
                    reject(err);
                } else {
                    console.log('✅ 已连接到 SQLite 数据库');
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async createTables() {
        return new Promise((resolve, reject) => {
            const createNewsTable = `
                CREATE TABLE IF NOT EXISTS crypto_news (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    url TEXT UNIQUE NOT NULL,
                    source_name TEXT,
                    published_at DATETIME,
                    keywords TEXT,
                    content_hash TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            this.db.run(createNewsTable, (err) => {
                if (err) {
                    console.error('创建表失败:', err.message);
                    reject(err);
                } else {
                    console.log('✅ 数据库表已就绪');
                    resolve();
                }
            });
        });
    }

    async saveNews(article, keywords = []) {
        return new Promise((resolve, reject) => {
            const contentHash = this.generateHash(article.title + article.url);
            
            const insertSQL = `
                INSERT OR REPLACE INTO crypto_news 
                (title, description, url, source_name, published_at, keywords, content_hash, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `;

            const values = [
                article.title,
                article.description || '',
                article.url,
                article.source?.name || '',
                article.publishedAt,
                keywords.join(','),
                contentHash
            ];

            this.db.run(insertSQL, values, function(err) {
                if (err) {
                    console.error('保存新闻失败:', err.message);
                    reject(err);
                } else {
                    resolve({
                        id: this.lastID,
                        changes: this.changes
                    });
                }
            });
        });
    }

    async getRecentNews(limit = 20) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM crypto_news 
                ORDER BY published_at DESC 
                LIMIT ?
            `;

            this.db.all(query, [limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async getNewsByKeyword(keyword, limit = 10) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM crypto_news 
                WHERE keywords LIKE ? OR title LIKE ?
                ORDER BY published_at DESC 
                LIMIT ?
            `;

            const searchTerm = `%${keyword}%`;
            this.db.all(query, [searchTerm, searchTerm, limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async getNewsCount() {
        return new Promise((resolve, reject) => {
            const query = 'SELECT COUNT(*) as count FROM crypto_news';
            
            this.db.get(query, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row.count);
                }
            });
        });
    }

    generateHash(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    async close() {
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('关闭数据库连接失败:', err.message);
                    } else {
                        console.log('✅ 数据库连接已关闭');
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = Database;