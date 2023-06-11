interface WechatError {
  errcode: number
  errmsg: string
}

type WechatResponse<T> = T | WechatError

interface AccessToken {
  access_token: string
  expires_in: number
}

interface WechatMessage<D = {}> {
  touser: string
  template_id: string
  data: {
    [K in keyof D]: D[K] | { value: D[K]; color?: string }
  }
  url?: string
  topcolor?: string
}

const $wechat = $fetch.create({
  baseURL: 'https://api.weixin.qq.com/cgi-bin/',
})

function isWechatError(val: unknown): val is WechatError {
  return (
    val
    && typeof val === 'object'
    && 'errcode' in val
    && val.errcode !== 0
  )
}

async function getAccessToken({ appID, appsecret }: { appID: string; appsecret: string }): Promise<WechatResponse<AccessToken>> {
  return await $wechat<WechatResponse<AccessToken>>(
    `token?grant_type=client_credential&appid=${appID}&secret=${appsecret}`,
  )
}

const cache: AccessToken = {
  expires_in: 0,
  access_token: '',
}

export default eventHandler(async (event) => {
  // 0. Check ENV
  if (
    !process.env.WECHAT_APP_ID
    || !process.env.WECHAT_APP_SECRET
    || !process.env.WECHAT_TEMPLATE_ID
    || !process.env.WECHAT_TO_USER
  ) {
    return {
      code: 500,
      success: false,
      message: 'No `WECHAT_APP_ID` or `WECHAT_APP_SECRET` or `WECHAT_TEMPLATE_ID` or `WECHAT_TO_USER` provided.',
    }
  }

  // 1. Valid Query
  const query = getQuery(event) as { title: string; desc: string }
  if (!query.title || !query.desc) {
    return {
      code: 402,
      success: false,
      message: 'Parameter `title` and `desc` are required.',
    }
  }

  // 2. Check Access Token
  if (cache.expires_in < Date.now()) {
    const response = await getAccessToken({
      appID: process.env.WECHAT_APP_ID,
      appsecret: process.env.WECHAT_APP_SECRET,
    })

    if (isWechatError(response)) {
      return {
        success: false,
        code: response.errcode,
        message: response.errmsg,
      }
    }

    cache.access_token = response.access_token
    cache.expires_in = Date.now() + (response.expires_in - 1000)
  }

  // 3. Build Message
  const message: WechatMessage<{ Title: string; Desc: string }> = {
    touser: process.env.WECHAT_TO_USER,
    template_id: process.env.WECHAT_TEMPLATE_ID,
    data: {
      Title: {
        value: query.title,
      },
      Desc: {
        value: query.desc,
      },
    },
  }

  // 4. Send Message
  const response = await $wechat<WechatResponse<{ msgid: string }>>(
    `/message/template/send?access_token=${cache.access_token}`,
    {
      method: 'POST',
      body: message,
    },
  )

  if (isWechatError(response)) {
    return {
      success: false,
      code: response.errcode,
      message: response.errmsg,
    }
  }

  return {
    code: 0,
    success: true,
    message: 'Message sent successfully.',
    // data: message // for debug
  }
})
