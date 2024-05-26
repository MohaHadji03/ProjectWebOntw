import mongoose, { Document } from 'mongoose';

export interface IUser extends Document {
    username: string;
    password: string;
    role: string;
}

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true }
});

export const User = mongoose.model<IUser>('User', userSchema);
