import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const mongoURI: string | undefined = process.env.MONGO_URI ?? '';
const dbName = process.env.DB_NAME;

const client = new MongoClient(mongoURI);

async function connectToMongoDB(): Promise<Db> {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        return client.db('Cluster0'); 
    } catch (err) {
        console.error(err);
        throw err;
    }
}

export default connectToMongoDB;
