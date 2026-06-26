# 资产扫码盘点工具

一个适合手机现场使用的资产盘点网页工具，支持二维码/条形码扫描、拍照 OCR 识别、资产信息录入、编辑和导出 Excel。

> 本项目是纯前端网页：资产数据和图片不会被上传到本项目服务器；录入列表暂存于当前浏览器本地。正式资产总表仍应以公司规定的数据源为准。

---

## 功能

- 扫描二维码
- 扫描一维条形码：Code 128、Code 39、EAN、UPC 等
- 拍照 OCR，尝试自动识别标签中的 SN 序列号和型号
- 手动填写型号、位置、使用人、状态、备注
- 已录入资产支持**编辑**、删除
- 自动保存当前录入列表到浏览器本地
- 自定义导出 Excel 文件名
- 一键导出 Excel

---

## 手机使用方法

部署成功后，用手机浏览器打开你的 GitHub Pages 地址：

```text
https://你的GitHub用户名.github.io/你的仓库名/
```

例如：

```text
https://justinfoxy.github.io/monitor-inventory-scanner/
```

### iPhone：添加到主屏幕

1. 用 **Safari** 打开上述网页。
2. 点击底部或地址栏附近的 **分享** 图标。
3. 向下找到并点击 **添加到主屏幕**。
4. 修改名称，例如“资产盘点”。
5. 点击右上角 **添加**。

之后手机桌面会出现图标，点击即可使用，体验接近 App。

### Android：添加到主屏幕

1. 用 Chrome 打开上述网页。
2. 点击右上角 **⋮**。
3. 点击 **添加到主屏幕** 或 **安装应用**。
4. 确认添加。

---

## 用手机部署到 GitHub Pages

下面的步骤不需要电脑；可以直接在手机浏览器里完成。第一次操作建议使用 Safari 或 Chrome，并登录 GitHub。

### 准备文件

本项目至少应包含这几个文件，并且它们要直接放在仓库最外层：

```text
index.html
style.css
app.js
README.md
```

不要把它们再套进一层同名文件夹，否则 GitHub Pages 可能打不开主页。

---

### 第 1 步：注册或登录 GitHub

1. 打开 GitHub 官网并登录账号。
2. 没有账号时，先注册一个免费账号并完成邮箱验证。

---

### 第 2 步：新建仓库

1. 在 GitHub 页面点击右上角 **+**。
2. 点击 **New repository**。
3. 填写仓库名称，例如：

```text
asset-inventory
```

4. 建议选择 **Public**。
5. 点击 **Create repository**。

> 仓库名称会出现在网址里。  
> 例如用户名是 `yourname`，仓库叫 `asset-inventory`，网页地址通常是：  
> `https://yourname.github.io/asset-inventory/`

---

### 第 3 步：上传项目文件

1. 进入刚创建的仓库。
2. 在空仓库页面点击 **uploading an existing file**。  
   已有文件的仓库则点击 **Add file** → **Upload files**。
3. 选择或拖入：

```text
index.html
style.css
app.js
README.md
```

4. 确认这几个文件没有放进子文件夹。
5. 页面下方填写提交说明，例如：

```text
首次上传资产盘点工具
```

6. 点击 **Commit changes**。

上传后仓库主页应该直接看到：

```text
app.js
index.html
README.md
style.css
```

---

### 第 4 步：开启 GitHub Pages

1. 在仓库上方点击 **Settings**。
2. 在左侧菜单中找到 **Pages**。
3. 在 **Build and deployment** 区域设置：

```text
Source：Deploy from a branch
Branch：main
Folder：/root
```

4. 点击 **Save**。
5. 等待约 1～3 分钟，页面会出现部署成功提示和网站地址。

网址格式通常为：

```text
https://你的GitHub用户名.github.io/你的仓库名/
```

---

### 第 5 步：用手机测试

打开 GitHub Pages 地址后：

1. 输入本次 Excel 文件名，例如：`显示器盘点`。
2. 选择扫描模式：
   - 资产贴纸是二维码：选择“二维码”
   - 资产贴纸是长条码：选择“一维条形码”
3. 点击扫码，首次使用请允许浏览器访问摄像头。
4. 补充型号、位置、使用人、状态、备注。
5. 点击 **添加到列表**。
6. 填错时，在已录入列表点击 **编辑**，修改后保存。
7. 完成后点击 **导出 Excel**。

---

## 更新网页版本

修改了 `index.html`、`style.css` 或 `app.js` 后：

1. 打开 GitHub 仓库。
2. 点击要更新的文件。
3. 点击右上角铅笔图标 **Edit this file**。
4. 用新版内容覆盖旧内容。
5. 点击页面下方 **Commit changes**。
6. 等待约 1 分钟后刷新 GitHub Pages 页面。

手机还显示旧版时：

- 手动刷新网页；
- 关闭浏览器页面后重新打开；
- iPhone Safari 可长按刷新按钮后选择重新加载；
- 仍不行时，可清除该网站缓存后再打开。

---

## 使用注意事项

- 扫码功能需要 **HTTPS** 页面，因此建议使用 GitHub Pages。
- 条形码扫描时，让条码横向占满取景框，避免反光、阴影和模糊。
- OCR 结果必须人工核对，特别注意 `O/0`、`I/1`、`S/5` 等易混淆字符。
- 浏览器本地数据只保存在当前设备、当前浏览器中；完成盘点后建议及时导出 Excel。
- 不要把包含公司内部资产信息的 Excel、照片或敏感资料上传到公开仓库、公开网盘。
- GitHub Pages 上的网页代码是公开可见的；不要把公司账号、密码、内部接口地址或真实资产数据写进代码。

---

## 项目文件说明

```text
index.html   页面结构
style.css    页面样式
app.js       扫码、OCR、资产编辑、本地保存、Excel 导出逻辑
README.md    项目说明和部署教程
```

---

## 使用的第三方库

- [html5-qrcode](https://github.com/mebjas/html5-qrcode)：二维码和条形码扫描
- [Tesseract.js](https://github.com/naptha/tesseract.js)：图片 OCR 识别
- [SheetJS / xlsx](https://sheetjs.com/)：导出 Excel

---

## 后续可考虑的功能

- 上传资产总表后，按 SN 自动匹配已有资产
- 显示器、电脑、打印机等不同设备模板
- 支持按位置、状态、使用人筛选
- 导出“待更新清单”
- 保存设备照片附件
- 公司内网部署或云端同步
