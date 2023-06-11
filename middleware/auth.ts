const ignores = [
  '/',
  '/favicon.ico',
]

if (!process.env.API_ACCESS_TOKEN) {
  console.warn('No `API_ACCESS_TOKEN` provided.')
}

export default eventHandler(async (event) => {
  if (ignores.includes(getRequestURL(event).pathname)) {
    return
  }

  const token
    = getCookie(event, 'Authorization')
    || getHeader(event, 'Authorization')
    || (getQuery(event) as { access_token: string }).access_token

  if (!token || token !== process.env.API_ACCESS_TOKEN) {
    setResponseStatus(event, 401)
    return {
      code: 401,
      success: false,
      message: 'Unauthorized.',
    }
  }
})
