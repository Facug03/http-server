import net from 'net'

const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    const bufferToString = data.toString()

    // console.log(bufferToString)

    if (bufferToString.includes('GET /echo')) {
      const [_, path] = bufferToString.split(' ')
      const route = path.split('/')[2]

      console.log(path)

      if (!route) {
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
        return socket.end()
      }

      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${route.length}\r\n\r\n${route}`
      )
    }

    if (bufferToString.includes('GET /')) {
      socket.write('HTTP/1.1 200 OK\r\n\r\n')
      socket.end()
    }

    socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
    socket.end()
  })
})

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log('Logs from your program will appear here!')

// Uncomment this to pass the first stage
server.listen(4221, 'localhost', () => {
  console.log('Server is running on port 4221')
})
