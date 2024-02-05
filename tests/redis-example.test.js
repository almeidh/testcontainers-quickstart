import ar from 'async-redis'
import tc from 'testcontainers'
const { createClient } = ar
const { GenericContainer } = tc
import * as chai from 'chai'
const expect = chai.expect

describe('Redis', () => {
  let container
  let redisClient

  before(async () => {
    container = await new GenericContainer('redis')
      .withExposedPorts(6379)
      .start()

    redisClient = createClient(
      container.getMappedPort(6379),
      container.getHost(),
    )
  })

  it('Push', async () => {
    await redisClient.set('key', 'val')
    expect(await redisClient.get('key')).to.equal('val')
  })

  it('You shall not pass !', async () => {
    await redisClient.set('user', 'Almeid')
    expect(await redisClient.get('user')).to.equal('almeid')
  })

  after(async () => {
    await redisClient.quit()
    await container.stop()
  })
})
