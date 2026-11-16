# 课桌便利贴

一块中学课桌上的便利贴墙：用颜色表达时间压力，用揭贴完成任务。

- 红：最紧急，同时最多 3 张；橙：要做但不赶；绿：长期
- 颜色可随时切换；正面一句，翻面写细节
- 揭下后进入墙边抽屉，还可以贴回墙上
- 数据只存在浏览器本地（localStorage），无登录

## 本地部署（OrbStack / Docker）

```bash
cd desk-sticky
docker compose up -d --build
```

访问：http://127.0.0.1:5176/ 或 https://sticky.kecanwen.com/
