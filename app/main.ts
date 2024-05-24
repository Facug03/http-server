import net from 'net'
import fs from 'node:fs'
import { Res } from './res'

const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    const res = new Res(socket)
    const bufferToString = data.toString()

    if (bufferToString.includes('GET /')) {
      const [_, path] = bufferToString.split(' ')
      const routes = path.split('/')

      if (!routes[1]) {
        return res.send({ status: 'OK', statusCode: 200 })
      }

      if (routes[1] === 'echo' && routes[2]) {
        return res.send({
          status: 'OK',
          statusCode: 200,
          headers: {
            'Content-Type': 'text/plain',
            'Content-Length': routes[2].length.toString(),
          },
          body: routes[2],
        })
      }

      if (routes[1] === 'user-agent') {
        const headers = bufferToString.split('\r\n')

        const userAgent = headers.find((header) =>
          header.toLowerCase().includes('user-agent:')
        )

        if (!userAgent) {
          return res.send({ status: 'Not Found', statusCode: 404 })
        }

        const userAgentValue = userAgent.split(':')?.slice(1)?.join('')?.trim()

        if (!userAgentValue) {
          return res.send({ status: 'Not Found', statusCode: 404 })
        }

        return res.send({
          status: 'OK',
          statusCode: 200,
          headers: {
            'Content-Type': 'text/plain',
            'Content-Length': userAgentValue.length.toString(),
          },
          body: userAgentValue,
        })
      }

      if (routes[1] === 'files' && routes[2]) {
        const fileName = routes[2]
        const directory = process.argv
        const filePath = directory[directory.length - 1] + '/' + fileName

        fs.stat(filePath, (err, stats) => {
          if (err) {
            return res.send({ status: 'Not Found', statusCode: 404 })
          }

          if (stats.isDirectory()) {
            return res.send({
              status: 'OK',
              statusCode: 200,
              headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Length': stats.size.toString(),
              },
              body: fs.readdirSync(filePath).toString(),
            })
          }

          if (stats.isFile()) {
            return res.send({
              status: 'OK',
              statusCode: 200,
              headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Length': stats.size.toString(),
              },
              body: fs.readFileSync(filePath).toString(),
            })
          }
        })

        return
      }
    }

    return res.send({ status: 'Not Found', statusCode: 404 })
  })
})

server.listen(4221, 'localhost', () => {
  console.log('Server is running on port 4221')
})
