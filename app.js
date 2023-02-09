const fs = require("fs");
let transactions;

fs.readFile('./transactions.json', (error, data) => {
    if (error){
        console.log(error);
        return;
    }
    transactions = JSON.parse(data);
    findDuplicateTransactions(transactions);
});

function findDuplicateTransactions(transactions = []) {
    const duplicates = [];
    // Convert time into datetime object
    let transactionsWithDate = transactions.map(transaction => {
        return {...transaction, time: new Date(transaction["time"])};
    });

    // Generate unique identifier to be used as comparison pattern
    let transactionsWithUID = transactionsWithDate.map(transaction => {
        return {
            id: transaction["id"],
            time: transaction["time"],
            UID: `${transaction["sourceAccount"]} - ${transaction["targetAccount"]} - NUM{${transaction["amount"]}} - ${transaction["category"]}`
        }
    });

    // Sort transactions by time
    let sortedTransactions = transactionsWithUID.sort((t1,t2) => {return t1["time"]-t2["time"]});

    // Group common transactions by UID
    let groupedTransactionsByUID = Object.values(sortedTransactions.reduce((acc, current) => {
        acc[current["UID"]] = acc[current["UID"]] || [];
        acc[current["UID"]].push(current);
        return acc;
    }, {}));

    // Filter out duplicate transactions within 1 minute time frame
    groupedTransactionsByUID.forEach(group => {
        let groupedTransactionsInCloseTimeFrame = [];
        let accumulation = [group[0]];
        for(let i = 1; i< group.length; i++){
            if((group[i]["time"] - accumulation[accumulation.length-1]["time"]) / 1000 <= 60){
                accumulation.push(group[i]);
            }
            else{
                if(accumulation.length > 1){
                    groupedTransactionsInCloseTimeFrame.push(accumulation);
                }
                accumulation = [group[i]];
            }
        }
        
        if(accumulation.length > 1){
            groupedTransactionsInCloseTimeFrame.push(accumulation);
        }

        groupedTransactionsInCloseTimeFrame.forEach(group =>{
            // Retrieve back original transaction object information
            group = group.map(filteredTransaction => {
                return transactions.find(originalTransaction => originalTransaction.id === filteredTransaction.id)
            })
            duplicates.push(group);
        })
    });

    console.log(duplicates);
    return duplicates;
};

// const duplicates = [];
// const seen = new Map();

// for (let i = 0; i < transactions.length; i++) {
//     const t1 = transactions[i];
//     for (let j = i + 1; j < transactions.length; j++) {
//         const t2 = transactions[j];
        
//         if (
//             t1.sourceAccount === t2.sourceAccount &&
//             t1.targetAccount === t2.targetAccount &&
//             t1.category === t2.category &&
//             t1.amount === t2.amount &&
//             Math.abs((new Date(t1.time) - new Date(t2.time)) / 1000) <= 60
//         ) {
//             const id1 = t1.transactionId;
//             const id2 = t2.transactionId;
//             if (!seen.has(id1) && !seen.has(id2)) {
//             duplicates.push([t1, t2]);
            
//             seen.set(id1, true);
//             seen.set(id2, true);
//             }
//         }
//     }
// }

// console.log(duplicates);