import { parallel, AsyncFunction } from 'async';
import axios, { AxiosResponse } from 'axios';

const minHeight: number = 100;
const maxHeight: number = 1000;

const URL: string = process.env.URL ? process.env.URL : 'http://127.0.0.1:8080';

const testConnection = async () => {
    const route = '/node/network'
    const connection = await axios.get(URL + route)
        .then((res) => {
            if (!res.data.isSyncing) {
                return true
            } else {
                return false
            }
        })
        .catch((err) => console.log(err));

    return connection;
}

const asyncQuery = async (height: number) => {
    await axios.get(`${URL}/blocks/${height}`)
        .then((res) => {
            console.log(res.data.number)
            return res;
        })
        .catch((err) => {
            console.log(err)
        });
}

const createIterable = (minHeight: number, maxHeight: number) => {
    const asyncFunctions: AsyncFunction<unknown>[] = [];

    for(let height = minHeight; height < maxHeight; height++) {
        const call: AsyncFunction<unknown> = () => asyncQuery(height);
        
        asyncFunctions.push(call);
    }

    return asyncFunctions;
}

const main = async () => {
    
    // Test connection 
    const connection = await testConnection();

    if (!connection) {
        console.warn('Invalid Connection, or node is currently syncing.');
        console.log('Aborting...')
        return;
    }

    const asyncCallsQueue = createIterable(minHeight, maxHeight);

    console.log(`There are ${asyncCallsQueue.length} blocks to query`)

    parallel(asyncCallsQueue, (err, results) => {
        if (err) {
            console.log(err)
        } else {
            console.log(results);
        }

    });
}

main().catch(err => console.log(err))
