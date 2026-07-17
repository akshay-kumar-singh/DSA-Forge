import mongoose, { Schema, Document } from 'mongoose';

export interface IProgress extends Document {
  userId: string;
  codeMap: Record<string, string>;
  userNotes: Record<string, string>;
  masteredProblems: string[];
  lastReviewDate: Record<string, string>;
  updatedAt: Date;
}

const ProgressSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    codeMap: { type: Map, of: String, default: {} },
    userNotes: { type: Map, of: String, default: {} },
    masteredProblems: { type: [String], default: [] },
    lastReviewDate: { type: Map, of: String, default: {} },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// If the model already exists (hot reloading), use it, otherwise create it
const Progress = mongoose.models.Progress || mongoose.model<IProgress>('Progress', ProgressSchema);

export default Progress;
