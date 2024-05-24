export class Request {
  private request: string
  public httpMethod: string
  public routes: string[]
  public body: string | undefined

  constructor(request: Buffer) {
    const bufferToString = request.toString()
    this.request = bufferToString

    const [headersPart, bodyPart] = bufferToString.split('\r\n\r\n')
    const requestLine = headersPart.split('\r\n')[0]

    this.httpMethod = this.extractHttpMethod(requestLine)
    this.routes = this.extractRoutes(requestLine)
    this.body = bodyPart
  }

  private extractHttpMethod(requestLine: string): string {
    return requestLine.split(' ')[0]
  }

  private extractRoutes(requestLine: string): string[] {
    const path = requestLine.split(' ')[1]
    return path.split('/').filter(Boolean)
  }

  public findHeaders(header: string): string {
    const headers = this.request.split('\r\n')
    const headerFound = headers
      .find((item) => item.toLowerCase().startsWith(header.toLowerCase() + ':'))
      ?.split(':')
      ?.slice(1)
      ?.join('')
      ?.trim()

    console.log({ headerFound })

    return headerFound ?? ''
  }
}
