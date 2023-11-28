import { Producer, Consumer, ProducerRecord, RecordMetadata } from 'kafkajs';

export class KafkaMock {
  public static messages: Array<{ topic: string; messages: any[] }> = [];
  public static eachMessage: (args: {
    message: { value: Buffer };
  }) => Promise<void>;

  producer(): Partial<Producer> {
    return {
      connect: async () => {},
      send: async ({
        topic,
        messages,
      }: ProducerRecord): Promise<RecordMetadata[]> => {
        KafkaMock.messages.push({ topic, messages });
        return [];
      },
    };
  }

  consumer(): Partial<Consumer> {
    return {
      connect: async () => {},
      subscribe: async () => {},
      run: async ({ eachMessage }: any) => {
        KafkaMock.eachMessage = eachMessage;
      },
    };
  }
}
