import mongoose, { Schema, Document } from 'mongoose';

/**
 * Google Prep progress — one document per user, whole state as a JSON string.
 * Kept deliberately separate from the NeetCode `Progress` model: nothing in
 * the Google track can touch the existing mastered list, code or notes.
 * A JSON payload (not Maps) sidesteps Mongo's field-name restrictions for
 * arbitrary keys like problem names and Excalidraw scene data.
 */
export interface IGooglePrep extends Document {
  userId: string;
  payload: string;
  updatedAt: Date;
}

const GooglePrepSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    payload: { type: String, default: '{}' },
  },
  { timestamps: true },
);

const GooglePrep = mongoose.models.GooglePrep || mongoose.model<IGooglePrep>('GooglePrep', GooglePrepSchema);
export default GooglePrep;
