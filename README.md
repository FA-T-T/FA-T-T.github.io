# FA-T-T.github.io

这个站现在已经切到 **Jekyll + GitHub Pages**。

目标很简单：以后写博客时，只维护 Markdown，不再手写整页 HTML。

## 公开文章怎么写

1. 复制 `templates/post-template.md`
2. 新建到 `_posts/YYYY-MM-DD-slug.md`
3. 填 front matter
4. 用 Markdown 写正文
5. 推送到 `main`，GitHub Actions 会自动构建并部署

## 草稿怎么写

- 未准备发布的内容放在 `_drafts/slug.md`
- GitHub Pages 不会发布 `_drafts`
- 当前已有一篇草稿：`_drafts/optimizer-selection.md`

## 本地预览

如果本机装了 Ruby 和 Bundler：

```bash
bundle install
bundle exec jekyll serve --livereload
```

然后访问：

```text
http://127.0.0.1:4000
```

## 目录说明

- `index.html`: 主页
- `blog/`: 博客目录页
- `_posts/`: 公开博客
- `_drafts/`: 未发布草稿
- `notes/`: 现有研究札记页
- `css/` `js/` `images/`: 静态资源
