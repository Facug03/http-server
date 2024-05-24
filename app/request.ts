export class Request {
  private request: string
  public httpMethod: string
  public routes: string[]
  public body: string | undefined

  constructor(request: Buffer) {
    const bufferToString = request.toString()
    this.request = bufferToString.toString()
    this.httpMethod = bufferToString.split(' ')[0]
    this.routes = this.getRoutes()
    this.body = bufferToString.split('\r\n\r\n')[1]
  }

  private getRoutes() {
    const [_, path] = this.request.toString().split(' ')
    const routes = path.split('/')

    return routes
  }

  public findHeaders(header: string) {
    const headers = this.request.toString().split('\r\n')
    const headerFound = headers
      .find((item) => item.toLowerCase().includes(header.toLowerCase()))
      ?.split(':')
      ?.slice(1)
      ?.join('')
      ?.trim()

    return headerFound ?? ''
  }
}
