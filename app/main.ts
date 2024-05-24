import net from 'net'
import fs from 'node:fs'
import { Response } from './res'

const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    const res = new Response(socket)
    const bufferToString = data.toString()

    if (bufferToString.includes('GET /')) {
      const [_, path] = bufferToString.split(' ')
      const routes = path.split('/')
      const headers = bufferToString.split('\r\n')

      if (!routes[1]) {
        return res.send({ status: 'OK', statusCode: 200 })
      }

      if (routes[1] === 'echo' && routes[2]) {
        const acceptEncoding = headers
          .find((header) => header.toLowerCase().includes('accept-encoding:'))
          ?.split(':')
          ?.slice(1)
          ?.join('')
          ?.trim()

        if (acceptEncoding) {
          const encodings = acceptEncoding
            .split(',')
            .map((encoding) => encoding.trim())

          if (encodings.includes('gzip')) {
            return res.send({
              status: 'OK',
              statusCode: 200,
              headers: {
                'Content-Type': 'text/plain',
                'Content-Length': routes[2].length.toString(),
                'Content-Encoding': 'gzip',
              },
              body: routes[2],
            })
          }
        }

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

    if (bufferToString.includes('POST /')) {
      const [_, path] = bufferToString.split(' ')
      const routes = path.split('/')
      const body = bufferToString.split('\r\n\r\n')[1]

      if (!routes[1]) {
        return res.send({ status: 'OK', statusCode: 200 })
      }

      if (routes[1] === 'files' && routes[2]) {
        const fileName = routes[2]
        const directory = process.argv
        const filePath = directory[directory.length - 1] + '/' + fileName

        try {
          fs.writeFileSync(filePath, body)
        } catch (err) {
          return res.send({
            status: 'Internal error saving the file.',
            statusCode: 500,
          })
        }

        return res.send({ status: 'Created', statusCode: 201 })
      }
    }

    return res.send({ status: 'Not Found', statusCode: 404 })
  })
})

server.listen(4221, 'localhost', () => {
  console.log('Server is running on port 4221')
})
