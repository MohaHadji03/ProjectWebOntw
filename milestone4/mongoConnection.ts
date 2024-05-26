import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, IUser } from './models/users';

dotenv.config();

const mongoURI: string = process.env.MONGO_URI ?? '';
const dbName: string = process.env.DB_NAME ?? '';

if (!mongoURI) {
    throw new Error("MONGO_URI is not defined in the environment variables");
}

if (!dbName) {
    throw new Error("DB_NAME is not defined in the environment variables");
}

async function connectToMongoDB(): Promise<void> {
    try {
        await mongoose.connect(mongoURI, { dbName });
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error(err);
        throw err;
    }
}

export async function addDefaultUsers() {
    const adminExists = await User.findOne({ username: 'admin' });
    const userExists = await User.findOne({ username: 'user' });

    if (!adminExists) {
        const admin: IUser = new User({
            username: 'admin',
            password: 'adminpassword', // Let op: dit is het ongehashde wachtwoord
            role: 'ADMIN'
        });
        await admin.save();
        console.log('Admin gebruiker aangemaakt');
    }

    if (!userExists) {
        const user: IUser = new User({
            username: 'user',
            password: 'userpassword', // Let op: dit is het ongehashde wachtwoord
            role: 'USER'
        });
        await user.save();
        console.log('User gebruiker aangemaakt');
    }
}

export default connectToMongoDB;
