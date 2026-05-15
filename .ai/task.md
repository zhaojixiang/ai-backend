## 限制请参考

./rule.md

## 文章管理

对应组件：`components/ArticlePanel.tsx`  
类型：`AdminArticle`（`BlogArticleDetail` + 可选 `contentHtml`）

### 接口

| 方法     | 路径                  | 说明 |
| -------- | --------------------- | ---- |
| `GET`    | `/admin/articles`     | 列表 |
| `POST`   | `/admin/articles`     | 新建 |
| `PUT`    | `/admin/articles/:id` | 更新 |
| `DELETE` | `/admin/articles/:id` | 删除 |

**`GET /admin/articles` 查询参数**

| 参数       | 类型   | 说明             |
| ---------- | ------ | ---------------- |
| `q`        | string | 可选，搜索关键词 |
| `page`     | number | 页码，从 1       |
| `pageSize` | number | 每页条数         |

**`GET` 响应 `data`**

```json
{
  "items": ["AdminArticle"],
  "total": 100,
  "page": 1,
  "pageSize": 10
}
```

### `AdminArticle` / 写入体字段

与前台 `BlogArticleDetail` 一致，并扩展 `contentHtml`（富文本编辑用）。

| 字段              | 类型     | 必填 | 说明                                                   |
| ----------------- | -------- | ---- | ------------------------------------------------------ |
| `id`              | string   | 是   | 主键                                                   |
| `title`           | string   | 是   | 标题                                                   |
| `excerpt`         | string   | 是   | 摘要                                                   |
| `publishedAt`     | string   | 是   | `YYYY-MM-DD`                                           |
| `category`        | string   | 是   | 分类名                                                 |
| `tags`            | string[] | 是   | 标签                                                   |
| `views`           | number   | 是   | 阅读量                                                 |
| `likes`           | number   | 是   | 点赞                                                   |
| `comments`        | number   | 是   | 评论数                                                 |
| `author`          | string   | 是   | 作者展示名                                             |
| `coverImage`      | string   | 是   | 封面 URL                                               |
| `contentMarkdown` | string   | 是   | 正文（Markdown）；后台由富文本抽纯文本同步一份便于检索 |
| `contentHtml`     | string   | 否   | 富文本 HTML，与 Quill 一致                             |

**`POST` / `PUT` 请求体**：与上表相同（`POST` 可无 `id`，由服务端生成）。

---
