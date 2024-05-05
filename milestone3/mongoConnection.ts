import { MongoClient, Db } from 'mongodb';

const uri = "mongodb+srv://mohammedoualdhadj:Utrecht-090619@cluster0.xccnhqe.mongodb.net/"
const client = new MongoClient(uri);

async function connectToMongoDB(): Promise<Db> {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        return client.db('Cluster0'); // Verander 'yourDatabaseName' naar jouw database
    } catch (err) {
        console.error(err);
        throw err; // Op deze manier kan de fout worden afgehandeld door de aanroepende code
    }
}

export default connectToMongoDB;