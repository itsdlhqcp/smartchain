const PubNub = require('pubnub');
const Transaction = require('../transaction');

const credentials = {
  publishKey: 'pub-c-35f6c87b-348c-44db-a76e-88770b1f2b2c',
  subscribeKey: 'sub-c-b1b3b3af-298c-4e52-a3fe-f49035d2d4af',
  secretKey: 'sec-c-NjE3ZGFiYjMtYmVmMC00MjZjLWE2M2EtOGFkNzYzYTFkNzc1'
};

const CHANNELS_MAP = {
  TEST: 'TEST',
  BLOCK: 'BLOCK',
  TRANSACTION: 'TRANSACTION'
};

class PubSub {
  constructor({ blockchain, transactionQueue }) {
    this.pubnub = new PubNub(credentials);
    this.blockchain = blockchain;
    this.transactionQueue = transactionQueue;
    this.subscribeToChannels();
    this.listen();
  }

  subscribeToChannels() {
    this.pubnub.subscribe({
      channels: Object.values(CHANNELS_MAP)
    });
  }

  publish({ channel, message }) {
    this.pubnub.publish({ channel, message });
  }

  listen() {
    this.pubnub.addListener({
      message: messageObject => {
        const { channel, message } = messageObject;
        const parsedMessage = JSON.parse(message);

        console.log('Message received. Channel:', channel);

        switch (channel) {
          case CHANNELS_MAP.BLOCK:
            console.log('block message', message);

            this.blockchain.addBlock({
              block: parsedMessage,
              transactionQueue: this.transactionQueue
            }).then(() => console.log('New block accepted', parsedMessage))
              .catch(error => console.error('New block rejected:', error.message));
            break;
          case CHANNELS_MAP.TRANSACTION:
            console.log(`Received transaction: ${parsedMessage.id}`);

            this.transactionQueue.add(new Transaction(parsedMessage));

            break;
          default:
            return;
        }
      }
    });
  }

  broadcastBlock(block) {
    this.publish({
      channel: CHANNELS_MAP.BLOCK,
      message: JSON.stringify(block)
    });
  }

  broadcastTransaction(transaction) {
    this.publish({
      channel: CHANNELS_MAP.TRANSACTION,
      message: JSON.stringify(transaction)
    });
  }
}

module.exports = PubSub;
