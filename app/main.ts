import net from 'net'
import fs from 'node:fs'
import zlib from 'node:zlib'

import { Response } from './response'
import { Request } from './request'

const server = net.createServer((socket) => {
  socket.on('data', (request) => {
    const res = new Response(socket)
    const req = new Request(request)
    const routes = req.routes

    if (req.httpMethod === 'GET') {
      if (!routes[0]) {
        return res.send({ status: 'OK', statusCode: 200 })
      }

      console.log({ routes })

      if (routes[0] === 'echo' && routes[1]) {
        const acceptEncoding = req.findHeaders('accept-encoding')

        if (acceptEncoding) {
          const encodings = acceptEncoding
            .split(',')
            .map((encoding) => encoding.trim())

          if (encodings.includes('gzip')) {
            zlib.gzip(Buffer.from(routes[1], 'utf-8'), (err, data) => {
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
            'Content-Length': routes[1].length.toString(),
          },
          body: routes[1],
        })
      }

      if (routes[0] === 'user-agent') {
        const userAgentValue = req.findHeaders('user-agent')

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

      if (routes[0] === 'files' && routes[1]) {
        const fileName = routes[1]
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

    if (req.httpMethod === 'POST') {
      if (!routes[0]) {
        return res.send({ status: 'OK', statusCode: 200 })
      }

      if (!req.body) {
        return res.send({ status: 'Not Found', statusCode: 404 })
      }

      if (routes[0] === 'files' && routes[1]) {
        const fileName = routes[1]
        const directory = process.argv
        const filePath = directory[directory.length - 1] + '/' + fileName

        try {
          fs.writeFileSync(filePath, req.body)
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
