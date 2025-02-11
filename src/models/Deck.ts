import mongoose from "mongoose";

interface IDeck extends mongoose.Document {
  userId: string;
  title: string;
  description: string;
  topic: string;
  isPublic: boolean;
  cardCount: number;
  cards: Array<{
    front: string;
    back: string;
  }>;
  parentDeckId?: mongoose.Types.ObjectId;
  path: string;
  level: number;
  hasChildren: boolean;
}

const cardSchema = new mongoose.Schema(
  {
    front: {
      type: String,
      required: true,
    },
    back: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

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
    cards: {
      type: [cardSchema],
      default: [],
    },
    parentDeckId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deck",
      default: null,
    },
    path: {
      type: String,
      required: true,
      default: function (this: IDeck) {
        return this._id ? `/${this._id}` : null;
      },
    },
    level: {
      type: Number,
      required: true,
      default: 0,
    },
    hasChildren: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying of deck hierarchies
deckSchema.index({ path: 1 });
deckSchema.index({ parentDeckId: 1 });

// Pre-save middleware to update path
deckSchema.pre("save", async function (this: IDeck, next) {
  // Always ensure path is set, not just on parentDeckId modification
  if (!this.path || this.isModified("parentDeckId")) {
    if (!this.parentDeckId) {
      this.path = `/${this._id}`;
      this.level = 0;
    } else {
      const parent = await mongoose.model("Deck").findById(this.parentDeckId);
      if (parent) {
        this.path = `${parent.path}/${this._id}`;
        this.level = parent.level + 1;
        // Update parent's hasChildren flag
        await mongoose
          .model("Deck")
          .findByIdAndUpdate(this.parentDeckId, { hasChildren: true });
      } else {
        // If parent not found, treat as top-level deck
        this.path = `/${this._id}`;
        this.level = 0;
        this.parentDeckId = null;
      }
    }
  }
  next();
});

// Check if model exists before creating a new one
const Deck = mongoose.models.Deck || mongoose.model<IDeck>("Deck", deckSchema);

export default Deck;
