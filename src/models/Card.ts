import mongoose from "mongoose";

const cardSchema = new mongoose.Schema({
  deckId: { type: mongoose.Schema.Types.ObjectId, ref: "Deck", required: true },
  userId: { type: String, required: true },
  front: { type: String, required: true },
  back: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Card = mongoose.models.Card || mongoose.model("Card", cardSchema);

export default Card;
