import net from 'net'
import fs from 'node:fs'

const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    const bufferToString = data.toString()

    if (bufferToString.includes('GET /')) {
      const [_, path] = bufferToString.split(' ')
      const routes = path.split('/')

      if (!routes[1]) {
        socket.write('HTTP/1.1 200 OK\r\n\r\n')
        return socket.end()
      }

      if (routes[1] === 'echo' && routes[2]) {
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${routes[2].length}\r\n\r\n${routes[2]}`
        )
        return socket.end()
      }

      if (routes[1] === 'user-agent') {
        const headers = bufferToString.split('\r\n')
        console.log({ headers })
        const userAgent = headers.find((header) =>
          header.toLowerCase().includes('user-agent:')
        )

        console.log(userAgent)

        if (!userAgent) {
          socket.write('HTTP/1.1 404 Not Found\r\n\r\n')

          return socket.end()
        }

        const userAgentValue = userAgent.split(':')?.slice(1)?.join('')?.trim()

        if (!userAgentValue) {
          socket.write('HTTP/1.1 404 Not Found\r\n\r\n')

          return socket.end()
        }

        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgentValue.length}\r\n\r\n${userAgentValue}`
        )

        return socket.end()
      }

      if (routes[1] === 'files' && routes[2]) {
        const filePath = `./${routes[2]}`

        console.log(filePath)

        fs.stat(filePath, (err, stats) => {
          console.log(err, stats)
          if (err) {
            socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
            socket.end()

            return
          }

          if (stats.isDirectory()) {
            socket.write(
              `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${
                stats.size
              }\r\n\r\n${fs.readdirSync(filePath).toString()}`
            )
            socket.end()

            return
          }

          if (stats.isFile()) {
            socket.write(
              `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${
                stats.size
              }\r\n\r\n${fs.readFileSync(filePath).toString()}`
            )
            socket.end()

            return
          }
        })

        return
      }

      socket.write('HTTP/1.1 404 Not Found\r\n\r\n')

      return socket.end()
    }

    socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
    socket.end()
  })
})

server.listen(4221, 'localhost', () => {
  console.log('Server is running on port 4221')
})
