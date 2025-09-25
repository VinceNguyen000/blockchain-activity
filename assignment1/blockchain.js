const crypto = require('crypto');
const { diff } = require('util');

/**A single block in the chain */
class Block {
    /**
     * @param {number} index
     * @param {string} timestamp - Date.now().toString()
     * @param {any} data - transaction payload(object or array)
     * @param {string} previousHash - hex string of prev block hash
     */

    constructor(index, timestamp, data, previousHash = ''){
        this.index = index;
        this.timestamp = timestamp;
        this.data = data;
        this.previousHash = previousHash;
        this.nonce = 0; //used for mining
        this.hash =  this.calculateHash();
    }

    /** Compute SHA-256 over the block's contents */
    calculateHash(){
        return crypto
            .createHash('sha256')
            .update(
                String(this.index) + this.timestamp +
                JSON.stringify(this.data) + this.previousHash +
                String(this.nonce)
            )
            .digest('hex');
    }

    /** Proof-of-work: find a hash starting with N leading zeros */
    mineBlock(difficulty){
        const target = '0'.repeat(difficulty);
        while (this.hash.substring(0, difficulty) != target) {
            this.nonce++;
            this.hash =  this.calculateHash();
        }

        console.log(`Block mined (idx=${this.index}); ${this.hash}`);
    }
}

/** Simple Blockchain container */
class Blockchain {
    constructor(difficulty=3){
        this.chain = [this.createGenesisBlock()];
        this.difficulty =  difficulty;
    }

    createGenesisBlock(){
        return new Block(0, Date.now().toString(), 'Genesis Block', '0');
    }

    getLastestBlock() {
        return this.chain[this.chain.length-1];
    }

    /** 
     * Add a new block to the chain
     * sets its previousHash, mines it, then appends
     */

    addBlock(newBlock){
        newBlock.previousHash = this.getLastestBlock().hash;
        newBlock.mineBlock(this.difficulty);
        this.chain.push(newBlock);
    }

    /** Verify integrity: hash consitency + correct previousHash links */
    isChainValid(){
        for (let i=1; i< this.chain.length; i++){
            const current = this.chain[i];
            const previous =  this.chain[i-1];
        //recompute hash from the block's current contents
        if (current.hash != current.calculateHash())
            return false;
        //ensure link matches previous block's actual hash
        if (current.previousHash != previous.hash)
            return false;
        }        
        return true;
    }
}

/* ---------------------Demo--------------------- */
function main() {
    // 1. create a chain
    const demoCoin = new Blockchain(5);

    // 2. add block with simple transactions
    console.log('Mining block #1 ...');
    demoCoin.addBlock(new Block(1, Date.now().toString(), {
        from: 'Alice',
        to:'Bob',
        amount: 75
    }));

    console.log('Mining block #2 ...');
    demoCoin.addBlock(new Block(2, Date.now().toString(), {
        from: 'Charlie',
        to:'Dana',
        amount: 75
    }));

    console.log('Mining block #3 ...');
    demoCoin.addBlock(new Block(3, Date.now().toString(), 
    [
        {
            from: 'Eve',
            to:'Frank',
            amount: 20
        },
        {
            from: 'Gina',
            to:'Hank',
            amount: 10
        },
    ]));

    console.log('Mining block #4 ...');
    demoCoin.addBlock(new Block(4, Date.now().toString(), 
    [
        {
            from: 'Indy',
            to:'V',
            amount: 30
        },
        {
            from: 'V',
            to:'Gabi',
            amount: 30
        },
    ]));

    console.log('Mining block #5 ...');
    demoCoin.addBlock(new Block(5, Date.now().toString(), 
    [
        {
            from: 'A',
            to:'B',
            amount: 10
        },
        {
            from: 'B',
            to:'C',
            amount: 20
        },
        {
            from: 'C',
            to:'D',
            amount: 30
        },
    ]));

    // 3. show the chain
    console.log('\n Full chain:');
    console.log(JSON.stringify(demoCoin, null, 2));

    // 4. validate
    console.log('\n Is the chain valid?', demoCoin.isChainValid());

    // 5. tampered test: modify data in block #1 and re-validate
    console.log('\n tampering with block #1 data ...');
    demoCoin.chain[1].data.amount = 9999;
    console.log('is this valid after tamper?', demoCoin.isChainValid());
}

main();