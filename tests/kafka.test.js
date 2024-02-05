import tk from '@testcontainers/kafka'
import k from 'kafkajs'
const { KafkaContainer } = tk
const { Kafka, logLevel } = k

import * as chai from 'chai'
const expect = chai.expect

const kafkaMsgs = []
const sleep = (s) => {
  return new Promise((resolve) => setTimeout(resolve, s * 1000))
}

describe('Kafka', () => {
  let kafkaContainer
  let kafkaClient
  let consumer
  let producer

  before(async () => {
    kafkaContainer = await new KafkaContainer().withExposedPorts(9093).start()
    kafkaClient = new Kafka({
      brokers: [
        `${kafkaContainer.getHost()}:${kafkaContainer.getMappedPort(9093)}`,
      ],
      connectionTimeout: 300000,
      logLevel: logLevel.NOTHING,
    })
    const admin = kafkaClient.admin()
    await admin.connect()
    await admin.createTopics({
      topics: [
        {
          topic: 'test-topic',
        },
      ],
    })
    await admin.disconnect()

    consumer = kafkaClient.consumer({
      groupId: 'kafkajs-group',
    })
    producer = kafkaClient.producer()

    await consumer.connect()
    await consumer.subscribe({
      topic: 'test-topic',
      fromBeginning: true,
    })

    return sleep(10)
  })

  it('Produce', async () => {
    await producer.connect()

    const sent = await producer.send({
      topic: 'test-topic',
      messages: [{ value: 'Hello KafkaJS user!' }],
    })

    expect(sent[0].topicName).to.equal('test-topic')
    return producer.disconnect()
  })

  it('Consume', async () => {
    await producer.connect()
    for (const item of [1, 2, 3]) {
      await producer.send({
        topic: 'test-topic',
        messages: [{ value: `Hello KafkaJS user! - Message ${item}` }],
      })
    }

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        kafkaMsgs.push(message.value.toString())
      },
    })

    await sleep(10)

    expect(kafkaMsgs).to.contain('Hello KafkaJS user! - Message 3')
    await producer.disconnect()
    return consumer.disconnect()
  })

  after(async () => {
    await kafkaContainer.stop()
  })
})
