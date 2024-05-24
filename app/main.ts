import net from 'net'
import fs from 'node:fs'
import zlib from 'node:zlib'

import { Response } from './response'
import { Request } from './request'

const server = net.createServer((socket) => {
  socket.on('data', (request) => {
    const res = new Response(socket)
    const { httpMethod, routes, findHeaders, body } = new Request(request)

    if (httpMethod === 'GET') {
      if (!routes[1]) {
        return res.send({ status: 'OK', statusCode: 200 })
      }

      if (routes[1] === 'echo' && routes[2]) {
        const acceptEncoding = findHeaders('accept-encoding:')

        if (acceptEncoding) {
          const encodings = acceptEncoding
            .split(',')
            .map((encoding) => encoding.trim())

          if (encodings.includes('gzip')) {
            zlib.gzip(Buffer.from(routes[2], 'utf-8'), (err, data) => {
              if (err) {
                return res.send({
                  status: 'Internal server error',
                  statusCode: 500,
                })
              }

              return res.send({
                status: 'OK',
                statusCode: 200,
                headers: {
                  'Content-Type': 'text/plain',
                  'Content-Length': data.length.toString(),
                  'Content-Encoding': 'gzip',
                },
                body: data,
              })
            })

            return
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
        const userAgentValue = findHeaders('user-agent:')

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

    if (httpMethod === 'POST') {
      if (!routes[1]) {
        return res.send({ status: 'OK', statusCode: 200 })
      }

      if (!body) {
        return res.send({ status: 'Not Found', statusCode: 404 })
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
