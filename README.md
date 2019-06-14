# tutor-coach-www

### 建置
> 以 gulp 4 + rollup，依據環境打包成不同的 package，打包後的檔案，
一律在 dist 目錄下。

1. 先安裝所需的 js 元件， ***`npm install`*** or ***`yarn install`***
2. 依據環境鍵入：

```bash
  # UI 測試
  npm run ui
  
  # 前端 js 開發環境
  npm run dev
```
> 執行完成後，會依據不同環境，自動開啟瀏覽器，執行指定 port 所對應之服務
> - ***ui ==> `localhost: 30000`***
> - ***dev ==> `localhost: 30001`***

3. 監聽 sass, pug, image 檔案變化，鍵入：

```bash
  # 可能需要等候一下子，才能在 dist 看到改變後的內容
  gulp watch
```

>> P.S. 還有一項指令： ***`gulp packageToUi`*** 
可以編譯 `sass`、`pug` 與壓縮圖片到 `dist` 目錄，
但因為執行時，仍然仰賴 `js` 檔，故建議還是直接執行 ***`npm run ${環境}`***