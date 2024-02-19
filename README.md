# 心路历程

最用心的一个项目（要恰饭敢不认真嘛）添加详尽文档，若对您有帮助，卑微求个 Star 不过分吧 T_T

一开始单纯为找工作，随便折腾下，学点新东西，TailWindCSS 最近很火，一直想练练手。随着细节完善就想着干脆掘金发个帖好了，记录 TSS 的学习过程，再一想这不是为找工作嘛，简历公开就公开吧，于是就有了这个项目。

> ps 本质是为了学习 TailWindCss 折腾的，毕竟不是写博客主题，以简约阅读为主
> 如果您想改成自己的建议直接 Fork。项目的目录结构、模块分层，为新入手 Vue3+TS 的同学提供参考
> 其他的看掘金帖子上的内容就好，那上面很全，这里捡重要的说

在线浏览 [resume.fridolph.top](https://resume.fridolph.top)

## 简历进行了较大的修改，所以也对应一些组件的修改

- 扩展了 list type，支持 ul dl ，就不用手动写 - 和 1. 序号了 （之前没想这么多，经提醒，是挺脑壳大）
- 增加了一个学信网的验证，看个人把，不需要注释掉就好
- 大多是简历润色 = = 需要的可根据最新修改（确实比我的编得好太了，感谢大佬）参考下
- personal 多了个 最新文章 ，感觉有这个需求嘛
- 暂时够用，其他请自行修改了

## pnpm install

> 注：本项目使用 pnpm 作为包管理工具，请升级 Node 版本到 16.22.2 以上

<img
alt="Static Badge"
src="https://img.shields.io/badge/%E8%84%9A%E6%89%8B%E6%9E%B6-vite-red" />
<img
alt="Static Badge"
src="https://img.shields.io/badge/%E5%89%8D%E7%AB%AF%E6%A1%86%E6%9E%B6-Vue3-%236495ed" />
<img
alt="Static Badge"
src="https://img.shields.io/badge/UI-TailWind-green" />
<img
alt="Static Badge"
src="https://img.shields.io/badge/%E8%84%9A%E6%9C%AC%E8%AF%AD%E8%A8%80-TypeScript-%25236495ed" />
<img
alt="Static Badge"
src="https://img.shields.io/badge/UI-fri_element_plus-%238a2be2" />

本以为会用到 postcss，结果还真没在 template 里写 css = = 习惯了 TW 是真的爽。~~fri-element-plus 是之前练手的一个组件库项目顺便实践一下，看管们可自行去掉~~
在优化实践章节已去掉。

## 配置参考

### postcss.config.cjs

参考官网配置即可 <https://tailwindcss.com/docs/installation>

```js
module.exports = {
  plugins: [
    require('postcss-import'),
    require('postcss-nested'),
    require('autoprefixer'),
    require('tailwindcss'),
    require('tailwindcss/nesting'),
  ],
}
```

### vite.config.js

为打包后的文件提供传统浏览器兼容性支持

> Vite 社区还有很多实用插件，可自行尝试

- compression 打包生成 .gz
- chunkSplitPlugin 打包不同的 vendor
- prefetchPlugin 打包后的 .html 添加 prefetch

### 关于一些坑

1. 关于下载：把 public 里的 .md .pdf 换成你自己的即可。检查好简历内容，避免尴尬情况发生。

2. 如果不需要国际化，可切换到另一分支。

3. 服务器上大多不支持中文，用英文字母+数字命名可避免一些潜在的坑

4. 安装问题 看下是不是 taobao 源的锅，注：已经换地址了，老地址不能用

5. 暂时想到这些，祝大家大吉大利，找到满意的工作
