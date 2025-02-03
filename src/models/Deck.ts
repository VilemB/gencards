import mongoose from "mongoose";

const deckSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    cardCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Check if model exists before creating a new one
const Deck = mongoose.models.Deck || mongoose.model("Deck", deckSchema);

export default Deck;
