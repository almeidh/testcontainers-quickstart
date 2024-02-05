const redis = require('async-redis')
const { GenericContainer } = require('testcontainers')

describe('Redis', () => {
  let container
  let redisClient

  beforeAll(async () => {
    container = await new GenericContainer('redis')
      .withExposedPorts(6379)
      .start()

    redisClient = redis.createClient(
      container.getMappedPort(6379),
      container.getHost(),
    )
  })

  it('works', async () => {
    await redisClient.set('key', 'val')
    expect(await redisClient.get('key')).toBe('val')
  })

  it('fails', async () => {
    await redisClient.set('user', "almeid")
    expect(await redisClient.get('user')).toBe('almas')
  })

  afterAll(async () => {
    await redisClient.quit()
    await container.stop()
  })
})
