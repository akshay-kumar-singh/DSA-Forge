import mongoose, { Schema, Document } from 'mongoose';

/**
 * Practice Lab — the user's own problems and designs, one document per user,
 * whole state as a JSON string. Deliberately its own collection: nothing here
 * can touch `progresses` (NeetCode) or `googlepreps` (Interview Prep).
 */
export interface IPracticeLab extends Document {
  userId: string;
  payload: string;
  updatedAt: Date;
}

const PracticeLabSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    payload: { type: String, default: '{}' },
  },
  { timestamps: true },
);

const PracticeLab = mongoose.models.PracticeLab || mongoose.model<IPracticeLab>('PracticeLab', PracticeLabSchema);
export default PracticeLab;
