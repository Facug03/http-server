import net from 'net'

export class Res {
  private socket: net.Socket

  constructor(socket: net.Socket) {
    this.socket = socket
  }

  send({
    body = '',
    status,
    statusCode,
    headers = {},
  }: {
    statusCode: number
    status: string
    body?: string
    headers?: Record<string, string>
  }) {
    const formattedHeaders = this.formatHeaders(headers)

    this.socket.write(
      `HTTP/1.1 ${statusCode} ${status} ${
        formattedHeaders && `'\r\n'${formattedHeaders}`
      } \r\n\r\n${body}`
    )
    this.socket.end()
  }

  private formatHeaders(headers: Record<string, string>) {
    if (Object.entries(headers).length === 0) {
      return ''
    }

    return Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\r\n')
  }
}
