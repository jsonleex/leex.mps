# 云函数 + 测试公众号 = 推送系统

## 配置测试公众号

1. 前往「[微信公众平台 - 测试号管理](http://mp.weixin.qq.com/debug/cgi-bin/sandbox?t=sandbox/login)」扫码登录

2. 登录成功后，记录「测试号信息」，后续开发会使用到以下信息

   - `appID`
   - `appsecret`

3. 登录成功后，使用个人微信扫描「测试号二维码」关注刚刚创建的测试公众号

4. 点击「新增测试模板」模板标题：简单通知，模板内容如下

   ```txt
   标题：{{Title.DATA}}
   描述：{{Desc.DATA}}
   ```

## 云函数开发

**接口设计**

1. 路径 `/wechat`

2. 接受两个参数 `title` 和 `content`

3. 调用「微信认证接口[^1]」 获取 `access_token`

4. 调用「微信消息推送接口[^2]」推送指定内容至个人微信

[^1]: <https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET>
[^2]: <https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=ACCESS_TOKEN>

**创建项目**

使用「[unjs/Nitro](https://github.com/unjs/nitro)」初始化项目

```sh
npx giget nitro leex.mps
```

**逻辑代码**

详见 [routers/wechat.ts](./routes/wechat.ts)

避免接口滥用，添加鉴权功能：[middleware/auth.ts](./middleware/auth.ts)
