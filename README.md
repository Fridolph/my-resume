# 心路历程

最用心的一个项目（要恰饭敢不认真嘛）添加详尽文档，若对您有帮助，卑微求个 Star 不过分吧 T_T

一开始单纯为找工作，随便折腾下，学点新东西，TailWindCSS 最近很火，一直想练练手。随着细节完善就想着干脆掘金发个帖好了，记录 TWCSS 的学习过程，再一想这不是为找工作嘛，简历公开就公开吧，于是就有了这个 开源??项目

> ps 本质是为了学习 TailWindCss 折腾的，毕竟不是写博客主题，以简约阅读为主
> 如果您想魔改直接 Fork 即可。项目的目录结构、模块分层，为新入手 Vue3+TS 的同学提供参考

在线浏览 [resume.fridolph.top](https://resume.fridolph.top)

## npm install

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

本以为会用到postcss，结果还真没在template里写css = = 习惯了TW是真的爽。fri-element-plus 是之前练手的一个组件库项目顺便实践一下，看管们可自行去掉


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