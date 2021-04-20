// no readme, just some instructions here...
// 1. edit line 12, the apiKey variable, follow the link at that line and get a free key, this will increase your quota
// 2. edit line 34, the accounts array
// 3. run using:
//     node dfuse.js > outfile.log
//
global.fetch = require("node-fetch");
global.WebSocket = require("ws");
const { createDfuseClient } = require("@dfuse/client");
const client = createDfuseClient({
  network: "eos.dfuse.eosnation.io",
  apiKey: '', // https://account.eosnation.io/dashboard/dfuse
});
// searchTransactionsBackward(query: $query, lowBlockNum: $low, limit: $limit, cursor: $cursor) {
//   cursor
//   trace {
//   block {
//     num
//     id
//     confirmed
//     timestamp
//     previous
//   }
//   id
//   matchingActions {
//     account
//     name
//     json
//     seq
//     receiver
//   }
//   }
// }
accounts = [
    'data.to:ACCOUNT_1_NAME',
  'data.from:ACCOUNT_1_NAME',
    'data.to:ACCOUNT_2_NAME',
  'data.from:ACCOUNT_2_NAME',
];
async function queryDfuse(acct) {
  const operation = `subscription($cursor: String!) {
    searchTransactionsBackward(query:"action:transfer  ${acct}", cursor: $cursor, lowBlockNum: 1) {
      cursor
      trace { id block { num timestamp } matchingActions { json } }
    }
  }`;
  const stream = await client.graphql(operation, message => {
    if (message.type === 'data') {
      const {
        cursor,
        trace: { id, matchingActions, block }
      } = message.data.searchTransactionsBackward; // javascript object destructuring
      matchingActions.forEach(({ json: { from, to, quantity, memo } }) => {
        q1='', q2=''; if(!!quantity){ [ q1, q2 ] = quantity.split(' '); } // break down "0.1234 EOS" to 2 strings => "0.1234", "EOS"
        // console.log( `${block.num},${block.timestamp},${id},${from},${to},${q1},${q2},${memo}` );
        console.log( `${block.num},${block.timestamp},${id},${from},${to},${q1},${q2}` );
      });
      stream.mark({ cursor }); // Mark stream at cursor location, on re-connect, we will start back at cursor
    }
    if (message.type === 'error') { console.log('An error occurred', message.errors, message.terminal); }
    if (message.type === 'complete') { console.log('Completed ---------------------------------'); }
  });
  // Waits until the stream completes, or forever
  await stream.join();
  await client.release();
}
main = async () => {
  for(i=0; i<accounts.length; i++){
    await queryDfuse(accounts[i]).catch(error => console.log('[AMIHDEBUG] Unexpected error', error));
    await new Promise(r => setTimeout(r, 10*1000)); // be nice to the server and give it some rest...
  }
}
main();
